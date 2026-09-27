import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './config';
import { handleFirestoreError, OperationType } from './errorHandler';
import { FeedPost, WorkoutSession, PostComment, GymBuddy } from '../types/gym';
import { UserProfileData } from './auth';

/**
 * Publish a new workout post to Firestore /posts/{postId}
 */
export async function publishPostToFirestore(post: FeedPost): Promise<void> {
  const postRef = doc(db, 'posts', post.id);
  const payload = {
    ...post,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(postRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `posts/${post.id}`);
  }
}

/**
 * Real-time subscription to community feed posts
 */
export function subscribeToFeedPosts(
  onData: (posts: FeedPost[]) => void
): () => void {
  const postsCollection = collection(db, 'posts');
  const q = query(postsCollection, limit(50));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const posts: FeedPost[] = [];
      snapshot.forEach((docSnap) => {
        posts.push(docSnap.data() as FeedPost);
      });
      if (posts.length > 0) {
        onData(posts);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'posts');
    }
  );

  return unsubscribe;
}

/**
 * Toggle a Dap (Clap/Kudo) on a feed post
 */
export async function togglePostDap(postId: string, userId: string, hasDapped: boolean): Promise<void> {
  const postRef = doc(db, 'posts', postId);
  try {
    if (hasDapped) {
      await updateDoc(postRef, {
        dapsCount: increment(-1),
        dappedBy: arrayRemove(userId),
      });
    } else {
      await updateDoc(postRef, {
        dapsCount: increment(1),
        dappedBy: arrayUnion(userId),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
  }
}

/**
 * Save user workout session to /users/{userId}/sessions/{sessionId}
 */
export async function saveWorkoutSessionToDb(userId: string, session: WorkoutSession): Promise<void> {
  const sessionRef = doc(db, 'users', userId, 'sessions', session.id);
  const payload = {
    ...session,
    userId,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(sessionRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${userId}/sessions/${session.id}`);
  }
}

/**
 * Delete a post from Firestore /posts/{postId}
 */
export async function deletePostFromFirestore(postId: string): Promise<void> {
  const postRef = doc(db, 'posts', postId);
  try {
    await deleteDoc(postRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
  }
}

/**
 * Update a post title, caption, or media in Firestore
 */
export async function updatePostInFirestore(
  postId: string, 
  updates: { title?: string; caption?: string; media?: FeedPost['media'] }
): Promise<void> {
  const postRef = doc(db, 'posts', postId);
  try {
    await updateDoc(postRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
  }
}

/**
 * Add a comment to a feed post and create /posts/{postId}/comments/{commentId}
 * to trigger the automated Firebase Cloud Function notification.
 */
export async function addCommentToPost(postId: string, comment: PostComment): Promise<void> {
  const postRef = doc(db, 'posts', postId);
  const commentId = (comment.id || `comment_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  const commentDocRef = doc(db, 'posts', postId, 'comments', commentId);

  try {
    await setDoc(commentDocRef, {
      id: commentId,
      postId,
      userId: comment.userId || '',
      userName: (comment.userName || 'Gymer DiTapDe').slice(0, 100),
      userAvatar: (comment.userAvatar || '').slice(0, 500),
      text: (comment.text || '').slice(0, 500),
      timestamp: comment.timestamp || 'Vừa xong',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `posts/${postId}/comments/${commentId}`);
  }

  try {
    await updateDoc(postRef, {
      commentsCount: increment(1),
      comments: arrayUnion(comment),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
  }
}

/**
 * Create a nudge document in /nudges_log/{logId} to trigger the automated
 * `onNudgeCreated` Firebase Cloud Function multicast push notification.
 */
export async function createNudgeLogInFirestore(params: {
  senderId: string;
  senderName: string;
  recipientId: string;
  message: string;
}): Promise<void> {
  const logId = `nudge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const nudgeRef = doc(db, 'nudges_log', logId);

  try {
    await setDoc(nudgeRef, {
      senderId: params.senderId.slice(0, 128),
      senderName: params.senderName.slice(0, 100),
      recipientId: params.recipientId.slice(0, 128),
      targetUserId: params.recipientId.slice(0, 128),
      message: (params.message || 'Đi tập đê!').slice(0, 250),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `nudges_log/${logId}`);
  }
}

/**
 * Search Firestore /users collection by username (handle) or email
 */
export async function findUserByUsernameOrEmail(searchQuery: string): Promise<GymBuddy | null> {
  const normalized = searchQuery.trim().toLowerCase();
  const normalizedHandle = normalized.startsWith('@') ? normalized : `@${normalized}`;
  const usersRef = collection(db, 'users');

  try {
    const snap = await getDocs(query(usersRef, limit(50)));
    let matchedUser: UserProfileData | null = null;

    snap.forEach((docSnap) => {
      const data = docSnap.data() as UserProfileData;
      const emailMatch = data.email && data.email.toLowerCase() === normalized;
      const handleMatch =
        data.handle &&
        (data.handle.toLowerCase() === normalized || data.handle.toLowerCase() === normalizedHandle);
      const nameMatch = data.name && data.name.toLowerCase() === normalized;

      if (emailMatch || handleMatch || nameMatch) {
        matchedUser = data;
      }
    });

    if (matchedUser) {
      const u = matchedUser as UserProfileData;
      return {
        id: u.id,
        name: u.name,
        username: u.handle || `@${u.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}`,
        email: u.email,
        avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        gymLocation: u.gymVenue || 'California Fitness Thanh Hóa',
        status: 'online_gym',
        streakWeeks: u.streakWeeks || 4,
        canNudge: true,
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'users');
    return null;
  }
}

/**
 * Sync the user's friends (GymBuddy[]) to their Firestore profile document
 */
export async function syncFriendsToFirestore(userId: string, friends: GymBuddy[]): Promise<void> {
  const userRef = doc(db, 'users', userId);
  try {
    await updateDoc(userRef, { friends });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}
