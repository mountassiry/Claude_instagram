import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../config/constants';
import { getComments, insertComment, CommentRow, getContact } from '../../database';
import { useIdentity } from '../../contexts/IdentityContext';
import uuidLib from 'react-native-uuid';
const uuid = () => uuidLib.v4() as string;
import { formatDate } from '../../utils/helpers';

interface Props {
  navigation: { goBack: () => void };
  route: { params: { postId: string } };
}

export const CommentsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { postId } = route.params;
  const { identity, profile } = useIdentity();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const rows = await getComments(postId);
    setComments(rows);
    // Preload author names
    const names: Record<string, string> = {};
    for (const row of rows) {
      if (row.authorId === identity?.peerId) {
        names[row.authorId] = profile?.displayName ?? 'You';
      } else if (!names[row.authorId]) {
        const contact = await getContact(row.authorId);
        names[row.authorId] = contact?.displayName ?? row.authorId.slice(0, 8);
      }
    }
    setAuthorNames(names);
  }, [postId, identity?.peerId, profile?.displayName]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const handleSubmit = async () => {
    if (!newComment.trim() || !identity) return;
    setSubmitting(true);
    try {
      const comment: CommentRow = {
        id: uuid() as string,
        postId,
        authorId: identity.peerId,
        text: newComment.trim(),
        createdAt: Date.now(),
      };
      await insertComment(comment);
      setNewComment('');
      await load();
    } catch {
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderComment = ({ item }: { item: CommentRow }) => (
    <View style={styles.commentContainer}>
      <View style={styles.commentAvatar}>
        <Text style={styles.commentAvatarText}>
          {(authorNames[item.authorId] ?? '?')[0].toUpperCase()}
        </Text>
      </View>
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUsername}>{authorNames[item.authorId] ?? item.authorId.slice(0, 8)}</Text>
          <Text style={styles.commentTime}>{formatDate(new Date(item.createdAt))}</Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={90}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Comments</Text>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <View style={styles.centered}><ActivityIndicator color={COLORS.primary} /></View>
        ) : (
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.commentsList}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Ionicons name="chatbubble-outline" size={40} color={COLORS.textLight} />
                <Text style={styles.emptyText}>No comments yet. Be first!</Text>
              </View>
            }
          />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor={COLORS.textLight}
            value={newComment}
            onChangeText={setNewComment}
            maxLength={500}
            multiline
          />
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!newComment.trim() || submitting}
            style={styles.sendButton}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={newComment.trim() ? COLORS.primary : COLORS.textLight}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '600', color: COLORS.text },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  emptyText: { color: COLORS.textSecondary, marginTop: SPACING.md },
  commentsList: { padding: SPACING.md, flexGrow: 1 },
  commentContainer: { flexDirection: 'row', marginBottom: SPACING.md, gap: SPACING.sm },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  commentAvatarText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.sm },
  commentContent: { flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.sm },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  commentUsername: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.text },
  commentTime: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  commentText: { fontSize: FONT_SIZES.md, color: COLORS.text, lineHeight: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, gap: SPACING.sm },
  input: { flex: 1, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, backgroundColor: COLORS.background, borderRadius: 20, fontSize: FONT_SIZES.md, color: COLORS.text, maxHeight: 80 },
  sendButton: { padding: SPACING.sm },
});
