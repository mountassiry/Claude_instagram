/**
 * MessagingContext — manages the P2P signaling connection and routes
 * incoming encrypted messages to the right conversation.
 *
 * All messages are encrypted with NaCl box before leaving the device.
 * The signaling server only ever sees ciphertext — it cannot read content.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useIdentity } from './IdentityContext';
import { signalingClient } from '../networking/signaling';
import { EncryptedPayload } from '../crypto/encryption';
import { decryptMessage } from '../crypto/encryption';
import { decodeBase64 } from 'tweetnacl-util';
import {
  insertMessage,
  upsertConversation,
  updateLastMessage,
  incrementUnread,
  getContact,
  findDirectConversation,
  MessageRow,
} from '../database';
import uuidLib from 'react-native-uuid';
const uuid = () => uuidLib.v4() as string;

export type NewMessageListener = (msg: MessageRow) => void;

interface MessagingContextValue {
  isConnected: boolean;
  /** Subscribe to new messages in a conversation. Returns unsubscribe fn. */
  subscribeToConversation: (conversationId: string, listener: NewMessageListener) => () => void;
  /** Subscribe to any new message (for conversations list). */
  subscribeToAny: (listener: NewMessageListener) => () => void;
}

const MessagingContext = createContext<MessagingContextValue | null>(null);

/** Decoded inner message content (after decryption) */
interface ChatContent {
  id: string;
  conversationId: string;
  type: 'text' | 'image' | 'video' | 'audio';
  text?: string;
  mediaData?: string;  // base64 encoded media
  mimeType?: string;
  createdAt: number;
}

/** Post/like/comment content types */
interface PostContent {
  postId: string;
  [key: string]: unknown;
}

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { identity } = useIdentity();
  const [isConnected, setIsConnected] = useState(false);
  const convListeners = useRef<Map<string, Set<NewMessageListener>>>(new Map());
  const anyListeners = useRef<Set<NewMessageListener>>(new Set());

  const notifyListeners = useCallback((msg: MessageRow) => {
    const listeners = convListeners.current.get(msg.conversationId);
    listeners?.forEach(l => l(msg));
    anyListeners.current.forEach(l => l(msg));
  }, []);

  const handleIncoming = useCallback(
    async (fromPeerId: string, payload: EncryptedPayload, _msgId: string) => {
      if (!identity) return;

      // Lookup sender's encryption public key from contacts
      const contact = await getContact(fromPeerId);
      if (!contact) {
        // Unknown sender — ignore for now
        console.warn('[Messaging] Message from unknown peer:', fromPeerId);
        return;
      }

      const senderEncPublicKey = decodeBase64(contact.encryptionPublicKey);
      const content = decryptMessage<ChatContent>(
        payload,
        senderEncPublicKey,
        identity.encryptionKeyPair.secretKey,
      );

      if (!content) {
        console.warn('[Messaging] Failed to decrypt message from', fromPeerId);
        return;
      }

      // Ensure conversation exists
      let conversationId = content.conversationId;
      const existing = await findDirectConversation(identity.peerId, fromPeerId);
      if (!existing) {
        conversationId = uuid();
        await upsertConversation({
          id: conversationId,
          type: 'direct',
          name: contact.displayName,
          participantIds: [identity.peerId, fromPeerId],
          lastMessageText: content.text ?? '[media]',
          lastMessageAt: content.createdAt,
          createdAt: content.createdAt,
        });
      } else {
        conversationId = existing.id;
      }

      const messageRow: MessageRow = {
        id: content.id,
        conversationId,
        senderId: fromPeerId,
        type: content.type,
        text: content.text ?? null,
        mediaUri: null, // media saved separately if mediaData present
        mimeType: content.mimeType ?? null,
        status: 'delivered',
        createdAt: content.createdAt,
      };

      await insertMessage(messageRow);
      await updateLastMessage(conversationId, content.text ?? '[media]', content.createdAt);
      await incrementUnread(conversationId);

      notifyListeners(messageRow);
    },
    [identity, notifyListeners],
  );

  // Connect when identity is ready
  useEffect(() => {
    if (!identity) return;

    signalingClient.connect(
      identity,
      handleIncoming,
      (status) => setIsConnected(status === 'connected'),
    );

    return () => {
      signalingClient.disconnect();
    };
  }, [identity, handleIncoming]);

  const subscribeToConversation = useCallback((conversationId: string, listener: NewMessageListener) => {
    if (!convListeners.current.has(conversationId)) {
      convListeners.current.set(conversationId, new Set());
    }
    convListeners.current.get(conversationId)!.add(listener);
    return () => {
      convListeners.current.get(conversationId)?.delete(listener);
    };
  }, []);

  const subscribeToAny = useCallback((listener: NewMessageListener) => {
    anyListeners.current.add(listener);
    return () => {
      anyListeners.current.delete(listener);
    };
  }, []);

  return (
    <MessagingContext.Provider value={{ isConnected, subscribeToConversation, subscribeToAny }}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging(): MessagingContextValue {
  const ctx = useContext(MessagingContext);
  if (!ctx) throw new Error('useMessaging must be used inside MessagingProvider');
  return ctx;
}
