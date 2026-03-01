import { useCallback, useEffect, useRef, useState } from 'react';
import { useIdentity } from '../contexts/IdentityContext';
import { useMessaging } from '../contexts/MessagingContext';
import { signalingClient } from '../networking/signaling';
import {
  getMessages,
  insertMessage,
  updateMessageStatus,
  upsertConversation,
  updateLastMessage,
  getContact,
  findDirectConversation,
  MessageRow,
} from '../database';
import uuidLib from 'react-native-uuid';
const uuid = () => uuidLib.v4() as string;

export function useConversationMessages(conversationId: string) {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { subscribeToConversation } = useMessaging();

  const load = useCallback(async () => {
    const rows = await getMessages(conversationId);
    setMessages(rows);
  }, [conversationId]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  // Listen for new incoming messages in this conversation
  useEffect(() => {
    return subscribeToConversation(conversationId, (msg) => {
      setMessages(prev => [...prev, msg]);
    });
  }, [conversationId, subscribeToConversation]);

  return { messages, loading, refresh: load };
}

/** Hook for sending encrypted messages in a direct conversation. */
export function useSendMessage(conversationId: string, recipientPeerId: string) {
  const { identity } = useIdentity();
  const [sending, setSending] = useState(false);

  const sendText = useCallback(async (text: string): Promise<MessageRow | null> => {
    if (!identity || !text.trim()) return null;
    setSending(true);
    try {
      const contact = await getContact(recipientPeerId);
      if (!contact) throw new Error('Contact not found');

      const msgId = uuid();
      const now = Date.now();

      const msgRow: MessageRow = {
        id: msgId,
        conversationId,
        senderId: identity.peerId,
        type: 'text',
        text,
        mediaUri: null,
        mimeType: null,
        status: 'sending',
        createdAt: now,
      };

      await insertMessage(msgRow);
      await updateLastMessage(conversationId, text, now);

      // Encrypt and send via signaling
      const content = {
        id: msgId,
        conversationId,
        type: 'text',
        text,
        createdAt: now,
      };

      await signalingClient.sendEncrypted(
        recipientPeerId,
        contact.encryptionPublicKey,
        msgId,
        content,
        'chat',
      );

      await updateMessageStatus(msgId, 'sent');
      return { ...msgRow, status: 'sent' };
    } catch (err) {
      console.error('[useSendMessage] Error:', err);
      return null;
    } finally {
      setSending(false);
    }
  }, [identity, conversationId, recipientPeerId]);

  return { sendText, sending };
}

/** Create or find a direct conversation with a contact. */
export function useOrCreateConversation() {
  const { identity } = useIdentity();

  return useCallback(async (recipientPeerId: string): Promise<string> => {
    if (!identity) throw new Error('No identity');

    const existing = await findDirectConversation(identity.peerId, recipientPeerId);
    if (existing) return existing.id;

    const contact = await getContact(recipientPeerId);
    const convId = uuid();
    await upsertConversation({
      id: convId,
      type: 'direct',
      name: contact?.displayName ?? recipientPeerId,
      participantIds: [identity.peerId, recipientPeerId],
      lastMessageText: null,
      lastMessageAt: null,
      createdAt: Date.now(),
    });
    return convId;
  }, [identity]);
}
