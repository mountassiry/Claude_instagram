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
import { COLORS, SPACING, FONT_SIZES } from '../../config/constants';
import { Avatar, LoadingScreen, EmptyState, Button } from '../../components';
import { useUsers } from '../../hooks/useUsers';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types';
import { formatDate } from '../../utils/helpers';

type ManageUsersScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const ManageUsersScreen: React.FC<ManageUsersScreenProps> = ({
  navigation,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const { users, loading, toggleUserStatus, makeAdmin, removeAdmin, removeUser } =
    useUsers();
  const { user: currentUser } = useAuth();

  const handleToggleStatus = (targetUser: User) => {
    const action = targetUser.isActive ? 'deactivate' : 'activate';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} ${targetUser.displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: targetUser.isActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await toggleUserStatus(targetUser.id, !targetUser.isActive);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleToggleAdmin = (targetUser: User) => {
    const isCurrentlyAdmin = targetUser.role === 'admin';
    const action = isCurrentlyAdmin ? 'remove admin rights from' : 'make admin';

    Alert.alert(
      'Change Role',
      `Are you sure you want to ${action} ${targetUser.displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              if (isCurrentlyAdmin) {
                await removeAdmin(targetUser.id);
              } else {
                await makeAdmin(targetUser.id);
              }
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleRemoveUser = (targetUser: User) => {
    Alert.alert(
      'Remove User',
      `Are you sure you want to permanently remove ${targetUser.displayName}? This will delete all their posts and data. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeUser(targetUser.id);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const showUserActions = (targetUser: User) => {
    if (targetUser.id === currentUser?.id) {
      Alert.alert('Info', "You can't modify your own account from here.");
      return;
    }

    const actions: { text: string; onPress: () => void; style?: 'cancel' | 'destructive' }[] = [
      { text: 'Cancel', style: 'cancel', onPress: () => {} },
    ];

    if (targetUser.isActive) {
      actions.push({
        text: 'Deactivate User',
        onPress: () => handleToggleStatus(targetUser),
      });
    } else {
      actions.push({
        text: 'Activate User',
        onPress: () => handleToggleStatus(targetUser),
      });
    }

    if (targetUser.role === 'admin') {
      actions.push({
        text: 'Remove Admin Rights',
        onPress: () => handleToggleAdmin(targetUser),
      });
    } else {
      actions.push({
        text: 'Make Admin',
        onPress: () => handleToggleAdmin(targetUser),
      });
    }

    actions.push({
      text: 'Remove User',
      style: 'destructive',
      onPress: () => handleRemoveUser(targetUser),
    });

    Alert.alert(targetUser.displayName, 'Choose an action', actions);
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[styles.userItem, !item.isActive && styles.userItemInactive]}
      onPress={() => showUserActions(item)}
    >
      <Avatar uri={item.photoURL} name={item.displayName} size={48} />
      <View style={styles.userInfo}>
        <View style={styles.userNameRow}>
          <Text style={styles.userName}>{item.displayName}</Text>
          {item.role === 'admin' && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={12} color={COLORS.white} />
            </View>
          )}
          {!item.isActive && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>Inactive</Text>
            </View>
          )}
        </View>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userDate}>
          Joined {formatDate(item.createdAt)}
        </Text>
      </View>
      <Ionicons name="ellipsis-vertical" size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  const onRefresh = async () => {
    setRefreshing(true);
    // The hook uses onSnapshot, so it auto-updates
    setTimeout(() => setRefreshing(false), 500);
  };

  if (loading) {
    return <LoadingScreen message="Loading members..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Members</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{users.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {users.filter((u) => u.isActive).length}
          </Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {users.filter((u) => u.role === 'admin').length}
          </Text>
          <Text style={styles.summaryLabel}>Admins</Text>
        </View>
      </View>

      {users.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No members yet"
          message="Invite family members to join your circle!"
          actionLabel="Create Invite"
          onAction={() => navigation.navigate('InviteCodes')}
        />
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
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
    color: COLORS.primary,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  list: {
    padding: SPACING.md,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  userItemInactive: {
    opacity: 0.6,
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  adminBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 2,
    marginLeft: SPACING.xs,
  },
  inactiveBadge: {
    backgroundColor: COLORS.error,
    borderRadius: 8,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 1,
    marginLeft: SPACING.xs,
  },
  inactiveBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  userDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
});
