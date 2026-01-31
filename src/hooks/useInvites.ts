import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { InviteCode } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { generateInviteCode } from '../utils/helpers';
import { INVITE_EXPIRY_DAYS } from '../config/constants';

export const useInvites = () => {
  const [invites, setInvites] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const invitesRef = collection(db, 'invites');
    const q = query(invitesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invitesData: InviteCode[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        expiresAt: doc.data().expiresAt?.toDate() || new Date(),
        usedAt: doc.data().usedAt?.toDate() || undefined,
      })) as InviteCode[];

      setInvites(invitesData);
      setLoading(false);
    });

    return unsubscribe;
  }, [isAdmin]);

  const createInvite = useCallback(async (): Promise<string> => {
    if (!user || !isAdmin) {
      throw new Error('Only admins can create invites');
    }

    // Generate unique code
    let code = generateInviteCode();
    let isUnique = false;

    while (!isUnique) {
      const invitesRef = collection(db, 'invites');
      const q = query(invitesRef, where('code', '==', code));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        isUnique = true;
      } else {
        code = generateInviteCode();
      }
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    const inviteData = {
      code,
      createdBy: user.id,
      createdAt: new Date(),
      isUsed: false,
      expiresAt,
    };

    await addDoc(collection(db, 'invites'), inviteData);
    return code;
  }, [user, isAdmin]);

  const deleteInvite = useCallback(async (inviteId: string) => {
    if (!isAdmin) {
      throw new Error('Only admins can delete invites');
    }
    await deleteDoc(doc(db, 'invites', inviteId));
  }, [isAdmin]);

  const getActiveInvites = useCallback(() => {
    const now = new Date();
    return invites.filter((invite) => !invite.isUsed && invite.expiresAt > now);
  }, [invites]);

  const getUsedInvites = useCallback(() => {
    return invites.filter((invite) => invite.isUsed);
  }, [invites]);

  const getExpiredInvites = useCallback(() => {
    const now = new Date();
    return invites.filter((invite) => !invite.isUsed && invite.expiresAt <= now);
  }, [invites]);

  return {
    invites,
    loading,
    createInvite,
    deleteInvite,
    getActiveInvites,
    getUsedInvites,
    getExpiredInvites,
  };
};
