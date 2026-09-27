import { 
  signInWithPopup, 
  linkWithPopup,
  signInAnonymously as firebaseSignInAnonymously,
  GoogleAuthProvider, 
  OAuthProvider,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  updateProfile,
  User 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { handleFirestoreError, OperationType } from './errorHandler';
import { GymBuddy } from '../types/gym';

export interface UserProfileData {
  id: string;
  email: string;
  name: string;
  handle: string;
  avatar: string;
  gymVenue: string;
  streakWeeks: number;
  bio: string;
  isAnonymous?: boolean;
  friends?: GymBuddy[];
  fcmToken?: string;
  fcmTokens?: string[];
  createdAt: string;
}

/**
 * Links and synchronizes user profile document in Firestore: /users/{userId}
 */
export async function syncUserProfile(user: User, fallbackName?: string): Promise<UserProfileData> {
  const userRef = doc(db, 'users', user.uid);
  const name = (
    user.displayName ||
    fallbackName ||
    user.email?.split('@')[0] ||
    (user.isAnonymous ? 'Gymer Khách' : 'Gymer Đi Tập Đê')
  ).slice(0, 100);
  const cleanHandle = `@${name.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 20)}`;

  const newProfile: UserProfileData = {
    id: user.uid,
    email: (user.email || '').slice(0, 150),
    name: name,
    handle: cleanHandle,
    avatar: (user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80').slice(0, 500),
    gymVenue: 'California Fitness Thanh Hóa',
    streakWeeks: 1,
    bio: 'Đi tập đê! Kỷ luật hôm nay, cơ bắp ngày mai.',
    isAnonymous: user.isAnonymous,
    createdAt: new Date().toISOString(),
  };

  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const existingData = userSnap.data() as UserProfileData;
      if (!user.isAnonymous && existingData.isAnonymous) {
        const merged: Partial<UserProfileData> = {
          name,
          email: (user.email || existingData.email || '').slice(0, 150),
          avatar: (user.photoURL || existingData.avatar).slice(0, 500),
          isAnonymous: false,
        };
        await updateDoc(userRef, merged);
        return { ...existingData, ...merged };
      }
      return existingData;
    }

    await setDoc(userRef, newProfile);
    return newProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    return newProfile;
  }
}

/**
 * Start or reuse an Anonymous Session for quick testing
 */
export async function signInAnonymously(): Promise<{ user: User; profile: UserProfileData }> {
  if (auth.currentUser) {
    const profile = await syncUserProfile(auth.currentUser);
    return { user: auth.currentUser, profile };
  }
  const result = await firebaseSignInAnonymously(auth);
  const profile = await syncUserProfile(result.user, 'Gymer Khách');
  return { user: result.user, profile };
}

/**
 * Sign in or Link anonymous account using Google Popup
 */
export async function signInWithGoogle(): Promise<{ user: User; profile: UserProfileData }> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  let user: User;
  if (auth.currentUser && auth.currentUser.isAnonymous) {
    try {
      const linked = await linkWithPopup(auth.currentUser, provider);
      user = linked.user;
    } catch (err: any) {
      if (
        err?.code === 'auth/credential-already-in-use' ||
        err?.code === 'auth/provider-already-linked' ||
        err?.code === 'auth/email-already-in-use'
      ) {
        const result = await signInWithPopup(auth, provider);
        user = result.user;
      } else {
        throw err;
      }
    }
  } else {
    const result = await signInWithPopup(auth, provider);
    user = result.user;
  }

  const profile = await syncUserProfile(user);
  return { user, profile };
}

/**
 * Sign in or Link anonymous account using Apple Popup
 */
export async function signInWithApple(): Promise<{ user: User; profile: UserProfileData }> {
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');

  let user: User;
  if (auth.currentUser && auth.currentUser.isAnonymous) {
    try {
      const linked = await linkWithPopup(auth.currentUser, provider);
      user = linked.user;
    } catch (err: any) {
      if (
        err?.code === 'auth/credential-already-in-use' ||
        err?.code === 'auth/provider-already-linked' ||
        err?.code === 'auth/email-already-in-use'
      ) {
        const result = await signInWithPopup(auth, provider);
        user = result.user;
      } else {
        throw err;
      }
    }
  } else {
    const result = await signInWithPopup(auth, provider);
    user = result.user;
  }

  const profile = await syncUserProfile(user);
  return { user, profile };
}

/**
 * Sign in using Email and Password
 */
export async function signInWithEmail(email: string, pass: string): Promise<{ user: User; profile: UserProfileData }> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const profile = await syncUserProfile(result.user);
  return { user: result.user, profile };
}

/**
 * Sign up using Email, Password and Display Name
 */
export async function signUpWithEmail(email: string, pass: string, displayName: string): Promise<{ user: User; profile: UserProfileData }> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
  const profile = await syncUserProfile(result.user, displayName);
  return { user: result.user, profile };
}

/**
 * Update user profile document in Firestore
 */
export async function updateUserProfileInDb(userId: string, partial: Partial<UserProfileData>): Promise<void> {
  const userRef = doc(db, 'users', userId);
  try {
    await updateDoc(userRef, partial);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}

/**
 * Sign Out
 */
export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}
