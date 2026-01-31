import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  deleteDoc,
  getDocs,
  where,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { Post, Comment, UserTag } from '../types';
import { useAuth } from '../contexts/AuthContext';

const POSTS_PER_PAGE = 10;

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'), limit(POSTS_PER_PAGE));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData: Post[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Post[];

      setPosts(postsData);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || !lastDoc) return;

    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(POSTS_PER_PAGE)
    );

    const snapshot = await getDocs(q);
    const newPosts: Post[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Post[];

    setPosts((prev) => [...prev, ...newPosts]);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
    setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
  }, [hasMore, lastDoc]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'), limit(POSTS_PER_PAGE));

    const snapshot = await getDocs(q);
    const postsData: Post[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Post[];

    setPosts(postsData);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
    setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
    setRefreshing(false);
  }, []);

  const likePost = useCallback(async (postId: string) => {
    if (!user) return;

    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      likes: arrayUnion(user.id),
    });
  }, [user]);

  const unlikePost = useCallback(async (postId: string) => {
    if (!user) return;

    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      likes: arrayRemove(user.id),
    });
  }, [user]);

  const createPost = useCallback(async (
    mediaUri: string,
    mediaType: 'image' | 'video',
    caption: string,
    tags: UserTag[] = []
  ) => {
    if (!user) throw new Error('Must be logged in to create a post');

    // Upload media to Firebase Storage
    const response = await fetch(mediaUri);
    const blob = await response.blob();
    const filename = `posts/${user.id}/${Date.now()}.${mediaType === 'image' ? 'jpg' : 'mp4'}`;
    const storageRef = ref(storage, filename);

    await uploadBytes(storageRef, blob);
    const mediaUrl = await getDownloadURL(storageRef);

    // Create post document
    const postData = {
      userId: user.id,
      username: user.username,
      userDisplayName: user.displayName,
      userPhotoURL: user.photoURL || null,
      mediaUrl,
      mediaType,
      caption,
      likes: [],
      commentsCount: 0,
      tags,
      createdAt: new Date(),
    };

    await addDoc(collection(db, 'posts'), postData);
  }, [user]);

  const deletePost = useCallback(async (postId: string, mediaUrl: string) => {
    // Delete media from storage
    try {
      const storageRef = ref(storage, mediaUrl);
      await deleteObject(storageRef);
    } catch (error) {
      console.log('Error deleting media from storage:', error);
    }

    // Delete all comments
    const commentsRef = collection(db, 'comments');
    const q = query(commentsRef, where('postId', '==', postId));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Delete post
    await deleteDoc(doc(db, 'posts', postId));
  }, []);

  return {
    posts,
    loading,
    refreshing,
    hasMore,
    loadMore,
    refresh,
    likePost,
    unlikePost,
    createPost,
    deletePost,
  };
};

export const useComments = (postId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef,
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData: Comment[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Comment[];

      setComments(commentsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [postId]);

  const addComment = useCallback(async (text: string) => {
    if (!user) throw new Error('Must be logged in to comment');

    const commentData = {
      postId,
      userId: user.id,
      username: user.username,
      userDisplayName: user.displayName,
      userPhotoURL: user.photoURL || null,
      text,
      createdAt: new Date(),
    };

    await addDoc(collection(db, 'comments'), commentData);

    // Update comments count on post
    const postRef = doc(db, 'posts', postId);
    const commentsRef = collection(db, 'comments');
    const q = query(commentsRef, where('postId', '==', postId));
    const snapshot = await getDocs(q);
    await updateDoc(postRef, { commentsCount: snapshot.size });
  }, [postId, user]);

  const deleteComment = useCallback(async (commentId: string) => {
    await deleteDoc(doc(db, 'comments', commentId));

    // Update comments count on post
    const postRef = doc(db, 'posts', postId);
    const commentsRef = collection(db, 'comments');
    const q = query(commentsRef, where('postId', '==', postId));
    const snapshot = await getDocs(q);
    await updateDoc(postRef, { commentsCount: snapshot.size - 1 });
  }, [postId]);

  return {
    comments,
    loading,
    addComment,
    deleteComment,
  };
};
