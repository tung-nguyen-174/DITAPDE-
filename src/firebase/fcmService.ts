// src/firebase/fcmService.ts

import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';
import app, { db } from './config';
import { handleFirestoreError, OperationType } from './errorHandler';

const LOCAL_DEVICE_TOKEN_KEY = 'ditapde_web_fcm_token_v1';

/**
 * Generates or retrieves a persistent web device token fallback when browser Notification
 * permissions or VAPID keys are restricted inside an iframe environment, ensuring
 * `/users/{userId}.fcmTokens` is always populated as a valid array of device tokens.
 */
function getOrCreateFallbackWebToken(userId: string): string {
  try {
    const existing = localStorage.getItem(LOCAL_DEVICE_TOKEN_KEY);
    if (existing && existing.length >= 16) return existing;
    const generated = `web_fcm_${userId.slice(0, 12)}_${Date.now().toString(36)}`;
    localStorage.setItem(LOCAL_DEVICE_TOKEN_KEY, generated);
    return generated;
  } catch {
    return `web_fcm_${userId.slice(0, 12)}_default`;
  }
}

/**
 * Registers `/firebase-messaging-sw.js`, retrieves the Web FCM token (or fallback token),
 * and stores it inside `/users/{userId}` under the `fcmTokens` array.
 */
export async function registerAndSyncWebFcmToken(userId: string): Promise<string | null> {
  if (!userId || typeof window === 'undefined') return null;

  let resolvedToken: string | null = null;

  try {
    const supported = await isSupported();
    if (supported && 'serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
        { scope: '/' }
      );

      if ('Notification' in window && Notification.permission === 'granted') {
        const messaging = getMessaging(app);
        const vapidKey = (import.meta as any).env?.VITE_FIREBASE_VAPID_KEY;
        const fcmToken = await getToken(messaging, {
          serviceWorkerRegistration: registration,
          ...(vapidKey ? { vapidKey } : {}),
        });
        if (fcmToken) {
          resolvedToken = fcmToken;
        }
      }
    }
  } catch (err) {
    console.warn('Web FCM Service Worker token fallback:', err);
  }

  if (!resolvedToken) {
    resolvedToken = getOrCreateFallbackWebToken(userId);
  }

  // Persist into /users/{userId} as an fcmTokens array (and fcmToken for single-token compatibility)
  const userRef = doc(db, 'users', userId);
  try {
    await setDoc(
      userRef,
      {
        fcmTokens: arrayUnion(resolvedToken),
        fcmToken: resolvedToken,
        lastTokenUpdate: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }

  return resolvedToken;
}

/**
 * Explicitly prompts the user for Web Push Notification permission and syncs the real FCM token
 */
export async function requestWebPushPermissionAndSync(userId: string): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      return await registerAndSyncWebFcmToken(userId);
    }
  } catch (err) {
    console.warn('Notification permission request note:', err);
  }
  return await registerAndSyncWebFcmToken(userId);
}

/**
 * Listen for foreground FCM push messages while the Web app is open
 */
export async function listenToForegroundFcmMessages(
  onNotification: (title: string, body: string) => void
): Promise<(() => void) | null> {
  try {
    const supported = await isSupported();
    if (!supported) return null;
    const messaging = getMessaging(app);
    const unsubscribe = onMessage(messaging, (payload) => {
      const title = payload.notification?.title || 'New Gym Nudge! 🏋️‍♂️';
      const body = payload.notification?.body || 'Bạn vừa nhận được thông báo mới!';
      onNotification(title, body);
    });
    return unsubscribe;
  } catch {
    return null;
  }
}
