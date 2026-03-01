import { useCallback, useEffect, useState } from 'react';
import { getAllContacts, upsertContact, deleteContact, ContactRow } from '../database';
import { QRContactData } from '../types';

export function useContacts() {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getAllContacts();
      setContacts(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  /** Add a contact parsed from a QR code scan. */
  const addContactFromQR = useCallback(async (data: QRContactData): Promise<ContactRow> => {
    const contact: Omit<ContactRow, 'lastSeen'> = {
      peerId: data.pid,
      displayName: data.name,
      bio: data.bio ?? '',
      avatarUri: null,
      signingPublicKey: data.spk,
      encryptionPublicKey: data.epk,
      addedAt: Date.now(),
    };
    await upsertContact(contact);
    await refresh();
    return { ...contact, lastSeen: null };
  }, [refresh]);

  const removeContact = useCallback(async (peerId: string) => {
    await deleteContact(peerId);
    setContacts(prev => prev.filter(c => c.peerId !== peerId));
  }, []);

  return { contacts, loading, refresh, addContactFromQR, removeContact };
}
