import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './config';
import { 
  UserProfileData, 
  syncUserProfile, 
  signInAnonymously,
  signInWithGoogle, 
  signInWithApple,
  signInWithEmail, 
  signUpWithEmail, 
  signOutUser 
} from './auth';
import { registerAndSyncWebFcmToken } from './fcmService';

interface AuthContextType {
  user: User | null;
  profile: UserProfileData | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signInAnon: () => Promise<void>;
  signInGoogle: () => Promise<void>;
  signInApple: () => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<void>;
  signUpEmail: (email: string, pass: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userProf = await syncUserProfile(firebaseUser);
          setProfile(userProf);
          await registerAndSyncWebFcmToken(firebaseUser.uid);
        } catch (e) {
          console.error('Failed to sync user profile:', e);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const handleSignInAnon = async () => {
    const { profile: newProfile } = await signInAnonymously();
    setProfile(newProfile);
    closeAuthModal();
  };

  const handleSignInGoogle = async () => {
    const { profile: newProfile } = await signInWithGoogle();
    setProfile(newProfile);
    closeAuthModal();
  };

  const handleSignInApple = async () => {
    const { profile: newProfile } = await signInWithApple();
    setProfile(newProfile);
    closeAuthModal();
  };

  const handleSignInEmail = async (email: string, pass: string) => {
    const { profile: newProfile } = await signInWithEmail(email, pass);
    setProfile(newProfile);
    closeAuthModal();
  };

  const handleSignUpEmail = async (email: string, pass: string, name: string) => {
    const { profile: newProfile } = await signUpWithEmail(email, pass, name);
    setProfile(newProfile);
    closeAuthModal();
  };

  const handleSignOut = async () => {
    await signOutUser();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (auth.currentUser) {
      const updated = await syncUserProfile(auth.currentUser);
      setProfile(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        signInAnon: handleSignInAnon,
        signInGoogle: handleSignInGoogle,
        signInApple: handleSignInApple,
        signInEmail: handleSignInEmail,
        signUpEmail: handleSignUpEmail,
        signOut: handleSignOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
