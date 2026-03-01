import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  setDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Post, PostType } from '../types';
import { FIREBASE_COLLECTIONS } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';

export const useFeedPosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, FIREBASE_COLLECTIONS.POSTS),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          authorId: raw.authorId,
          type: raw.type as PostType,
          caption: raw.caption || '',
          hashtags: raw.hashtags || [],
          mediaUrls: raw.mediaUrls || [],
          thumbnailUrl: raw.thumbnailUrl,
          likesCount: raw.likesCount || 0,
          commentsCount: raw.commentsCount || 0,
          repostsCount: raw.repostsCount || 0,
          bookmarksCount: raw.bookmarksCount || 0,
          location: raw.location,
          createdAt: raw.createdAt?.toDate() || new Date(),
          updatedAt: raw.updatedAt?.toDate() || new Date(),
        } as Post;
      });
      setPosts(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { posts, loading };
};

export const useUserPosts = (userId: string) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, FIREBASE_COLLECTIONS.POSTS),
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          authorId: raw.authorId,
          type: raw.type as PostType,
          caption: raw.caption || '',
          hashtags: raw.hashtags || [],
          mediaUrls: raw.mediaUrls || [],
          thumbnailUrl: raw.thumbnailUrl,
          likesCount: raw.likesCount || 0,
          commentsCount: raw.commentsCount || 0,
          repostsCount: raw.repostsCount || 0,
          bookmarksCount: raw.bookmarksCount || 0,
          createdAt: raw.createdAt?.toDate() || new Date(),
          updatedAt: raw.updatedAt?.toDate() || new Date(),
        } as Post;
      });
      setPosts(data);
      setLoading(false);
    });
    return unsub;
  }, [userId]);

  return { posts, loading };
};

export const usePostActions = () => {
  const { user } = useAuth();

  const likePost = async (postId: string) => {
    if (!user) return;
    const likeRef = doc(db, FIREBASE_COLLECTIONS.LIKES, `${postId}_${user.id}`);
    const likeSnap = await getDocs(
      query(collection(db, FIREBASE_COLLECTIONS.LIKES), where('postId', '==', postId), where('userId', '==', user.id))
    );
    if (likeSnap.empty) {
      await setDoc(likeRef, { postId, userId: user.id, createdAt: serverTimestamp() });
      await updateDoc(doc(db, FIREBASE_COLLECTIONS.POSTS, postId), { likesCount: increment(1) });
    } else {
      await deleteDoc(likeRef);
      await updateDoc(doc(db, FIREBASE_COLLECTIONS.POSTS, postId), { likesCount: increment(-1) });
    }
  };

  const createPost = async (data: {
    type: PostType;
    caption: string;
    mediaUrls: string[];
    hashtags: string[];
    location?: string;
  }) => {
    if (!user) return;
    await addDoc(collection(db, FIREBASE_COLLECTIONS.POSTS), {
      authorId: user.id,
      ...data,
      likesCount: 0,
      commentsCount: 0,
      repostsCount: 0,
      bookmarksCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const deletePost = async (postId: string) => {
    await deleteDoc(doc(db, FIREBASE_COLLECTIONS.POSTS, postId));
  };

  const repostPost = async (postId: string) => {
    if (!user) return;
    await addDoc(collection(db, FIREBASE_COLLECTIONS.POSTS), {
      authorId: user.id,
      type: 'tweet' as PostType,
      caption: '',
      hashtags: [],
      mediaUrls: [],
      originalPostId: postId,
      repostedBy: user.id,
      likesCount: 0,
      commentsCount: 0,
      repostsCount: 0,
      bookmarksCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, FIREBASE_COLLECTIONS.POSTS, postId), { repostsCount: increment(1) });
  };

  return { likePost, createPost, deletePost, repostPost };
};

export const useComments = (postId: string) => {
  const [comments, setComments] = useState<import('../types').Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;
    const q = query(
      collection(db, FIREBASE_COLLECTIONS.COMMENTS),
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          postId: raw.postId,
          authorId: raw.authorId,
          text: raw.text || '',
          likesCount: raw.likesCount || 0,
          replyToId: raw.replyToId,
          createdAt: raw.createdAt?.toDate() || new Date(),
        } as import('../types').Comment;
      });
      setComments(data);
      setLoading(false);
    });
    return unsub;
  }, [postId]);

  return { comments, loading };
};
