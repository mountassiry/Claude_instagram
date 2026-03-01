import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  where,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Conversation, Message, MessageType } from '../types';
import { FIREBASE_COLLECTIONS } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, FIREBASE_COLLECTIONS.CONVERSATIONS),
      where('participantIds', 'array-contains', user.id),
      orderBy('lastActivity', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          type: raw.type,
          name: raw.name,
          avatarUrl: raw.avatarUrl,
          participantIds: raw.participantIds || [],
          lastActivity: raw.lastActivity?.toDate() || new Date(),
          unreadCount: raw.unreadCount || 0,
          isArchived: raw.isArchived || false,
          isPinned: raw.isPinned || false,
          adminIds: raw.adminIds,
          description: raw.description,
          createdAt: raw.createdAt?.toDate() || new Date(),
        } as Conversation;
      });
      setConversations(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  return { conversations, loading };
};

export const useMessages = (conversationId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) return;
    const q = query(
      collection(db, FIREBASE_COLLECTIONS.CONVERSATIONS, conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          conversationId,
          senderId: raw.senderId,
          type: raw.type as MessageType,
          text: raw.text,
          mediaUrl: raw.mediaUrl,
          replyToId: raw.replyToId,
          status: raw.status,
          reactions: raw.reactions || [],
          isDeleted: raw.isDeleted || false,
          createdAt: raw.createdAt?.toDate() || new Date(),
          editedAt: raw.editedAt?.toDate(),
        } as Message;
      });
      setMessages(data);
      setLoading(false);
    });
    return unsub;
  }, [conversationId]);

  return { messages, loading };
};

export const useMessageActions = () => {
  const { user } = useAuth();

  const sendMessage = async (
    conversationId: string,
    text: string,
    type: MessageType = 'text',
    mediaUrl?: string,
    replyToId?: string
  ) => {
    if (!user) return;
    const msgRef = collection(db, FIREBASE_COLLECTIONS.CONVERSATIONS, conversationId, 'messages');
    await addDoc(msgRef, {
      senderId: user.id,
      type,
      text: text || null,
      mediaUrl: mediaUrl || null,
      replyToId: replyToId || null,
      status: 'sent',
      reactions: [],
      isDeleted: false,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, FIREBASE_COLLECTIONS.CONVERSATIONS, conversationId), {
      lastActivity: serverTimestamp(),
    });
  };

  const createDirectConversation = async (otherUserId: string): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    // Check if conversation already exists
    const q = query(
      collection(db, FIREBASE_COLLECTIONS.CONVERSATIONS),
      where('type', '==', 'direct'),
      where('participantIds', 'array-contains', user.id)
    );
    const snap = await getDocs(q);
    const existing = snap.docs.find((d) => {
      const ids: string[] = d.data().participantIds || [];
      return ids.includes(otherUserId);
    });
    if (existing) return existing.id;

    const ref = doc(collection(db, FIREBASE_COLLECTIONS.CONVERSATIONS));
    await setDoc(ref, {
      type: 'direct',
      participantIds: [user.id, otherUserId],
      lastActivity: serverTimestamp(),
      unreadCount: 0,
      isArchived: false,
      isPinned: false,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  };

  const createGroupConversation = async (
    name: string,
    participantIds: string[]
  ): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    const ref = doc(collection(db, FIREBASE_COLLECTIONS.CONVERSATIONS));
    await setDoc(ref, {
      type: 'group',
      name,
      participantIds: [user.id, ...participantIds],
      adminIds: [user.id],
      lastActivity: serverTimestamp(),
      unreadCount: 0,
      isArchived: false,
      isPinned: false,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  };

  const reactToMessage = async (conversationId: string, messageId: string, emoji: string) => {
    if (!user) return;
    const msgRef = doc(db, FIREBASE_COLLECTIONS.CONVERSATIONS, conversationId, 'messages', messageId);
    // Toggle reaction
    const snap = await getDocs(
      query(collection(db, FIREBASE_COLLECTIONS.CONVERSATIONS, conversationId, 'messages'))
    );
    const msgDoc = snap.docs.find((d) => d.id === messageId);
    if (!msgDoc) return;
    const reactions: { userId: string; emoji: string }[] = msgDoc.data().reactions || [];
    const idx = reactions.findIndex((r) => r.userId === user.id && r.emoji === emoji);
    if (idx >= 0) {
      reactions.splice(idx, 1);
    } else {
      reactions.push({ userId: user.id, emoji });
    }
    await updateDoc(msgRef, { reactions });
  };

  return { sendMessage, createDirectConversation, createGroupConversation, reactToMessage };
};
