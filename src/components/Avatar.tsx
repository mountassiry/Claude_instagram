import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, BORDER_RADIUS, FONT_SIZES } from '../config/constants';
import { getInitials } from '../utils/helpers';

interface AvatarProps {
  uri?: string;
  name: string;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ uri, name, size = 40 }) => {
  const styles = createStyles(size);

  if (uri) {
    return <Image source={{ uri }} style={styles.image} />;
  }

  return (
    <View style={styles.placeholder}>
      <Text style={styles.initials}>{getInitials(name)}</Text>
    </View>
  );
};

const createStyles = (size: number) =>
  StyleSheet.create({
    image: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: COLORS.border,
    },
    placeholder: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: COLORS.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initials: {
      color: COLORS.white,
      fontSize: size * 0.4,
      fontWeight: '600',
    },
  });
