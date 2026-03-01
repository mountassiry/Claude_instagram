import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../config/constants';
import { Avatar, LoadingScreen } from '../../components';
import { useSearchUsers, useSuggestedUsers } from '../../hooks/useUsers';
import { useFeedPosts } from '../../hooks/usePosts';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 4) / 3;

const TRENDING_HASHTAGS = [
  { tag: 'photography', count: '124K' },
  { tag: 'travel', count: '98K' },
  { tag: 'food', count: '87K' },
  { tag: 'fitness', count: '76K' },
  { tag: 'tech', count: '65K' },
  { tag: 'art', count: '54K' },
];

type Props = { navigation: NativeStackNavigationProp<any> };

export const ExploreScreen: React.FC<Props> = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'discover' | 'users'>('discover');
  const { users: searchResults, loading: searchLoading } = useSearchUsers(query);
  const { users: suggested } = useSuggestedUsers();
  const { posts } = useFeedPosts();

  const photoPosts = posts.filter((p) => p.type === 'photo' && p.mediaUrls.length > 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={18} color={COLORS.midGray} />
          <TextInput
            style={styles.input}
            placeholder="Search users, hashtags..."
            placeholderTextColor={COLORS.lightGray}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.midGray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {query.length > 0 ? (
        /* Search results */
        <FlatList
          data={searchResults}
          keyExtractor={(u) => u.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.userRow}
              onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
            >
              <Avatar uri={item.avatarUrl} name={item.displayName} size={44} isVerified={item.isVerified} />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.displayName}</Text>
                <Text style={styles.userHandle}>@{item.username}</Text>
              </View>
              <Text style={styles.followerCount}>{item.followersCount} followers</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !searchLoading ? (
              <View style={styles.center}>
                <Text style={styles.emptyText}>No users found for "{query}"</Text>
              </View>
            ) : null
          }
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Trending hashtags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {TRENDING_HASHTAGS.map((h) => (
                <TouchableOpacity
                  key={h.tag}
                  style={styles.hashtagChip}
                  onPress={() => navigation.navigate('Hashtag', { tag: h.tag })}
                >
                  <Text style={styles.hashtagSymbol}>#</Text>
                  <Text style={styles.hashtagName}>{h.tag}</Text>
                  <Text style={styles.hashtagCount}>{h.count} posts</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Suggested users */}
          {suggested.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Suggested for you</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {suggested.map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    style={styles.suggestedCard}
                    onPress={() => navigation.navigate('UserProfile', { userId: u.id })}
                  >
                    <Avatar uri={u.avatarUrl} name={u.displayName} size={52} isVerified={u.isVerified} />
                    <Text style={styles.suggestedName} numberOfLines={1}>{u.displayName}</Text>
                    <Text style={styles.suggestedHandle} numberOfLines={1}>@{u.username}</Text>
                    <Text style={styles.suggestedFollowers}>{u.followersCount} followers</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Photo grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Explore</Text>
            <View style={styles.grid}>
              {photoPosts.map((post, i) => (
                <TouchableOpacity
                  key={post.id}
                  onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
                  style={[styles.gridItem, i % 3 === 1 && styles.gridItemTall]}
                >
                  <Image
                    source={{ uri: post.mediaUrls[0] }}
                    style={styles.gridImage}
                    resizeMode="cover"
                  />
                  {post.mediaUrls.length > 1 && (
                    <View style={styles.multiIcon}>
                      <Ionicons name="copy-outline" size={14} color={COLORS.white} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBar: { padding: SPACING.md, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  input: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.text },
  section: { marginTop: SPACING.md },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.text, paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  hashtagChip: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginLeft: SPACING.md,
    minWidth: 110,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hashtagSymbol: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.primary },
  hashtagName: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.text },
  hashtagCount: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  suggestedCard: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginLeft: SPACING.md,
    width: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  suggestedName: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text, marginTop: SPACING.sm },
  suggestedHandle: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  suggestedFollowers: { fontSize: FONT_SIZES.xs, color: COLORS.midGray, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, paddingHorizontal: 1 },
  gridItem: { width: GRID_SIZE, height: GRID_SIZE },
  gridItemTall: { height: GRID_SIZE * 2 + 2 },
  gridImage: { width: '100%', height: '100%', backgroundColor: COLORS.lightGray },
  multiIcon: { position: 'absolute', top: 6, right: 6 },
  userRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  userInfo: { flex: 1, marginLeft: SPACING.sm },
  userName: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.text },
  userHandle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  followerCount: { fontSize: FONT_SIZES.xs, color: COLORS.midGray },
  center: { padding: SPACING.xl, alignItems: 'center' },
  emptyText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.md },
});
