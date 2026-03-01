// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  coverUrl?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified: boolean;
  isPrivate: boolean;
  createdAt: Date;
  website?: string;
}

// ─── Post (Instagram-style + Twitter-style) ───────────────────────────────────

export type PostType = 'photo' | 'video' | 'tweet' | 'reel';

export interface Post {
  id: string;
  authorId: string;
  author?: User;
  type: PostType;
  caption: string;
  hashtags: string[];
  mediaUrls: string[];
  thumbnailUrl?: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  bookmarksCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  isReposted?: boolean;
  repostedBy?: string;
  originalPostId?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Comment ─────────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author?: User;
  text: string;
  likesCount: number;
  isLiked?: boolean;
  replyToId?: string;
  replies?: Comment[];
  createdAt: Date;
}

// ─── Story (Instagram + WhatsApp status) ─────────────────────────────────────

export type StoryMediaType = 'image' | 'video' | 'text';

export interface Story {
  id: string;
  authorId: string;
  author?: User;
  mediaUrl?: string;
  mediaType: StoryMediaType;
  text?: string;
  textColor?: string;
  backgroundColor?: string;
  duration: number;
  viewsCount: number;
  viewers?: string[];
  expiresAt: Date;
  createdAt: Date;
}

export interface StoryGroup {
  userId: string;
  user: User;
  stories: Story[];
  hasUnviewed: boolean;
  lastUpdated: Date;
}

// ─── Messaging (WhatsApp-style) ──────────────────────────────────────────────

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'post_share';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface MessageReaction {
  userId: string;
  emoji: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  sharedPost?: Post;
  replyToId?: string;
  replyTo?: Message;
  status: MessageStatus;
  reactions: MessageReaction[];
  isDeleted: boolean;
  createdAt: Date;
  editedAt?: Date;
}

export type ConversationType = 'direct' | 'group';

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string;
  avatarUrl?: string;
  participantIds: string[];
  participants?: User[];
  lastMessage?: Message;
  lastActivity: Date;
  unreadCount: number;
  isArchived: boolean;
  isPinned: boolean;
  adminIds?: string[];
  description?: string;
  createdAt: Date;
}

// ─── Hashtag / Trending ───────────────────────────────────────────────────────

export interface Hashtag {
  id: string;
  name: string;
  postsCount: number;
  trendingScore: number;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export type NotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'mention'
  | 'repost'
  | 'story_view'
  | 'message'
  | 'tag';

export interface AppNotification {
  id: string;
  recipientId: string;
  actorId: string;
  actor?: User;
  type: NotificationType;
  postId?: string;
  post?: Post;
  commentId?: string;
  message?: string;
  isRead: boolean;
  createdAt: Date;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  FeedTab: undefined;
  ExploreTab: undefined;
  CreateTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  PostDetail: { postId: string };
  Comments: { postId: string };
  UserProfile: { userId: string };
  Followers: { userId: string; type: 'followers' | 'following' };
  StoryView: { storyGroupIndex: number; storyGroups: StoryGroup[] };
  Chat: { conversationId: string; name: string; avatarUrl?: string };
  NewMessage: undefined;
  NewGroup: undefined;
  GroupInfo: { conversationId: string };
  EditProfile: undefined;
  Settings: undefined;
  Hashtag: { tag: string };
  Notifications: undefined;
};
