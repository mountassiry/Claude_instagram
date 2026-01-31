import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Pressable,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../config/constants';
import { Post, UserTag } from '../types';
import { Avatar } from './Avatar';
import { formatDate, formatNumber, highlightMentions } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
  onLike: () => void;
  onUnlike: () => void;
  onComment: () => void;
  onDelete?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onUnlike,
  onComment,
  onDelete,
}) => {
  const { user, isAdmin } = useAuth();
  const [isLiked, setIsLiked] = useState(user ? post.likes.includes(user.id) : false);
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [showTags, setShowTags] = useState(false);

  const tags = post.tags || [];

  const handleLikePress = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikesCount((prev) => prev - 1);
      onUnlike();
    } else {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
      onLike();
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const canDelete = user && (user.id === post.userId || isAdmin);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar uri={post.userPhotoURL} name={post.userDisplayName} size={36} />
          <View style={styles.userText}>
            <Text style={styles.userName}>{post.userDisplayName}</Text>
            <Text style={styles.username}>@{post.username}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.time}>{formatDate(post.createdAt)}</Text>
          {canDelete && (
            <TouchableOpacity onPress={handleDelete} style={styles.moreButton}>
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Pressable onPress={() => tags.length > 0 && setShowTags(!showTags)}>
        <View style={styles.mediaContainer}>
          {post.mediaType === 'image' ? (
            <Image source={{ uri: post.mediaUrl }} style={styles.media} resizeMode="cover" />
          ) : (
            <Video
              source={{ uri: post.mediaUrl }}
              style={styles.media}
              resizeMode={ResizeMode.COVER}
              useNativeControls
              isLooping={false}
            />
          )}

          {/* Tagged users overlay */}
          {showTags && tags.map((tag: UserTag) => (
            <View
              key={tag.userId}
              style={[
                styles.tagOverlay,
                {
                  left: `${tag.x}%`,
                  top: `${tag.y}%`,
                },
              ]}
            >
              <View style={styles.tagArrow} />
              <Text style={styles.tagText}>@{tag.username}</Text>
            </View>
          ))}

          {/* Tag indicator */}
          {tags.length > 0 && (
            <View style={styles.tagIndicator}>
              <Ionicons name="person" size={14} color={COLORS.white} />
            </View>
          )}
        </View>
      </Pressable>

      <View style={styles.actions}>
        <TouchableOpacity onPress={handleLikePress} style={styles.actionButton}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={26}
            color={isLiked ? COLORS.error : COLORS.text}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={onComment} style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <Text style={styles.likesText}>{formatNumber(likesCount)} likes</Text>
      </View>

      {/* Tagged users list */}
      {tags.length > 0 && (
        <TouchableOpacity
          style={styles.taggedContainer}
          onPress={() => setShowTags(!showTags)}
        >
          <Ionicons name="person" size={14} color={COLORS.textSecondary} />
          <Text style={styles.taggedText}>
            {tags.length === 1
              ? `@${tags[0].username}`
              : `@${tags[0].username} and ${tags.length - 1} other${tags.length > 2 ? 's' : ''}`}
          </Text>
        </TouchableOpacity>
      )}

      {post.caption ? (
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>
            <Text style={styles.captionUsername}>@{post.username}</Text>{' '}
            {highlightMentions(post.caption).map((part, index) => (
              <Text key={index} style={part.isMention ? styles.mention : undefined}>
                {part.text}
              </Text>
            ))}
          </Text>
        </View>
      ) : null}

      {post.commentsCount > 0 && (
        <TouchableOpacity onPress={onComment}>
          <Text style={styles.viewComments}>
            View all {post.commentsCount} comments
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userText: {
    marginLeft: SPACING.sm,
  },
  userName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  username: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  time: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  moreButton: {
    padding: SPACING.xs,
    marginTop: SPACING.xs,
  },
  mediaContainer: {
    position: 'relative',
  },
  media: {
    width: width,
    height: width,
    backgroundColor: COLORS.border,
  },
  tagOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
    transform: [{ translateX: -20 }, { translateY: 10 }],
  },
  tagArrow: {
    position: 'absolute',
    top: -6,
    left: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(0,0,0,0.75)',
  },
  tagText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  tagIndicator: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 6,
  },
  taggedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
  },
  taggedText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  actions: {
    flexDirection: 'row',
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  actionButton: {
    marginRight: SPACING.md,
  },
  stats: {
    paddingHorizontal: SPACING.md,
  },
  likesText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  captionContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
  },
  caption: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 20,
  },
  captionUsername: {
    fontWeight: '600',
  },
  viewComments: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  mention: {
    color: COLORS.primary,
    fontWeight: '500',
  },
});
