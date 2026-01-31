import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  where,
} from 'firebase/firestore';
import { ref, deleteObject, listAll } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser, isAdmin } = useAuth();

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: User[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as User[];

      setUsers(usersData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const toggleUserStatus = useCallback(async (userId: string, isActive: boolean) => {
    if (!isAdmin) {
      throw new Error('Only admins can modify user status');
    }

    if (userId === currentUser?.id) {
      throw new Error('Cannot deactivate your own account');
    }

    await updateDoc(doc(db, 'users', userId), { isActive });
  }, [isAdmin, currentUser]);

  const makeAdmin = useCallback(async (userId: string) => {
    if (!isAdmin) {
      throw new Error('Only admins can promote users');
    }
    await updateDoc(doc(db, 'users', userId), { role: 'admin' });
  }, [isAdmin]);

  const removeAdmin = useCallback(async (userId: string) => {
    if (!isAdmin) {
      throw new Error('Only admins can demote users');
    }

    if (userId === currentUser?.id) {
      throw new Error('Cannot remove your own admin status');
    }

    // Check if this is the last admin
    const admins = users.filter((u) => u.role === 'admin');
    if (admins.length <= 1) {
      throw new Error('Cannot remove the last admin');
    }

    await updateDoc(doc(db, 'users', userId), { role: 'member' });
  }, [isAdmin, currentUser, users]);

  const removeUser = useCallback(async (userId: string) => {
    if (!isAdmin) {
      throw new Error('Only admins can remove users');
    }

    if (userId === currentUser?.id) {
      throw new Error('Cannot remove your own account');
    }

    // Delete user's posts and their media
    const postsRef = collection(db, 'posts');
    const postsQuery = query(postsRef, where('userId', '==', userId));
    const postsSnapshot = await getDocs(postsQuery);

    for (const postDoc of postsSnapshot.docs) {
      // Delete comments on this post
      const commentsRef = collection(db, 'comments');
      const commentsQuery = query(commentsRef, where('postId', '==', postDoc.id));
      const commentsSnapshot = await getDocs(commentsQuery);
      await Promise.all(commentsSnapshot.docs.map((doc) => deleteDoc(doc.ref)));

      // Delete the post
      await deleteDoc(postDoc.ref);
    }

    // Delete user's media folder from storage
    try {
      const userStorageRef = ref(storage, `posts/${userId}`);
      const files = await listAll(userStorageRef);
      await Promise.all(files.items.map((file) => deleteObject(file)));
    } catch (error) {
      console.log('Error deleting user storage:', error);
    }

    // Delete user's comments on other posts
    const userCommentsRef = collection(db, 'comments');
    const userCommentsQuery = query(userCommentsRef, where('userId', '==', userId));
    const userCommentsSnapshot = await getDocs(userCommentsQuery);
    await Promise.all(userCommentsSnapshot.docs.map((doc) => deleteDoc(doc.ref)));

    // Delete user document
    await deleteDoc(doc(db, 'users', userId));
  }, [isAdmin, currentUser]);

  const getActiveUsers = useCallback(() => {
    return users.filter((u) => u.isActive);
  }, [users]);

  const getInactiveUsers = useCallback(() => {
    return users.filter((u) => !u.isActive);
  }, [users]);

  const getAdmins = useCallback(() => {
    return users.filter((u) => u.role === 'admin');
  }, [users]);

  return {
    users,
    loading,
    toggleUserStatus,
    makeAdmin,
    removeAdmin,
    removeUser,
    getActiveUsers,
    getInactiveUsers,
    getAdmins,
  };
};
