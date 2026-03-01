export const formatDate = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

export const formatNumber = (num: number): string => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
};

export const extractHashtags = (text: string): string[] => {
  const matches = text.match(/#[a-zA-Z0-9_]+/g) || [];
  return matches.map((tag) => tag.slice(1).toLowerCase());
};

export const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain an uppercase letter' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain a number' };
  return { valid: true, message: '' };
};

export const validateUsername = (username: string): { valid: boolean; message: string } => {
  if (username.length < 3) return { valid: false, message: 'Username must be at least 3 characters' };
  if (username.length > 30) return { valid: false, message: 'Username must be 30 characters or less' };
  if (!/^[a-zA-Z0-9._]+$/.test(username)) return { valid: false, message: 'Username can only contain letters, numbers, dots and underscores' };
  return { valid: true, message: '' };
};

export const getInitials = (name: string): string =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

export const isVideoUri = (uri: string): boolean =>
  /\.(mp4|mov|avi|mkv|webm)$/i.test(uri);

export const formatMessageTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60_000) return 'now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
