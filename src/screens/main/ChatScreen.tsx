/**
 * ChatScreen — WhatsApp-style encrypted chat.
 *
 * Messages are encrypted with NaCl before being sent.
 * Everything stored locally in SQLite. Nothing goes to the cloud.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useIdentity } from '../../contexts/IdentityContext';
import { useMessaging } from '../../contexts/MessagingContext';
import { useConversationMessages, useSendMessage } from '../../hooks/useP2PMessages';
import { clearUnread, getContact, ContactRow } from '../../database';
import { MessageRow } from '../../database/repositories/messages';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../../config/constants';

interface Props {
  navigation: {
    goBack: () => void;
  };
  route: {
    params: {
      conversationId: string;
      recipientPeerId: string;
      name: string;
    };
  };
}

export function ChatScreen({ navigation, route }: Props) {
  const { conversationId, recipientPeerId, name } = route.params;
  const { identity } = useIdentity();
  const { isConnected } = useMessaging();
  const { messages, loading } = useConversationMessages(conversationId);
  const { sendText, sending } = useSendMessage(conversationId, recipientPeerId);
  const [text, setText] = useState('');
  const [contact, setContact] = useState<ContactRow | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    getContact(recipientPeerId).then(setContact);
    clearUnread(conversationId);
  }, [recipientPeerId, conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const msg = text.trim();
    if (!msg || sending) return;
    setText('');
    await sendText(msg);
  }, [text, sending, sendText]);

  const renderMessage = ({ item }: { item: MessageRow }) => {
    const isMe = item.senderId === identity?.peerId;
    return (
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        {item.type === 'text' && (
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
            {item.text}
          </Text>
        )}
        {item.type === 'image' && item.mediaUri && (
          <Image source={{ uri: item.mediaUri }} style={styles.msgImage} resizeMode="cover" />
        )}
        <View style={styles.bubbleMeta}>
          <Text style={[styles.bubbleTime, isMe ? styles.timeMe : styles.timeThem]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isMe && (
            <Ionicons
              name={item.status === 'read' ? 'checkmark-done' : item.status === 'delivered' ? 'checkmark-done-outline' : 'checkmark'}
              size={12}
              color={item.status === 'read' ? '#34B7F1' : 'rgba(255,255,255,0.7)'}
              style={{ marginLeft: 3 }}
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={navigation.goBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>{name[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{name}</Text>
          <View style={styles.headerStatus}>
            <View style={[styles.dot, { backgroundColor: isConnected ? COLORS.success : COLORS.error }]} />
            <Text style={styles.headerStatusText}>
              {isConnected ? 'End-to-end encrypted' : 'Offline — messages will be queued'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.encryptIcon}>
          <Ionicons name="lock-closed" size={18} color={COLORS.success} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Ionicons name="lock-closed" size={32} color={COLORS.textLight} />
                <Text style={styles.emptyChatText}>
                  Messages are end-to-end encrypted.{'\n'}Only you and {name} can read them.
                </Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor={COLORS.textLight}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={4000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="send" size={20} color={COLORS.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.sm, backgroundColor: COLORS.surface, gap: SPACING.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  headerAvatarText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.md },
  headerInfo: { flex: 1 },
  headerName: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.text },
  headerStatus: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  headerStatusText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  encryptIcon: { padding: SPACING.sm },
  messageList: { padding: SPACING.md, gap: SPACING.sm, flexGrow: 1, justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', padding: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.lg, marginBottom: 2 },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: COLORS.surface, borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  bubbleText: { fontSize: FONT_SIZES.md, lineHeight: 20 },
  bubbleTextMe: { color: COLORS.white },
  bubbleTextThem: { color: COLORS.text },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
  bubbleTime: { fontSize: FONT_SIZES.xs },
  timeMe: { color: 'rgba(255,255,255,0.7)' },
  timeThem: { color: COLORS.textSecondary },
  msgImage: { width: 200, height: 200, borderRadius: BORDER_RADIUS.md },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: SPACING.sm, backgroundColor: COLORS.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border, gap: SPACING.sm },
  input: { flex: 1, minHeight: 40, maxHeight: 120, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, fontSize: FONT_SIZES.md, color: COLORS.text, backgroundColor: COLORS.background },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: COLORS.lightGray },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.md },
  emptyChatText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
});
