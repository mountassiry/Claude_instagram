import React, { useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONT_SIZES } from '../../config/constants';
import { PostCard, StoryCircle, LoadingScreen } from '../../components';
import { useFeedPosts, usePostActions } from '../../hooks/usePosts';
import { useStoryGroups } from '../../hooks/useStories';
import { useUser } from '../../hooks/useUsers';
import { useAuth } from '../../contexts/AuthContext';
import { Post, StoryGroup } from '../../types';

type Props = { navigation: NativeStackNavigationProp<any> };

const PostWithAuthor: React.FC<{
  post: Post;
  onComment: () => void;
  onLike: () => void;
  onRepost: () => void;
  onAvatarPress: () => void;
  onHashtagPress: (tag: string) => void;
}> = ({ post, onComment, onLike, onRepost, onAvatarPress, onHashtagPress }) => {
  const { profile } = useUser(post.authorId);
  return (
    <PostCard
      post={post}
      author={profile || undefined}
      onLike={onLike}
      onComment={onComment}
      onRepost={onRepost}
      onAvatarPress={onAvatarPress}
      onHashtagPress={onHashtagPress}
    />
  );
};

export const FeedScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { posts, loading } = useFeedPosts();
  const { likePost, repostPost } = usePostActions();
  const { storyGroups } = useStoryGroups();
  const [refreshing, setRefreshing] = React.useState(false);

  const myStoryGroup: StoryGroup | undefined = user
    ? {
        userId: user.id,
        user: user as any,
        stories: [],
        hasUnviewed: false,
        lastUpdated: new Date(),
      }
    : undefined;

  const allStoryGroups = myStoryGroup
    ? [myStoryGroup, ...storyGroups.filter((g) => g.userId !== user?.id)]
    : storyGroups;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderStories = () => (
    <View style={styles.storiesContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScroll}>
        {allStoryGroups.map((group, idx) => (
          <StoryCircle
            key={group.userId}
            group={group}
            isOwn={group.userId === user?.id}
            onPress={() =>
              navigation.navigate('StoryView', { storyGroupIndex: idx, storyGroups: allStoryGroups })
            }
          />
        ))}
      </ScrollView>
    </View>
  );

  if (loading) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Nexus</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="heart-outline" size={26} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('MessagesTab')}>
            <Ionicons name="paper-plane-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostWithAuthor
            post={item}
            onLike={() => likePost(item.id)}
            onComment={() => navigation.navigate('Comments', { postId: item.id })}
            onRepost={() => repostPost(item.id)}
            onAvatarPress={() => navigation.navigate('UserProfile', { userId: item.authorId })}
            onHashtagPress={(tag) => navigation.navigate('Hashtag', { tag })}
          />
        )}
        ListHeaderComponent={renderStories}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="newspaper-outline" size={48} color={COLORS.lightGray} />
            <Text style={styles.emptyText}>No posts yet. Follow people to see their posts!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logo: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.primary },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: { marginLeft: SPACING.md, padding: 4 },
  storiesContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: SPACING.sm,
  },
  storiesScroll: { paddingHorizontal: SPACING.sm },
  empty: { alignItems: 'center', padding: SPACING.xxl, gap: SPACING.md },
  emptyText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center' },
});
