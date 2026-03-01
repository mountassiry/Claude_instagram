import { query, mutate, Row } from '../db';

export interface ConversationRow {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  participantIds: string[];
  lastMessageText: string | null;
  lastMessageAt: number | null;
  unreadCount: number;
  isArchived: boolean;
  isPinned: boolean;
  createdAt: number;
}

function rowToConversation(r: Row): ConversationRow {
  return {
    id: r.id,
    type: r.type,
    name: r.name ?? null,
    participantIds: JSON.parse(r.participant_ids ?? '[]'),
    lastMessageText: r.last_message_text ?? null,
    lastMessageAt: r.last_message_at ?? null,
    unreadCount: r.unread_count ?? 0,
    isArchived: Boolean(r.is_archived),
    isPinned: Boolean(r.is_pinned),
    createdAt: r.created_at,
  };
}

export async function getAllConversations(): Promise<ConversationRow[]> {
  const rows = await query(
    'SELECT * FROM conversations ORDER BY is_pinned DESC, last_message_at DESC NULLS LAST',
  );
  return rows.map(rowToConversation);
}

export async function getConversation(id: string): Promise<ConversationRow | null> {
  const rows = await query('SELECT * FROM conversations WHERE id = ?', [id]);
  return rows.length > 0 ? rowToConversation(rows[0]) : null;
}

/** Find an existing direct conversation between exactly two peers. */
export async function findDirectConversation(myPeerId: string, otherPeerId: string): Promise<ConversationRow | null> {
  const rows = await query(
    "SELECT * FROM conversations WHERE type = 'direct' AND participant_ids LIKE ? AND participant_ids LIKE ?",
    [`%${myPeerId}%`, `%${otherPeerId}%`],
  );
  // Extra check because LIKE can be fuzzy
  const exact = rows.find(r => {
    const ids: string[] = JSON.parse(r.participant_ids);
    return ids.length === 2 && ids.includes(myPeerId) && ids.includes(otherPeerId);
  });
  return exact ? rowToConversation(exact) : null;
}

export async function upsertConversation(conv: Omit<ConversationRow, 'unreadCount' | 'isArchived' | 'isPinned'>): Promise<void> {
  await mutate(
    `INSERT INTO conversations
      (id, type, name, participant_ids, last_message_text, last_message_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       last_message_text = excluded.last_message_text,
       last_message_at = excluded.last_message_at`,
    [
      conv.id,
      conv.type,
      conv.name,
      JSON.stringify(conv.participantIds),
      conv.lastMessageText,
      conv.lastMessageAt,
      conv.createdAt,
    ],
  );
}

export async function updateLastMessage(conversationId: string, text: string, at: number): Promise<void> {
  await mutate(
    'UPDATE conversations SET last_message_text = ?, last_message_at = ? WHERE id = ?',
    [text, at, conversationId],
  );
}

export async function incrementUnread(conversationId: string): Promise<void> {
  await mutate('UPDATE conversations SET unread_count = unread_count + 1 WHERE id = ?', [conversationId]);
}

export async function clearUnread(conversationId: string): Promise<void> {
  await mutate('UPDATE conversations SET unread_count = 0 WHERE id = ?', [conversationId]);
}

export async function deleteConversation(id: string): Promise<void> {
  await mutate('DELETE FROM conversations WHERE id = ?', [id]);
  await mutate('DELETE FROM messages WHERE conversation_id = ?', [id]);
}
