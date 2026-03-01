/**
 * ConversationsScreen — WhatsApp-style list of all conversations.
 * All message previews come from local SQLite. Nothing from the cloud.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMessaging } from '../../contexts/MessagingContext';
import { getAllConversations, getContact, ConversationRow } from '../../database';
import { useIdentity } from '../../contexts/IdentityContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../config/constants';
import { formatDate } from '../../utils/helpers';

interface ConvWithName extends ConversationRow {
  displayName: string;
}

interface Props {
  navigation: {
    navigate: (screen: string, params?: object) => void;
  };
}

export function ConversationsScreen({ navigation }: Props) {
  const { identity } = useIdentity();
  const { isConnected, subscribeToAny } = useMessaging();
  const [conversations, setConversations] = useState<ConvWithName[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    const rows = await getAllConversations();
    // Enrich with contact display names
    const enriched: ConvWithName[] = await Promise.all(
      rows.map(async (row) => {
        if (row.type === 'direct') {
          const otherId = row.participantIds.find(id => id !== identity?.peerId);
          const contact = otherId ? await getContact(otherId) : null;
          return { ...row, displayName: contact?.displayName ?? row.name ?? otherId ?? 'Unknown' };
        }
        return { ...row, displayName: row.name ?? 'Group' };
      }),
    );
    setConversations(enriched);
  }, [identity?.peerId]);

  useEffect(() => {
    loadConversations().finally(() => setLoading(false));
  }, [loadConversations]);

  // Refresh when new message arrives
  useEffect(() => {
    return subscribeToAny(() => {
      loadConversations();
    });
  }, [subscribeToAny, loadConversations]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const openConversation = (conv: ConvWithName) => {
    const otherId = conv.participantIds.find(id => id !== identity?.peerId);
    navigation.navigate('Chat', {
      conversationId: conv.id,
      recipientPeerId: otherId ?? '',
      name: conv.displayName,
    });
  };

  const renderItem = ({ item }: { item: ConvWithName }) => (
    <TouchableOpacity style={styles.item} onPress={() => openConversation(item)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.displayName[0]?.toUpperCase() ?? '?'}</Text>
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={1}>{item.displayName}</Text>
          {item.lastMessageAt && (
            <Text style={styles.itemTime}>{formatDate(new Date(item.lastMessageAt))}</Text>
          )}
        </View>
        <View style={styles.itemFooter}>
          <Text style={styles.itemPreview} numberOfLines={1}>
            {item.lastMessageText ?? 'No messages yet'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerRight}>
          <View style={[styles.dot, { backgroundColor: isConnected ? COLORS.success : COLORS.error }]} />
          <Text style={styles.connText}>{isConnected ? 'Connected' : 'Offline'}</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddContact')}
          >
            <Ionicons name="person-add" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={64} color={COLORS.textLight} />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptyDesc}>Add a contact by scanning their QR code to start messaging.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('AddContact')}>
                <Ionicons name="qr-code-outline" size={18} color={COLORS.white} />
                <Text style={styles.emptyBtnText}>Add Contact</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md, paddingBottom: SPACING.sm },
  headerTitle: { fontSize: FONT_SIZES.xxl, fontWeight: '800', color: COLORS.text },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  connText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  addBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md, backgroundColor: COLORS.surface },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.white, fontSize: FONT_SIZES.lg, fontWeight: '700' },
  itemContent: { flex: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  itemName: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.text, flex: 1 },
  itemTime: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginLeft: SPACING.sm },
  itemFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemPreview: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, flex: 1 },
  badge: { backgroundColor: COLORS.primary, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, marginLeft: SPACING.sm },
  badgeText: { color: COLORS.white, fontSize: FONT_SIZES.xs, fontWeight: '700' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.divider, marginLeft: 68 + SPACING.md },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, marginTop: 80 },
  emptyTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.text, marginTop: SPACING.lg },
  emptyDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.round, marginTop: SPACING.lg },
  emptyBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.md },
});
