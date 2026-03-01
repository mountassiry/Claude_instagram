import { query, mutate, Row } from '../db';

export type MessageType = 'text' | 'image' | 'video' | 'audio';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface MessageRow {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  text: string | null;
  mediaUri: string | null;
  mimeType: string | null;
  status: MessageStatus;
  createdAt: number;
}

function rowToMessage(r: Row): MessageRow {
  return {
    id: r.id,
    conversationId: r.conversation_id,
    senderId: r.sender_id,
    type: r.type,
    text: r.text ?? null,
    mediaUri: r.media_uri ?? null,
    mimeType: r.mime_type ?? null,
    status: r.status,
    createdAt: r.created_at,
  };
}

export async function getMessages(conversationId: string, limit = 50, before?: number): Promise<MessageRow[]> {
  if (before) {
    const rows = await query(
      'SELECT * FROM messages WHERE conversation_id = ? AND created_at < ? ORDER BY created_at DESC LIMIT ?',
      [conversationId, before, limit],
    );
    return rows.map(rowToMessage).reverse();
  }
  const rows = await query(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?',
    [conversationId, limit],
  );
  return rows.map(rowToMessage).reverse();
}

export async function getMessage(id: string): Promise<MessageRow | null> {
  const rows = await query('SELECT * FROM messages WHERE id = ?', [id]);
  return rows.length > 0 ? rowToMessage(rows[0]) : null;
}

export async function insertMessage(msg: MessageRow): Promise<void> {
  await mutate(
    `INSERT OR IGNORE INTO messages
      (id, conversation_id, sender_id, type, text, media_uri, mime_type, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [msg.id, msg.conversationId, msg.senderId, msg.type, msg.text, msg.mediaUri, msg.mimeType, msg.status, msg.createdAt],
  );
}

export async function updateMessageStatus(id: string, status: MessageStatus): Promise<void> {
  await mutate('UPDATE messages SET status = ? WHERE id = ?', [status, id]);
}

export async function deleteMessage(id: string): Promise<void> {
  await mutate('DELETE FROM messages WHERE id = ?', [id]);
}
