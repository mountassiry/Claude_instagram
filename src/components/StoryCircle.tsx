import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../config/constants';
import { StoryGroup } from '../types';
import { Avatar } from './Avatar';

interface StoryCircleProps {
  group: StoryGroup;
  isOwn?: boolean;
  onPress: () => void;
}

export const StoryCircle: React.FC<StoryCircleProps> = ({ group, isOwn, onPress }) => {
  const label = isOwn ? 'Your story' : group.user.username || group.user.displayName || 'User';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.ringWrapper}>
        {isOwn ? (
          <View style={styles.addRing}>
            <Avatar
              uri={group.user.avatarUrl}
              name={group.user.displayName}
              size={56}
            />
            <View style={styles.addBadge}>
              <Text style={styles.addIcon}>+</Text>
            </View>
          </View>
        ) : (
          <Avatar
            uri={group.user.avatarUrl}
            name={group.user.displayName}
            size={56}
            showStoryRing
            hasUnviewedStory={group.hasUnviewed}
          />
        )}
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 72,
    marginHorizontal: SPACING.xs,
  },
  ringWrapper: {
    marginBottom: 4,
  },
  addRing: {
    position: 'relative',
  },
  addBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  addIcon: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
    textAlign: 'center',
    maxWidth: 68,
  },
});
