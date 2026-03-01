export const COLORS = {
  // Primary brand
  primary: '#6C63FF',
  primaryLight: '#8B85FF',
  primaryDark: '#4B44CC',

  // Accent
  accent: '#FF6584',
  accentGreen: '#25D366',
  accentOrange: '#FF9F43',
  twitterBlue: '#1DA1F2',

  // Neutrals
  black: '#0A0A0A',
  darkGray: '#1A1A2E',
  gray: '#4A4A6A',
  midGray: '#7A7A9A',
  lightGray: '#C4C4D4',
  border: '#E8E8F0',
  background: '#F8F8FF',
  surface: '#FFFFFF',
  white: '#FFFFFF',

  // Semantic
  success: '#25D366',
  warning: '#FFBE0B',
  error: '#FF4757',

  // Dark mode
  darkBackground: '#0A0A0A',
  darkCard: '#1A1A2E',
  darkBorder: '#2A2A4A',
  darkText: '#E8E8F8',

  // Text
  text: '#0A0A0A',
  textSecondary: '#7A7A9A',
  textLight: '#C4C4D4',

  // Misc
  overlay: 'rgba(0,0,0,0.5)',
  divider: '#E8E8F0',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
};

export const MAX_CAPTION_LENGTH = 2200;
export const MAX_GROUP_MEMBERS = 256;

// ─── P2P Signaling Server ────────────────────────────────────────────────────
// Change this to your deployed signaling server URL in production.
// The server only routes encrypted messages — it never stores plaintext.
export const SIGNALING_SERVER_URL =
  process.env.EXPO_PUBLIC_SIGNALING_URL ?? 'ws://localhost:8080';
