/**
 * IdentityContext — replaces Firebase AuthContext.
 *
 * Identity = a cryptographic keypair generated once on the device.
 * There is no server-side account, no email, no password.
 * Your private keys never leave your device.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { generateIdentity, loadIdentity, saveIdentity, clearIdentity, exportPublicKeys, Identity } from '../crypto/keys';
import { initDatabase, getMyProfile, saveMyProfile, updateMyProfile } from '../database';

export interface LocalProfile {
  peerId: string;
  displayName: string;
  bio: string;
  avatarUri: string | null;
  signingPublicKey: string;   // base64
  encryptionPublicKey: string; // base64
}

interface IdentityContextValue {
  /** null while loading, undefined if not set up */
  identity: Identity | null | undefined;
  profile: LocalProfile | null;
  isLoading: boolean;

  /** Called once during setup — generates keys and saves profile */
  setupIdentity: (displayName: string, bio?: string) => Promise<void>;

  /** Update display name / bio / avatar */
  updateProfile: (updates: { displayName?: string; bio?: string; avatarUri?: string | null }) => Promise<void>;

  /** Wipe everything (for testing / account reset) */
  resetIdentity: () => Promise<void>;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null | undefined>(undefined);
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Bootstrap: init DB, then load stored identity
  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        const stored = await loadIdentity();
        if (stored) {
          setIdentity(stored);
          const dbProfile = await getMyProfile();
          if (dbProfile) {
            setProfile({
              peerId: dbProfile.peerId,
              displayName: dbProfile.displayName,
              bio: dbProfile.bio,
              avatarUri: dbProfile.avatarUri,
              signingPublicKey: dbProfile.signingPublicKey,
              encryptionPublicKey: dbProfile.encryptionPublicKey,
            });
          }
        } else {
          setIdentity(null); // triggers setup screen
        }
      } catch (err) {
        console.error('[Identity] Bootstrap error:', err);
        setIdentity(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const setupIdentity = useCallback(async (displayName: string, bio = '') => {
    const newIdentity = generateIdentity();
    await saveIdentity(newIdentity);

    const { signingPublicKey, encryptionPublicKey } = exportPublicKeys(newIdentity);
    const profileRow = {
      peerId: newIdentity.peerId,
      displayName,
      bio,
      avatarUri: null,
      signingPublicKey,
      encryptionPublicKey,
      createdAt: Date.now(),
    };
    await saveMyProfile(profileRow);

    setIdentity(newIdentity);
    setProfile({
      peerId: newIdentity.peerId,
      displayName,
      bio,
      avatarUri: null,
      signingPublicKey,
      encryptionPublicKey,
    });
  }, []);

  const updateProfile = useCallback(async (updates: { displayName?: string; bio?: string; avatarUri?: string | null }) => {
    await updateMyProfile(updates);
    setProfile(prev => prev ? { ...prev, ...updates } : prev);
  }, []);

  const resetIdentity = useCallback(async () => {
    await clearIdentity();
    setIdentity(null);
    setProfile(null);
  }, []);

  return (
    <IdentityContext.Provider value={{ identity, profile, isLoading, setupIdentity, updateProfile, resetIdentity }}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity(): IdentityContextValue {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error('useIdentity must be used inside IdentityProvider');
  return ctx;
}
