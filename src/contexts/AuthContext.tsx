import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';
import { FIREBASE_COLLECTIONS } from '../config/constants';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const snap = await getDoc(doc(db, FIREBASE_COLLECTIONS.USERS, fbUser.uid));
        if (snap.exists()) {
          const d = snap.data();
          setUser({
            id: fbUser.uid,
            username: d.username || '',
            email: d.email || fbUser.email || '',
            displayName: d.displayName || fbUser.displayName || '',
            bio: d.bio || '',
            avatarUrl: d.avatarUrl || '',
            coverUrl: d.coverUrl,
            followersCount: d.followersCount || 0,
            followingCount: d.followingCount || 0,
            postsCount: d.postsCount || 0,
            isVerified: d.isVerified || false,
            isPrivate: d.isPrivate || false,
            createdAt: d.createdAt?.toDate() || new Date(),
            website: d.website,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    username: string
  ) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    const userData = {
      username: username.toLowerCase(),
      email,
      displayName,
      bio: '',
      avatarUrl: '',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      isVerified: false,
      isPrivate: false,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, FIREBASE_COLLECTIONS.USERS, result.user.uid), userData);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  const updateUserProfile = async (data: Partial<User>) => {
    if (!firebaseUser) return;
    await setDoc(doc(db, FIREBASE_COLLECTIONS.USERS, firebaseUser.uid), data, { merge: true });
    setUser((prev) => (prev ? { ...prev, ...data } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signIn, signUp, signOut, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
