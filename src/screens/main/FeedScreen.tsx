/**
 * FeedScreen — Instagram-like feed of encrypted posts.
 *
 * All posts are stored locally. Nothing fetched from a cloud server.
 * Posts from contacts are delivered peer-to-peer via the signaling relay
 * and stored in SQLite. Media is stored in the local file system.
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useIdentity } from '../../contexts/IdentityContext';
import { useMessaging } from '../../contexts/MessagingContext';
import { useFeed, useLikePost } from '../../hooks/useLocalFeed';
import { getContact, PostRow } from '../../database';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../config/constants';
import { formatDate } from '../../utils/helpers';

interface NavProps {
  navigate: (screen: string, params?: object) => void;
}

function PostCard({
  post,
  myPeerId,
  onLike,
  navigation,
}: {
  post: PostRow;
  myPeerId: string;
  onLike: (postId: string, isLiked: boolean) => void;
  navigation: NavProps;
}) {
  const [authorName, setAuthorName] = useState<string | null>(null);
  const isMe = post.authorId === myPeerId;

  React.useEffect(() => {
    if (isMe) {
      setAuthorName('You');
    } else {
      getContact(post.authorId).then(c => setAuthorName(c?.displayName ?? 'Unknown'));
    }
  }, [post.authorId, isMe]);

  return (
    <View style={styles.card}>
      <View style={styles.postHeader}>
        <View style={styles.postAvatar}>
          <Text style={styles.postAvatarText}>{(authorName ?? '?')[0].toUpperCase()}</Text>
        </View>
        <View style={styles.postAuthorInfo}>
          <Text style={styles.postAuthorName}>{authorName ?? '...'}</Text>
          <Text style={styles.postTime}>{formatDate(new Date(post.createdAt))}</Text>
        </View>
        <View style={styles.encryptedBadge}>
          <Ionicons name="lock-closed" size={10} color={COLORS.success} />
          <Text style={styles.encryptedText}>E2E</Text>
        </View>
      </View>

      {post.mediaUris.length > 0 && (
        <Image source={{ uri: post.mediaUris[0] }} style={styles.postImage} resizeMode="cover" />
      )}

      <View style={styles.postActions}>
        <TouchableOpacity style={styles.action} onPress={() => onLike(post.id, post.isLiked)}>
          <Ionicons
            name={post.isLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={post.isLiked ? COLORS.accent : COLORS.text}
          />
          <Text style={styles.actionCount}>{post.likesCount > 0 ? post.likesCount : ''}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('Comments', { postId: post.id })}>
          <Ionicons name="chatbubble-outline" size={22} color={COLORS.text} />
          <Text style={styles.actionCount}>{post.commentsCount > 0 ? post.commentsCount : ''}</Text>
        </TouchableOpacity>
      </View>

      {post.caption ? (
        <View style={styles.postCaption}>
          <Text style={styles.captionAuthor}>{authorName} </Text>
          <Text style={styles.captionText}>{post.caption}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function FeedScreen({ navigation }: { navigation: NavProps }) {
  const { identity } = useIdentity();
  const { isConnected } = useMessaging();
  const { posts, loading, refreshing, refresh } = useFeed();
  const likePost = useLikePost();

  const handleLike = useCallback(async (postId: string, isLiked: boolean) => {
    await likePost(postId, isLiked);
  }, [likePost]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nexus</Text>
        <View style={styles.headerRight}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? COLORS.success : COLORS.error }]} />
          <TouchableOpacity onPress={() => navigation.navigate('AddContact')} style={styles.headerIcon}>
            <Ionicons name="qr-code-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Messages')} style={styles.headerIcon}>
            <Ionicons name="chatbubbles-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            myPeerId={identity?.peerId ?? ''}
            onLike={handleLike}
            navigation={navigation}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>Your feed is empty</Text>
            <Text style={styles.emptyDesc}>
              Add contacts and share posts to see content here.
              All posts are stored locally — nothing in the cloud.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('AddContact')}>
              <Ionicons name="person-add-outline" size={18} color={COLORS.white} />
              <Text style={styles.emptyBtnText}>Add Contact</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: COLORS.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.primary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  headerIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: COLORS.surface, marginBottom: SPACING.sm },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.sm },
  postAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  postAvatarText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.md },
  postAuthorInfo: { flex: 1 },
  postAuthorName: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text },
  postTime: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  encryptedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: `${COLORS.success}15`, paddingHorizontal: 6, paddingVertical: 3, borderRadius: BORDER_RADIUS.round },
  encryptedText: { fontSize: 9, color: COLORS.success, fontWeight: '700' },
  postImage: { width: '100%', aspectRatio: 1 },
  postActions: { flexDirection: 'row', padding: SPACING.md, gap: SPACING.lg },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionCount: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },
  postCaption: { flexDirection: 'row', paddingHorizontal: SPACING.md, paddingBottom: SPACING.md, flexWrap: 'wrap' },
  captionAuthor: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.text },
  captionText: { fontSize: FONT_SIZES.sm, color: COLORS.text },
  empty: { alignItems: 'center', padding: SPACING.xl, marginTop: 60 },
  emptyTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.text, marginTop: SPACING.lg },
  emptyDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.round, marginTop: SPACING.lg },
  emptyBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.md },
});
