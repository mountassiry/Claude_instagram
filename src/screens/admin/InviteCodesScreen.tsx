import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { COLORS, SPACING, FONT_SIZES, INVITE_EXPIRY_DAYS } from '../../config/constants';
import { LoadingScreen, EmptyState, Button } from '../../components';
import { useInvites } from '../../hooks/useInvites';
import { InviteCode } from '../../types';
import { formatDate } from '../../utils/helpers';

type InviteCodesScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const InviteCodesScreen: React.FC<InviteCodesScreenProps> = ({
  navigation,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const {
    invites,
    loading,
    createInvite,
    deleteInvite,
    getActiveInvites,
    getUsedInvites,
    getExpiredInvites,
  } = useInvites();

  const handleCreateInvite = async () => {
    setCreating(true);
    try {
      const code = await createInvite();
      Alert.alert(
        'Invite Code Created',
        `Your new invite code is: ${code}\n\nThis code expires in ${INVITE_EXPIRY_DAYS} days.`,
        [
          { text: 'OK' },
          {
            text: 'Copy Code',
            onPress: () => {
              Clipboard.setStringAsync(code);
              Alert.alert('Copied', 'Invite code copied to clipboard!');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create invite code');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied', 'Invite code copied to clipboard!');
  };

  const handleDeleteInvite = (invite: InviteCode) => {
    Alert.alert(
      'Delete Invite',
      'Are you sure you want to delete this invite code?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInvite(invite.id);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const getInviteStatus = (invite: InviteCode): { label: string; color: string } => {
    if (invite.isUsed) {
      return { label: 'Used', color: COLORS.success };
    }
    if (invite.expiresAt < new Date()) {
      return { label: 'Expired', color: COLORS.error };
    }
    return { label: 'Active', color: COLORS.primary };
  };

  const renderInvite = ({ item }: { item: InviteCode }) => {
    const status = getInviteStatus(item);
    const isActive = !item.isUsed && item.expiresAt > new Date();

    return (
      <View style={styles.inviteItem}>
        <View style={styles.inviteHeader}>
          <Text style={styles.inviteCode}>{item.code}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${status.color}20` }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={styles.inviteDetails}>
          <Text style={styles.inviteDetail}>
            Created: {formatDate(item.createdAt)}
          </Text>
          {item.isUsed ? (
            <Text style={styles.inviteDetail}>
              Used: {item.usedAt ? formatDate(item.usedAt) : 'N/A'}
            </Text>
          ) : (
            <Text style={styles.inviteDetail}>
              Expires: {formatDate(item.expiresAt)}
            </Text>
          )}
        </View>

        <View style={styles.inviteActions}>
          {isActive && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCopyCode(item.code)}
            >
              <Ionicons name="copy-outline" size={18} color={COLORS.primary} />
              <Text style={styles.actionText}>Copy</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteInvite(item)}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  if (loading) {
    return <LoadingScreen message="Loading invites..." />;
  }

  const activeInvites = getActiveInvites();
  const usedInvites = getUsedInvites();
  const expiredInvites = getExpiredInvites();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Codes</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: COLORS.primary }]}>
            {activeInvites.length}
          </Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: COLORS.success }]}>
            {usedInvites.length}
          </Text>
          <Text style={styles.summaryLabel}>Used</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: COLORS.error }]}>
            {expiredInvites.length}
          </Text>
          <Text style={styles.summaryLabel}>Expired</Text>
        </View>
      </View>

      <View style={styles.createSection}>
        <Button
          title="Create New Invite Code"
          onPress={handleCreateInvite}
          loading={creating}
        />
        <Text style={styles.createHint}>
          Invite codes expire after {INVITE_EXPIRY_DAYS} days
        </Text>
      </View>

      {invites.length === 0 ? (
        <EmptyState
          icon="ticket-outline"
          title="No invite codes"
          message="Create an invite code to invite family members"
        />
      ) : (
        <FlatList
          data={invites}
          renderItem={renderInvite}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
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
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  createSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  createHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  list: {
    padding: SPACING.md,
  },
  inviteItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  inviteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  inviteCode: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  inviteDetails: {
    marginBottom: SPACING.sm,
  },
  inviteDetail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  inviteActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    marginRight: SPACING.md,
  },
  actionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },
  deleteButton: {
    marginLeft: 'auto',
    marginRight: 0,
  },
  deleteText: {
    color: COLORS.error,
  },
});
