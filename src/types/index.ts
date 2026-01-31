export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  role: 'admin' | 'member';
  createdAt: Date;
  invitedBy?: string;
  isActive: boolean;
}

export interface UserTag {
  userId: string;
  username: string;
  displayName: string;
  x: number; // Position as percentage (0-100)
  y: number; // Position as percentage (0-100)
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userDisplayName: string;
  userPhotoURL?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  thumbnailUrl?: string;
  caption: string;
  likes: string[];
  commentsCount: number;
  tags: UserTag[];
  createdAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userDisplayName: string;
  userPhotoURL?: string;
  text: string;
  mentionedUsers?: string[]; // Array of userIds mentioned with @username
  createdAt: Date;
}

export interface InviteCode {
  id: string;
  code: string;
  createdBy: string;
  createdAt: Date;
  usedBy?: string;
  usedAt?: Date;
  isUsed: boolean;
  expiresAt: Date;
}

export interface FamilyGroup {
  id: string;
  name: string;
  adminId: string;
  createdAt: Date;
  memberCount: number;
}
