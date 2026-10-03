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
  arrayRemove,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { handleFirestoreError, OperationType } from './errorHandler';
import { FeedPost, WorkoutSession, PostComment, GymBuddy } from '../types/gym';
import { UserProfileData } from './auth';
import { sortPostsByRealTime, formatRealTimeDisplay } from '../utils/postTimestamp';

/**
 * Recursively strips `undefined` properties from plain objects and arrays
 * while preserving Firestore FieldValue sentinels (increment, arrayUnion, arrayRemove).
 */
export function stripUndefinedDeep<T>(value: T): T {
  if (value === undefined) {
    return undefined as unknown as T;
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  const proto = Object.getPrototypeOf(value);
  if (proto && proto !== Object.prototype) {
    return value;
  }
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (v !== undefined) {
      result[k] = stripUndefinedDeep(v);
    }
  }
  return result as T;
}

/**
 * Publish a new workout post to Firestore /posts/{postId}
 */
export async function publishPostToFirestore(post: FeedPost): Promise<void> {
  const postRef = doc(db, 'posts', post.id);
  const nowMs = Date.now();
  const createdAt =
    typeof post.createdAt === 'string' && post.createdAt
      ? post.createdAt
      : new Date(nowMs).toISOString();
  const payload = stripUndefinedDeep({
    ...post,
    timestamp:
      !post.timestamp || post.timestamp === 'Vừa xong'
        ? formatRealTimeDisplay(Date.parse(createdAt) || nowMs, nowMs)
        : post.timestamp,
    createdAt,
  });

  try {
    await setDoc(postRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `posts/${post.id}`);
  }
}

/**
 * Real-time subscription to community feed posts sorted by real publication time
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
        onData(sortPostsByRealTime(posts));
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, 'posts');
    }
  );

  return unsubscribe;
}

/**
 * Toggle a Dap (Clap/Kudo) on a feed post.
 * Safely checks whether the post exists in Firestore first so initial/local seed posts
 * can be upserted cleanly instead of failing updateDoc on a non-existent document.
 */
export async function togglePostDap(
  postId: string,
  userId: string,
  hasDapped: boolean,
  fallbackPost?: FeedPost
): Promise<void> {
  const postRef = doc(db, 'posts', postId);
  try {
    const snap = await getDoc(postRef);
    if (!snap.exists()) {
      if (fallbackPost) {
        const nowMs = Date.now();
        const createdAt =
          typeof fallbackPost.createdAt === 'string' && fallbackPost.createdAt
            ? fallbackPost.createdAt
            : new Date(nowMs).toISOString();
        await setDoc(
          postRef,
          stripUndefinedDeep({
            ...fallbackPost,
            id: postId,
            dapsCount: Math.max(0, fallbackPost.dapsCount),
            dappedBy: hasDapped ? [] : [userId],
            createdAt,
          })
        );
      }
      return;
    }

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
 * Atomically publish a workout post and save the completed workout session
 * in a single Firestore batch write (`writeBatch`).
 */
export async function publishWorkoutAndPostBatch(
  userId: string,
  post: FeedPost,
  session?: WorkoutSession | null
): Promise<void> {
  const batch = writeBatch(db);
  const nowMs = Date.now();
  const nowIso =
    typeof post.createdAt === 'string' && post.createdAt
      ? post.createdAt
      : new Date(nowMs).toISOString();

  const postRef = doc(db, 'posts', post.id);
  batch.set(
    postRef,
    stripUndefinedDeep({
      ...post,
      timestamp:
        !post.timestamp || post.timestamp === 'Vừa xong'
          ? formatRealTimeDisplay(Date.parse(nowIso) || nowMs, nowMs)
          : post.timestamp,
      createdAt: nowIso,
    })
  );

  if (session) {
    const sessionRef = doc(db, 'users', userId, 'sessions', session.id);
    batch.set(
      sessionRef,
      stripUndefinedDeep({
        ...session,
        userId,
        createdAt: nowIso,
      })
    );
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `posts/${post.id}`);
  }
}

/**
 * Save user workout session to /users/{userId}/sessions/{sessionId}
 */
export async function saveWorkoutSessionToDb(userId: string, session: WorkoutSession): Promise<void> {
  const sessionRef = doc(db, 'users', userId, 'sessions', session.id);
  const payload = stripUndefinedDeep({
    ...session,
    userId,
    createdAt: new Date().toISOString(),
  });

  try {
    await setDoc(sessionRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${userId}/sessions/${session.id}`);
  }
}

/**
 * Delete a post from Firestore /posts/{postId} if it exists and is owned by the user
 */
export async function deletePostFromFirestore(postId: string, currentUserId?: string): Promise<void> {
  const postRef = doc(db, 'posts', postId);
  try {
    const snap = await getDoc(postRef);
    if (!snap.exists()) return;
    const ownerId = snap.data()?.userId;
    if (currentUserId && ownerId && ownerId !== currentUserId) {
      return;
    }
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
  updates: { title?: string; caption?: string; media?: FeedPost['media'] },
  fallbackPost?: FeedPost
): Promise<void> {
  const postRef = doc(db, 'posts', postId);
  const cleanUpdates = stripUndefinedDeep(updates);
  try {
    const snap = await getDoc(postRef);
    if (!snap.exists()) {
      if (fallbackPost) {
        await setDoc(
          postRef,
          stripUndefinedDeep({
            ...fallbackPost,
            ...cleanUpdates,
            id: postId,
          })
        );
      }
      return;
    }
    await updateDoc(postRef, cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
  }
}

/**
 * Add a comment to a feed post and create /posts/{postId}/comments/{commentId}
 * to trigger the automated Firebase Cloud Function notification.
 */
export async function addCommentToPost(
  postId: string,
  comment: PostComment,
  fallbackPost?: FeedPost
): Promise<void> {
  const postRef = doc(db, 'posts', postId);
  const commentId = (comment.id || `comment_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  const commentDocRef = doc(db, 'posts', postId, 'comments', commentId);
  const cleanComment = stripUndefinedDeep(comment);

  try {
    const snap = await getDoc(postRef);
    const batch = writeBatch(db);

    batch.set(commentDocRef, {
      id: commentId,
      postId,
      userId: comment.userId || '',
      userName: (comment.userName || 'Gymer DiTapDe').slice(0, 100),
      userAvatar: (comment.userAvatar || '').slice(0, 500),
      text: (comment.text || '').slice(0, 500),
      timestamp: comment.timestamp || 'Vừa xong',
      createdAt: new Date().toISOString(),
    });

    if (snap.exists()) {
      batch.update(postRef, {
        commentsCount: increment(1),
        comments: arrayUnion(cleanComment),
      });
    } else if (fallbackPost) {
      const nowMs = Date.now();
      const createdAt =
        typeof fallbackPost.createdAt === 'string' && fallbackPost.createdAt
          ? fallbackPost.createdAt
          : new Date(nowMs).toISOString();
      batch.set(
        postRef,
        stripUndefinedDeep({
          ...fallbackPost,
          id: postId,
          commentsCount: (fallbackPost.commentsCount || 0) + 1,
          comments: [...(fallbackPost.comments || []), cleanComment],
          createdAt,
        })
      );
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `posts/${postId}/comments/${commentId}`);
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
  const cleanFriends = stripUndefinedDeep(friends);
  try {
    await setDoc(userRef, { friends: cleanFriends }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}
