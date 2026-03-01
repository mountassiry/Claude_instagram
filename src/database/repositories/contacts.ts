import { query, mutate, Row } from '../db';

export interface ContactRow {
  peerId: string;
  displayName: string;
  bio: string;
  avatarUri: string | null;
  signingPublicKey: string;
  encryptionPublicKey: string;
  addedAt: number;
  lastSeen: number | null;
}

function rowToContact(r: Row): ContactRow {
  return {
    peerId: r.peer_id,
    displayName: r.display_name,
    bio: r.bio ?? '',
    avatarUri: r.avatar_uri ?? null,
    signingPublicKey: r.signing_public_key,
    encryptionPublicKey: r.encryption_public_key,
    addedAt: r.added_at,
    lastSeen: r.last_seen ?? null,
  };
}

export async function getAllContacts(): Promise<ContactRow[]> {
  const rows = await query('SELECT * FROM contacts ORDER BY display_name ASC');
  return rows.map(rowToContact);
}

export async function getContact(peerId: string): Promise<ContactRow | null> {
  const rows = await query('SELECT * FROM contacts WHERE peer_id = ?', [peerId]);
  return rows.length > 0 ? rowToContact(rows[0]) : null;
}

export async function upsertContact(contact: Omit<ContactRow, 'lastSeen'>): Promise<void> {
  await mutate(
    `INSERT INTO contacts
      (peer_id, display_name, bio, avatar_uri, signing_public_key, encryption_public_key, added_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(peer_id) DO UPDATE SET
       display_name = excluded.display_name,
       bio = excluded.bio,
       avatar_uri = excluded.avatar_uri,
       signing_public_key = excluded.signing_public_key,
       encryption_public_key = excluded.encryption_public_key`,
    [
      contact.peerId,
      contact.displayName,
      contact.bio,
      contact.avatarUri,
      contact.signingPublicKey,
      contact.encryptionPublicKey,
      contact.addedAt,
    ],
  );
}

export async function updateContactLastSeen(peerId: string): Promise<void> {
  await mutate('UPDATE contacts SET last_seen = ? WHERE peer_id = ?', [Date.now(), peerId]);
}

export async function deleteContact(peerId: string): Promise<void> {
  await mutate('DELETE FROM contacts WHERE peer_id = ?', [peerId]);
}
