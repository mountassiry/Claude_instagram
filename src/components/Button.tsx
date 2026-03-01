import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES } from '../config/constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, styles[variant], styles[`${size}Size`], disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.white}
          size="small"
        />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`], textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: { backgroundColor: COLORS.primary },
  secondary: { backgroundColor: COLORS.accentGreen },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: COLORS.error },
  disabled: { opacity: 0.45 },

  smallSize: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm },
  mediumSize: { paddingVertical: 10, paddingHorizontal: SPACING.lg },
  largeSize: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl },

  text: { fontWeight: '600' },
  primaryText: { color: COLORS.white },
  secondaryText: { color: COLORS.white },
  outlineText: { color: COLORS.primary },
  ghostText: { color: COLORS.primary },
  dangerText: { color: COLORS.white },

  smallText: { fontSize: FONT_SIZES.sm },
  mediumText: { fontSize: FONT_SIZES.md },
  largeText: { fontSize: FONT_SIZES.lg },
});
