import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../../config/constants';
import { PostCard, LoadingScreen, EmptyState } from '../../components';
import { usePosts } from '../../hooks/usePosts';
import { Post } from '../../types';

type FeedScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const FeedScreen: React.FC<FeedScreenProps> = ({ navigation }) => {
  const {
    posts,
    loading,
    refreshing,
    hasMore,
    loadMore,
    refresh,
    likePost,
    unlikePost,
    deletePost,
  } = usePosts();

  const handleComment = (post: Post) => {
    navigation.navigate('Comments', { postId: post.id });
  };

  const handleDelete = async (post: Post) => {
    await deletePost(post.id, post.mediaUrl);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onLike={() => likePost(item.id)}
      onUnlike={() => unlikePost(item.id)}
      onComment={() => handleComment(item)}
      onDelete={() => handleDelete(item)}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Family Circle</Text>
      <Ionicons name="people-circle" size={28} color={COLORS.primary} />
    </View>
  );

  if (loading) {
    return <LoadingScreen message="Loading posts..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      {posts.length === 0 ? (
        <EmptyState
          icon="images-outline"
          title="No posts yet"
          message="Be the first to share a moment with your family!"
          actionLabel="Create Post"
          onAction={() => navigation.navigate('CreatePost')}
        />
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.5}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});
