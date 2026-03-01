// ─── Cryptographic Identity ──────────────────────────────────────────────────

/** Shared via QR code — contains ONLY public keys. Safe to share. */
export interface QRContactData {
  v: number;                  // protocol version (1)
  pid: string;                // peerId (hex of first 16 bytes of signing public key)
  spk: string;                // signing public key (base64 Ed25519)
  epk: string;                // encryption public key (base64 X25519)
  name: string;               // display name
  bio?: string;
}

export interface EncryptedPayload {
  nonce: string;              // base64, 24 bytes
  ciphertext: string;         // base64
  senderEpk: string;          // sender's encryption public key, base64
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Setup: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  FeedTab: undefined;
  MessagesTab: undefined;
  CreateTab: undefined;
  ProfileTab: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  Chat: { conversationId: string; recipientPeerId: string; name: string };
  AddContact: undefined;
  Comments: { postId: string };
  PostDetail: { postId: string };
  Settings: undefined;
  Messages: undefined;
  Feed: undefined;
  Create: undefined;
  Profile: undefined;
};

// ─── Shared types ─────────────────────────────────────────────────────────────

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';
export type ConversationType = 'direct' | 'group';
