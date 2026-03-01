import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../config/constants';
import { Post, User } from '../types';
import { Avatar } from './Avatar';
import { formatDate, formatNumber } from '../utils/helpers';

const { width } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
  author?: User;
  onLike: () => void;
  onComment: () => void;
  onRepost?: () => void;
  onShare?: () => void;
  onAvatarPress?: () => void;
  onHashtagPress?: (tag: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  author,
  onLike,
  onComment,
  onRepost,
  onShare,
  onAvatarPress,
  onHashtagPress,
}) => {
  const [liked, setLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [bookmarked, setBookmarked] = useState(post.isBookmarked || false);

  const handleLike = () => {
    setLiked(!liked);
    setLikesCount((c) => (liked ? c - 1 : c + 1));
    onLike();
  };

  const renderCaption = () => {
    if (!post.caption) return null;
    const parts = post.caption.split(/(#\w+)/g);
    return (
      <Text style={styles.caption}>
        {author && <Text style={styles.captionUser}>{author.username} </Text>}
        {parts.map((part, i) =>
          part.startsWith('#') ? (
            <Text
              key={i}
              style={styles.hashtag}
              onPress={() => onHashtagPress?.(part.slice(1))}
            >
              {part}
            </Text>
          ) : (
            <Text key={i}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  const isPhotoOrVideo = post.type === 'photo' || post.type === 'video' || post.type === 'reel';
  const hasSingleMedia = post.mediaUrls.length === 1;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.userRow} onPress={onAvatarPress} activeOpacity={0.8}>
          <Avatar
            uri={author?.avatarUrl}
            name={author?.displayName || ''}
            size={38}
            isVerified={author?.isVerified}
          />
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.displayName}>{author?.displayName || 'User'}</Text>
            </View>
            <Text style={styles.meta}>
              @{author?.username || 'user'} · {formatDate(post.createdAt)}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-horizontal" size={18} color={COLORS.midGray} />
        </TouchableOpacity>
      </View>

      {/* Tweet-style text for text posts */}
      {post.type === 'tweet' && post.caption ? (
        <View style={styles.tweetBody}>
          {renderCaption()}
        </View>
      ) : null}

      {/* Media */}
      {isPhotoOrVideo && hasSingleMedia && post.mediaUrls[0] ? (
        <Image
          source={{ uri: post.mediaUrls[0] }}
          style={styles.media}
          resizeMode="cover"
        />
      ) : null}

      {/* Multi-image grid */}
      {isPhotoOrVideo && post.mediaUrls.length > 1 ? (
        <View style={styles.grid}>
          {post.mediaUrls.slice(0, 4).map((url, i) => (
            <Image key={i} source={{ uri: url }} style={styles.gridImage} resizeMode="cover" />
          ))}
        </View>
      ) : null}

      {/* Caption for photo posts */}
      {post.type !== 'tweet' && post.caption ? (
        <View style={styles.captionWrap}>{renderCaption()}</View>
      ) : null}

      {/* Location */}
      {post.location ? (
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={COLORS.midGray} />
          <Text style={styles.location}>{post.location}</Text>
        </View>
      ) : null}

      {/* Action bar */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.action} onPress={handleLike}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? COLORS.accent : COLORS.midGray}
          />
          {likesCount > 0 && <Text style={[styles.actionCount, liked && { color: COLORS.accent }]}>{formatNumber(likesCount)}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={onComment}>
          <Ionicons name="chatbubble-outline" size={21} color={COLORS.midGray} />
          {post.commentsCount > 0 && <Text style={styles.actionCount}>{formatNumber(post.commentsCount)}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={onRepost}>
          <Ionicons
            name={post.isReposted ? 'repeat' : 'repeat-outline'}
            size={22}
            color={post.isReposted ? COLORS.accentGreen : COLORS.midGray}
          />
          {post.repostsCount > 0 && <Text style={[styles.actionCount, post.isReposted && { color: COLORS.accentGreen }]}>{formatNumber(post.repostsCount)}</Text>}
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={styles.action} onPress={() => setBookmarked(!bookmarked)}>
          <Ionicons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={21}
            color={bookmarked ? COLORS.primary : COLORS.midGray}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={onShare}>
          <Ionicons name="share-outline" size={21} color={COLORS.midGray} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  userRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  userInfo: { marginLeft: SPACING.sm, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  displayName: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text },
  meta: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 1 },
  moreBtn: { padding: SPACING.xs },
  tweetBody: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm },
  caption: { fontSize: FONT_SIZES.md, color: COLORS.text, lineHeight: 20 },
  captionUser: { fontWeight: '700' },
  captionWrap: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm },
  hashtag: { color: COLORS.primary, fontWeight: '500' },
  media: { width, height: width, backgroundColor: COLORS.lightGray },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width,
    height: width * 0.6,
    gap: 2,
  },
  gridImage: {
    width: width / 2 - 1,
    height: width * 0.3 - 1,
    backgroundColor: COLORS.lightGray,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: 4,
    gap: 3,
  },
  location: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
    gap: 4,
  },
  actionCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.midGray,
    fontWeight: '500',
  },
});
