import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES } from '../config/constants';

interface AvatarProps {
  uri?: string;
  name: string;
  size?: number;
  showStoryRing?: boolean;
  hasUnviewedStory?: boolean;
  isVerified?: boolean;
  onPress?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 40,
  showStoryRing = false,
  hasUnviewedStory = false,
  isVerified = false,
  onPress,
}) => {
  const ringSize = size + 6;
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const inner = (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials || '?'}</Text>
        </View>
      )}
      {isVerified && (
        <View style={[styles.verifiedBadge, { bottom: -2, right: -2 }]}>
          <Ionicons name="checkmark-circle" size={size * 0.35} color={COLORS.primary} />
        </View>
      )}
    </View>
  );

  const wrapped = showStoryRing ? (
    <View
      style={[
        styles.storyRing,
        {
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
          borderColor: hasUnviewedStory ? COLORS.accent : COLORS.lightGray,
        },
      ]}
    >
      {inner}
    </View>
  ) : (
    inner
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {wrapped}
      </TouchableOpacity>
    );
  }
  return wrapped;
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: COLORS.border,
  },
  placeholder: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: COLORS.white,
    fontWeight: '700',
  },
  storyRing: {
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  verifiedBadge: {
    position: 'absolute',
    backgroundColor: COLORS.white,
    borderRadius: 99,
  },
});
