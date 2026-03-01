import { useState, useEffect } from 'react';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types';
import { FIREBASE_COLLECTIONS } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';

export const useUser = (userId: string) => {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    getDoc(doc(db, FIREBASE_COLLECTIONS.USERS, userId)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setProfile({
          id: snap.id,
          username: d.username || '',
          email: d.email || '',
          displayName: d.displayName || '',
          bio: d.bio || '',
          avatarUrl: d.avatarUrl || '',
          coverUrl: d.coverUrl,
          followersCount: d.followersCount || 0,
          followingCount: d.followingCount || 0,
          postsCount: d.postsCount || 0,
          isVerified: d.isVerified || false,
          isPrivate: d.isPrivate || false,
          createdAt: d.createdAt?.toDate() || new Date(),
          website: d.website,
        });
      }
      setLoading(false);
    });
  }, [userId]);

  return { profile, loading };
};

export const useSearchUsers = (searchQuery: string) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, FIREBASE_COLLECTIONS.USERS),
      where('username', '>=', searchQuery.toLowerCase()),
      where('username', '<=', searchQuery.toLowerCase() + '\uf8ff'),
      limit(20)
    );
    getDocs(q).then((snap) => {
      const data = snap.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          username: raw.username || '',
          email: raw.email || '',
          displayName: raw.displayName || '',
          bio: raw.bio || '',
          avatarUrl: raw.avatarUrl || '',
          followersCount: raw.followersCount || 0,
          followingCount: raw.followingCount || 0,
          postsCount: raw.postsCount || 0,
          isVerified: raw.isVerified || false,
          isPrivate: raw.isPrivate || false,
          createdAt: raw.createdAt?.toDate() || new Date(),
        } as User;
      });
      setUsers(data);
      setLoading(false);
    });
  }, [searchQuery]);

  return { users, loading };
};

export const useFollowActions = () => {
  const { user } = useAuth();

  const checkIsFollowing = async (targetUserId: string): Promise<boolean> => {
    if (!user) return false;
    const followRef = doc(db, FIREBASE_COLLECTIONS.FOLLOWS, `${user.id}_${targetUserId}`);
    const snap = await getDoc(followRef);
    return snap.exists();
  };

  const toggleFollow = async (targetUserId: string) => {
    if (!user || user.id === targetUserId) return;
    const followRef = doc(db, FIREBASE_COLLECTIONS.FOLLOWS, `${user.id}_${targetUserId}`);
    const snap = await getDoc(followRef);
    if (snap.exists()) {
      await deleteDoc(followRef);
    } else {
      await setDoc(followRef, {
        followerId: user.id,
        followingId: targetUserId,
        createdAt: serverTimestamp(),
      });
    }
  };

  return { checkIsFollowing, toggleFollow };
};

export const useSuggestedUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, FIREBASE_COLLECTIONS.USERS),
      orderBy('followersCount', 'desc'),
      limit(10)
    );
    getDocs(q).then((snap) => {
      const data = snap.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          username: raw.username || '',
          email: raw.email || '',
          displayName: raw.displayName || '',
          bio: raw.bio || '',
          avatarUrl: raw.avatarUrl || '',
          followersCount: raw.followersCount || 0,
          followingCount: raw.followingCount || 0,
          postsCount: raw.postsCount || 0,
          isVerified: raw.isVerified || false,
          isPrivate: raw.isPrivate || false,
          createdAt: raw.createdAt?.toDate() || new Date(),
        } as User;
      });
      setUsers(data);
      setLoading(false);
    });
  }, []);

  return { users, loading };
};
