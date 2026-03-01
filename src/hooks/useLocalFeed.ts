import { useCallback, useEffect, useState } from 'react';
import { useIdentity } from '../contexts/IdentityContext';
import { signalingClient } from '../networking/signaling';
import { getAllContacts, getFeedPosts, insertPost, likePost, unlikePost, getPostsByAuthor, PostRow } from '../database';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import uuidLib from 'react-native-uuid';
const uuid = () => uuidLib.v4() as string;

export function useFeed() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const rows = await getFeedPosts(30);
    setPosts(rows);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return { posts, loading, refreshing, refresh };
}

export function useMyPosts(myPeerId: string) {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!myPeerId) return;
    getPostsByAuthor(myPeerId)
      .then(setPosts)
      .finally(() => setLoading(false));
  }, [myPeerId]);

  return { posts, loading };
}

/** Hook to create and broadcast an encrypted post to all contacts. */
export function useCreatePost() {
  const { identity } = useIdentity();
  const [creating, setCreating] = useState(false);

  const createPost = useCallback(async (
    caption: string,
    mediaUris: string[],
    type: PostRow['type'] = 'photo',
  ): Promise<PostRow | null> => {
    if (!identity) return null;
    setCreating(true);

    try {
      const postId = uuid();
      const now = Date.now();

      // Copy media to permanent local storage
      const savedUris: string[] = [];
      for (const uri of mediaUris) {
        const dest = `${FileSystem.documentDirectory}posts/${postId}_${savedUris.length}.jpg`;
        await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}posts/`, { intermediates: true });
        await FileSystem.copyAsync({ from: uri, to: dest });
        savedUris.push(dest);
      }

      const post: PostRow = {
        id: postId,
        authorId: identity.peerId,
        type,
        caption,
        mediaUris: savedUris,
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
        createdAt: now,
      };

      await insertPost(post);

      // Broadcast encrypted post to all contacts
      const contacts = await getAllContacts();
      const postContent = {
        id: postId,
        authorId: identity.peerId,
        type,
        caption,
        // For MVP: include media as base64 (for small images)
        // Large media will be skipped in the text post case
        mediaData: savedUris.length > 0 && type === 'text' ? undefined : undefined,
        createdAt: now,
      };

      for (const contact of contacts) {
        try {
          await signalingClient.sendEncrypted(
            contact.peerId,
            contact.encryptionPublicKey,
            uuid(),
            postContent,
            'post',
          );
        } catch {
          // Offline contacts will get it via queued delivery
        }
      }

      return post;
    } catch (err) {
      console.error('[useCreatePost] Error:', err);
      return null;
    } finally {
      setCreating(false);
    }
  }, [identity]);

  const pickAndCreate = useCallback(async (caption: string): Promise<PostRow | null> => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (result.canceled) return null;
    const uris = result.assets.map(a => a.uri);
    return createPost(caption, uris, 'photo');
  }, [createPost]);

  return { createPost, pickAndCreate, creating };
}

export function useLikePost() {
  const { identity } = useIdentity();

  return useCallback(async (postId: string, isLiked: boolean) => {
    if (!identity) return;
    if (isLiked) {
      await unlikePost(postId, identity.peerId);
    } else {
      await likePost(postId, identity.peerId);
    }
  }, [identity]);
}
