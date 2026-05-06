'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from '@/types';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const ADMIN_EMAILS = ['admin@youthconnect.africa'];

  // Check if Firebase auth is available (avoids build-time errors)
  const isFirebaseAvailable = typeof window !== 'undefined' && auth;

  useEffect(() => {
    // Skip Firebase initialization during build/SSR
    if (!isFirebaseAvailable) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as User);
            setIsAdmin(ADMIN_EMAILS.includes(firebaseUser.email || ''));
          } else {
            // Create user document with all profile fields
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Anonymous',
              photoURL: firebaseUser.photoURL || '',
              phoneNumber: '',
              location: '',
              bio: '',
              website: '',
              skills: [],
              education: '',
              occupation: '',
              isVerified: false,
              joinDate: new Date(),
              createdAt: new Date(),
              role: ADMIN_EMAILS.includes(firebaseUser.email || '') ? 'admin' : 'user',
            };
            
            // Only set if all required fields are valid
            if (newUser.uid && newUser.email) {
              await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
              setUserData(newUser);
              setIsAdmin(ADMIN_EMAILS.includes(firebaseUser.email || ''));
            } else {
              console.error('Invalid user data:', newUser);
            }
          }
        } catch (error) {
          console.error('Error fetching/creating user document:', error);
          // Set basic user data even if Firestore fails
          setUserData({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Anonymous',
            photoURL: '',
            phoneNumber: '',
            location: '',
            bio: '',
            website: '',
            skills: [],
            education: '',
            occupation: '',
            isVerified: false,
            joinDate: new Date(),
            createdAt: new Date(),
            role: 'user',
          });
          setIsAdmin(ADMIN_EMAILS.includes(firebaseUser.email || ''));
        }
      } else {
        setUserData(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [isFirebaseAvailable]);

  // Dummy functions for build-time (won't be called anyway)
  const login = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase not initialized');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string, displayName: string) => {
    if (!auth) throw new Error('Firebase not initialized');
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });
  };

  const logout = async () => {
    if (!auth) throw new Error('Firebase not initialized');
    await signOut(auth);
  };

  const value = {
    user,
    userData,
    loading,
    login,
    signup,
    logout,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}