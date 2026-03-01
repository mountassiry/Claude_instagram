import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../config/constants';
import { Message, MessageStatus } from '../types';
import { formatMessageTime } from '../utils/helpers';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  showAvatar?: boolean;
  senderName?: string;
  senderAvatar?: string;
}

const StatusIcon: React.FC<{ status: MessageStatus }> = ({ status }) => {
  if (status === 'read') return <Ionicons name="checkmark-done" size={13} color={COLORS.twitterBlue} />;
  if (status === 'delivered') return <Ionicons name="checkmark-done" size={13} color={COLORS.midGray} />;
  if (status === 'sent') return <Ionicons name="checkmark" size={13} color={COLORS.midGray} />;
  return <Ionicons name="time-outline" size={12} color={COLORS.midGray} />;
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMine,
  showAvatar,
  senderName,
  senderAvatar,
}) => {
  if (message.isDeleted) {
    return (
      <View style={[styles.row, isMine && styles.rowReverse]}>
        <View style={[styles.bubble, styles.deletedBubble, isMine && styles.myBubble]}>
          <Text style={styles.deletedText}>Message deleted</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, isMine && styles.rowReverse]}>
      {/* Avatar (group chats) */}
      {!isMine && showAvatar && (
        senderAvatar ? (
          <Image source={{ uri: senderAvatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>{(senderName || '?')[0].toUpperCase()}</Text>
          </View>
        )
      )}
      {!isMine && !showAvatar && <View style={styles.avatarSpace} />}

      <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
        {/* Sender name in groups */}
        {!isMine && senderName && (
          <Text style={styles.senderName}>{senderName}</Text>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <View style={styles.replyPreview}>
            <View style={styles.replyBar} />
            <Text style={styles.replyText} numberOfLines={1}>
              {message.replyTo.text || 'Media message'}
            </Text>
          </View>
        )}

        {/* Image message */}
        {message.type === 'image' && message.mediaUrl && (
          <Image source={{ uri: message.mediaUrl }} style={styles.mediaImage} resizeMode="cover" />
        )}

        {/* Text */}
        {message.text ? (
          <Text style={[styles.messageText, isMine && styles.myMessageText]}>
            {message.text}
          </Text>
        ) : null}

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <View style={styles.reactions}>
            {message.reactions.slice(0, 3).map((r, i) => (
              <Text key={i} style={styles.reaction}>{r.emoji}</Text>
            ))}
            {message.reactions.length > 3 && (
              <Text style={styles.reactionsMore}>+{message.reactions.length - 3}</Text>
            )}
          </View>
        )}

        {/* Footer: time + status */}
        <View style={styles.footer}>
          <Text style={[styles.time, isMine && styles.myTime]}>
            {formatMessageTime(message.createdAt)}
          </Text>
          {isMine && <StatusIcon status={message.status} />}
        </View>
      </View>
    </View>
  );
};

const BUBBLE_MAX_WIDTH = '75%';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 2,
    paddingHorizontal: SPACING.md,
  },
  rowReverse: { flexDirection: 'row-reverse' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 6,
    backgroundColor: COLORS.lightGray,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  avatarSpace: { width: 34 },
  bubble: {
    maxWidth: BUBBLE_MAX_WIDTH as any,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    paddingHorizontal: 12,
  },
  myBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deletedBubble: { backgroundColor: COLORS.background },
  senderName: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  replyPreview: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.xs,
    marginBottom: SPACING.xs,
    alignItems: 'center',
  },
  replyBar: {
    width: 3,
    height: '100%',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 2,
    marginRight: 6,
  },
  replyText: { fontSize: FONT_SIZES.xs, color: COLORS.midGray, flex: 1 },
  mediaImage: {
    width: 180,
    height: 180,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 4,
  },
  messageText: { fontSize: FONT_SIZES.md, color: COLORS.text, lineHeight: 20 },
  myMessageText: { color: COLORS.white },
  deletedText: { fontSize: FONT_SIZES.sm, color: COLORS.midGray, fontStyle: 'italic' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 2,
  },
  time: { fontSize: 10, color: COLORS.midGray },
  myTime: { color: 'rgba(255,255,255,0.7)' },
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    marginTop: 3,
  },
  reaction: { fontSize: 14 },
  reactionsMore: { fontSize: FONT_SIZES.xs, color: COLORS.midGray },
});
