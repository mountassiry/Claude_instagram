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
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, InviteCode } from '../types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, inviteCode: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            id: firebaseUser.uid,
            email: userData.email,
            displayName: userData.displayName,
            photoURL: userData.photoURL,
            role: userData.role,
            createdAt: userData.createdAt?.toDate() || new Date(),
            invitedBy: userData.invitedBy,
            isActive: userData.isActive,
          });
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const validateInviteCode = async (code: string): Promise<InviteCode | null> => {
    const invitesRef = collection(db, 'invites');
    const q = query(invitesRef, where('code', '==', code), where('isUsed', '==', false));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const inviteDoc = snapshot.docs[0];
    const invite = inviteDoc.data() as InviteCode;

    // Check if expired
    const expiresAt = invite.expiresAt instanceof Date ? invite.expiresAt : (invite.expiresAt as any).toDate();
    if (expiresAt < new Date()) {
      return null;
    }

    return { ...invite, id: inviteDoc.id };
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    const result = await signInWithEmailAndPassword(auth, email, password);

    // Check if user is active
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    if (userDoc.exists() && !userDoc.data().isActive) {
      await firebaseSignOut(auth);
      throw new Error('Your account has been deactivated. Please contact the admin.');
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    inviteCode: string
  ): Promise<void> => {
    // Validate invite code first
    const invite = await validateInviteCode(inviteCode);
    if (!invite) {
      throw new Error('Invalid or expired invite code');
    }

    // Create Firebase auth user
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Update display name
    await updateProfile(result.user, { displayName });

    // Check if this is the first user (make them admin)
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    const isFirstUser = usersSnapshot.empty;

    // Create user document in Firestore
    const userData: Omit<User, 'id'> = {
      email,
      displayName,
      role: isFirstUser ? 'admin' : 'member',
      createdAt: new Date(),
      invitedBy: invite.createdBy,
      isActive: true,
    };

    await setDoc(doc(db, 'users', result.user.uid), userData);

    // Mark invite as used
    await updateDoc(doc(db, 'invites', invite.id), {
      isUsed: true,
      usedBy: result.user.uid,
      usedAt: new Date(),
    });
  };

  const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
