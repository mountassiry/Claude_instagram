import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  Dimensions,
  GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLORS, SPACING, FONT_SIZES } from '../config/constants';
import { Avatar } from './Avatar';
import { User, UserTag } from '../types';
import { useAuth } from '../contexts/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

interface UserTagPickerProps {
  imageUri: string;
  tags: UserTag[];
  onTagsChange: (tags: UserTag[]) => void;
  editable?: boolean;
}

export const UserTagPicker: React.FC<UserTagPickerProps> = ({
  imageUri,
  tags,
  onTagsChange,
  editable = true,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null);
  const [showTags, setShowTags] = useState(true);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.username.toLowerCase().includes(query) ||
            u.displayName.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('isActive', '==', true));
      const snapshot = await getDocs(q);
      const usersData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((u) => u.id !== currentUser?.id) as User[];
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleImagePress = (event: GestureResponderEvent) => {
    if (!editable) return;

    const { locationX, locationY } = event.nativeEvent;
    const imageWidth = screenWidth;
    const imageHeight = screenWidth; // Assuming square image

    const x = (locationX / imageWidth) * 100;
    const y = (locationY / imageHeight) * 100;

    setPendingPosition({ x, y });
    setShowUserPicker(true);
  };

  const handleSelectUser = (user: User) => {
    if (!pendingPosition) return;

    // Check if user is already tagged
    if (tags.some((t) => t.userId === user.id)) {
      setShowUserPicker(false);
      setPendingPosition(null);
      return;
    }

    const newTag: UserTag = {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      x: pendingPosition.x,
      y: pendingPosition.y,
    };

    onTagsChange([...tags, newTag]);
    setShowUserPicker(false);
    setPendingPosition(null);
    setSearchQuery('');
  };

  const handleRemoveTag = (userId: string) => {
    onTagsChange(tags.filter((t) => t.userId !== userId));
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleSelectUser(item)}
    >
      <Avatar uri={item.photoURL} name={item.displayName} size={40} />
      <View style={styles.userInfo}>
        <Text style={styles.userDisplayName}>{item.displayName}</Text>
        <Text style={styles.userUsername}>@{item.username}</Text>
      </View>
      {tags.some((t) => t.userId === item.id) && (
        <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleImagePress}
        style={styles.imageContainer}
      >
        <Image source={{ uri: imageUri }} style={styles.image} />

        {/* Render tags */}
        {showTags &&
          tags.map((tag) => (
            <TouchableOpacity
              key={tag.userId}
              style={[
                styles.tag,
                {
                  left: `${tag.x}%`,
                  top: `${tag.y}%`,
                },
              ]}
              onPress={() => editable && handleRemoveTag(tag.userId)}
            >
              <View style={styles.tagArrow} />
              <Text style={styles.tagText}>@{tag.username}</Text>
            </TouchableOpacity>
          ))}
      </TouchableOpacity>

      {/* Tag toggle and count */}
      <View style={styles.tagControls}>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowTags(!showTags)}
        >
          <Ionicons
            name={showTags ? 'person' : 'person-outline'}
            size={20}
            color={COLORS.text}
          />
          <Text style={styles.tagCount}>{tags.length}</Text>
        </TouchableOpacity>

        {editable && (
          <Text style={styles.hint}>Tap on photo to tag someone</Text>
        )}
      </View>

      {/* Tagged users list */}
      {tags.length > 0 && (
        <View style={styles.taggedList}>
          <Text style={styles.taggedLabel}>Tagged:</Text>
          <View style={styles.taggedUsers}>
            {tags.map((tag) => (
              <View key={tag.userId} style={styles.taggedChip}>
                <Text style={styles.taggedChipText}>@{tag.username}</Text>
                {editable && (
                  <TouchableOpacity onPress={() => handleRemoveTag(tag.userId)}>
                    <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* User picker modal */}
      <Modal
        visible={showUserPicker}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowUserPicker(false);
          setPendingPosition(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tag Someone</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowUserPicker(false);
                  setPendingPosition(null);
                }}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or username..."
                placeholderTextColor={COLORS.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            <FlatList
              data={filteredUsers}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id}
              style={styles.userList}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No users found</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  imageContainer: {
    width: screenWidth,
    height: screenWidth,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.border,
  },
  tag: {
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
  tagControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagCount: {
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '600',
  },
  hint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  taggedList: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  taggedLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  taggedUsers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  taggedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  taggedChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
    marginRight: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  userList: {
    maxHeight: 300,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  userDisplayName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  userUsername: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    padding: SPACING.lg,
    color: COLORS.textSecondary,
  },
});
