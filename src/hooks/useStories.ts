import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Story, StoryGroup, StoryMediaType } from '../types';
import { FIREBASE_COLLECTIONS, STORY_EXPIRY_HOURS } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';

export const useStoryGroups = () => {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() - STORY_EXPIRY_HOURS);

    const q = query(
      collection(db, FIREBASE_COLLECTIONS.STORIES),
      where('createdAt', '>=', Timestamp.fromDate(expiryDate)),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const storiesMap = new Map<string, Story[]>();
      snap.docs.forEach((d) => {
        const raw = d.data();
        const story: Story = {
          id: d.id,
          authorId: raw.authorId,
          mediaUrl: raw.mediaUrl,
          mediaType: raw.mediaType as StoryMediaType,
          text: raw.text,
          textColor: raw.textColor,
          backgroundColor: raw.backgroundColor,
          duration: raw.duration || 5,
          viewsCount: raw.viewsCount || 0,
          viewers: raw.viewers || [],
          expiresAt: raw.expiresAt?.toDate() || new Date(),
          createdAt: raw.createdAt?.toDate() || new Date(),
        };
        const existing = storiesMap.get(raw.authorId) || [];
        storiesMap.set(raw.authorId, [...existing, story]);
      });

      const groups: StoryGroup[] = Array.from(storiesMap.entries()).map(([userId, stories]) => ({
        userId,
        user: { id: userId } as any,
        stories,
        hasUnviewed: user ? !stories[0]?.viewers?.includes(user.id) : true,
        lastUpdated: stories[0]?.createdAt || new Date(),
      }));

      setStoryGroups(groups);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  return { storyGroups, loading };
};

export const useCreateStory = () => {
  const { user } = useAuth();

  const createStory = async (data: {
    mediaUrl?: string;
    mediaType: StoryMediaType;
    text?: string;
    textColor?: string;
    backgroundColor?: string;
    duration?: number;
  }) => {
    if (!user) return;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + STORY_EXPIRY_HOURS);

    await addDoc(collection(db, FIREBASE_COLLECTIONS.STORIES), {
      authorId: user.id,
      ...data,
      duration: data.duration || 5,
      viewsCount: 0,
      viewers: [],
      expiresAt: Timestamp.fromDate(expiresAt),
      createdAt: serverTimestamp(),
    });
  };

  return { createStory };
};
