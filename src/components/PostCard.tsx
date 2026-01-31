import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../config/constants';
import { Post } from '../types';
import { Avatar } from './Avatar';
import { formatDate, formatNumber } from '../utils/helpers';
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
            <Text style={styles.time}>{formatDate(post.createdAt)}</Text>
          </View>
        </View>
        {canDelete && (
          <TouchableOpacity onPress={handleDelete} style={styles.moreButton}>
            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
        )}
      </View>

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

      {post.caption ? (
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>
            <Text style={styles.captionUsername}>{post.userDisplayName}</Text>{' '}
            {post.caption}
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
  time: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  moreButton: {
    padding: SPACING.xs,
  },
  media: {
    width: width,
    height: width,
    backgroundColor: COLORS.border,
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
});
