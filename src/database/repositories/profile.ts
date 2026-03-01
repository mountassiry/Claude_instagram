import { query, mutate, Row } from '../db';

export interface ProfileRow {
  peerId: string;
  displayName: string;
  bio: string;
  avatarUri: string | null;
  signingPublicKey: string;
  encryptionPublicKey: string;
  createdAt: number;
}

function rowToProfile(r: Row): ProfileRow {
  return {
    peerId: r.peer_id,
    displayName: r.display_name,
    bio: r.bio ?? '',
    avatarUri: r.avatar_uri ?? null,
    signingPublicKey: r.signing_public_key,
    encryptionPublicKey: r.encryption_public_key,
    createdAt: r.created_at,
  };
}

export async function getMyProfile(): Promise<ProfileRow | null> {
  const rows = await query("SELECT * FROM profile WHERE id = 'me'");
  return rows.length > 0 ? rowToProfile(rows[0]) : null;
}

export async function saveMyProfile(profile: ProfileRow): Promise<void> {
  await mutate(
    `INSERT INTO profile
      (id, peer_id, display_name, bio, avatar_uri, signing_public_key, encryption_public_key, created_at)
     VALUES ('me', ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       display_name = excluded.display_name,
       bio = excluded.bio,
       avatar_uri = excluded.avatar_uri`,
    [
      profile.peerId,
      profile.displayName,
      profile.bio,
      profile.avatarUri,
      profile.signingPublicKey,
      profile.encryptionPublicKey,
      profile.createdAt,
    ],
  );
}

export async function updateMyProfile(updates: { displayName?: string; bio?: string; avatarUri?: string | null }): Promise<void> {
  const fields: string[] = [];
  const values: (string | null)[] = [];
  if (updates.displayName !== undefined) { fields.push('display_name = ?'); values.push(updates.displayName); }
  if (updates.bio !== undefined) { fields.push('bio = ?'); values.push(updates.bio); }
  if (updates.avatarUri !== undefined) { fields.push('avatar_uri = ?'); values.push(updates.avatarUri); }
  if (fields.length === 0) return;
  await mutate(`UPDATE profile SET ${fields.join(', ')} WHERE id = 'me'`, values);
}
