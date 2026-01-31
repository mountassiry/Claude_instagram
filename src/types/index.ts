export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'member';
  createdAt: Date;
  invitedBy?: string;
  isActive: boolean;
}

export interface Post {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  thumbnailUrl?: string;
  caption: string;
  likes: string[];
  commentsCount: number;
  createdAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string;
  text: string;
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
