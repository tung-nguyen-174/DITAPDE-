const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Helper: Extracts deduplicated FCM device tokens from a user document
 * supporting both `fcmTokens` (array) and legacy `fcmToken` (string).
 */
function extractUserFcmTokens(userData) {
  if (!userData) return [];
  const tokenSet = new Set();

  if (Array.isArray(userData.fcmTokens)) {
    for (const t of userData.fcmTokens) {
      if (typeof t === "string" && t.trim().length > 0 && !t.startsWith("web_fcm_")) {
        tokenSet.add(t.trim());
      }
    }
  }

  if (
    typeof userData.fcmToken === "string" &&
    userData.fcmToken.trim().length > 0 &&
    !userData.fcmToken.startsWith("web_fcm_")
  ) {
    tokenSet.add(userData.fcmToken.trim());
  }

  return Array.from(tokenSet);
}

/**
 * Helper: Prunes expired/unregistered tokens from `/users/{userId}.fcmTokens`
 */
async function pruneInvalidTokens(userRef, tokens, batchResponse) {
  if (!batchResponse || !Array.isArray(batchResponse.responses)) return;
  const staleTokens = [];

  batchResponse.responses.forEach((resp, idx) => {
    if (!resp.success && resp.error) {
      const code = resp.error.code;
      if (
        code === "messaging/invalid-registration-token" ||
        code === "messaging/registration-token-not-registered"
      ) {
        staleTokens.push(tokens[idx]);
      }
    }
  });

  if (staleTokens.length > 0) {
    await userRef.update({
      fcmTokens: admin.firestore.FieldValue.arrayRemove(...staleTokens),
    });
  }
}

/**
 * 1. Automated Firestore Trigger: `/nudges_log/{logId}`
 * Sends multicast FCM push notifications to all registered devices (`fcmTokens`)
 * of the recipient when a new nudge document is created.
 */
exports.onNudgeCreated = functions.firestore
  .document("nudges_log/{logId}")
  .onCreate(async (snap, context) => {
    const data = snap.data() || {};
    const recipientId = data.recipientId || data.targetUserId;
    if (!recipientId) {
      return null;
    }

    const userRef = admin.firestore().doc(`users/${recipientId}`);
    const recipientSnap = await userRef.get();
    if (!recipientSnap.exists) {
      return null;
    }

    const recipientData = recipientSnap.data() || {};
    const tokens = extractUserFcmTokens(recipientData);
    const senderName = data.senderName || "Gym Buddy";
    const bodyText = data.message || `${senderName} sent you a nudge!`;

    if (tokens.length > 0) {
      const batchResponse = await admin.messaging().sendEachForMulticast({
        tokens: tokens,
        notification: {
          title: "New Gym Nudge! 🏋️‍♂️",
          body: bodyText,
        },
        data: {
          click_action: "FLUTTER_NOTIFICATION_CLICK",
          type: "workout_nudge",
          logId: context.params.logId,
          senderId: data.senderId || "",
          senderName: senderName,
        },
      });

      await pruneInvalidTokens(userRef, tokens, batchResponse);
    }

    return null;
  });

/**
 * 2. Automated Firestore Trigger: `/posts/{postId}/comments/{commentId}`
 * Sends multicast FCM push notifications to all registered devices (`fcmTokens`)
 * of the post author when a new comment document is created on their workout post.
 */
exports.onCommentCreated = functions.firestore
  .document("posts/{postId}/comments/{commentId}")
  .onCreate(async (snap, context) => {
    const commentData = snap.data() || {};
    const { postId, commentId } = context.params;

    const postSnap = await admin.firestore().doc(`posts/${postId}`).get();
    if (!postSnap.exists) {
      return null;
    }

    const postData = postSnap.data() || {};
    const recipientId = postData.userId;

    // Do not send self-notifications if the author comments on their own post
    if (!recipientId || (commentData.userId && commentData.userId === recipientId)) {
      return null;
    }

    const userRef = admin.firestore().doc(`users/${recipientId}`);
    const recipientSnap = await userRef.get();
    if (!recipientSnap.exists) {
      return null;
    }

    const recipientData = recipientSnap.data() || {};
    const tokens = extractUserFcmTokens(recipientData);
    const commenterName = commentData.userName || "Bạn tập";
    const commentText = commentData.text || "Đã bình luận vào buổi tập của bạn!";

    if (tokens.length > 0) {
      const batchResponse = await admin.messaging().sendEachForMulticast({
        tokens: tokens,
        notification: {
          title: `Bình luận mới từ ${commenterName} 💬`,
          body: commentText,
        },
        data: {
          click_action: "FLUTTER_NOTIFICATION_CLICK",
          type: "post_comment",
          postId: postId,
          commentId: commentId,
          senderId: commentData.userId || "",
        },
      });

      await pruneInvalidTokens(userRef, tokens, batchResponse);
    }

    return null;
  });

/**
 * 3. HTTPS Callable Gateway (`sendNudgeNotification`)
 * Rate-limits and records a nudge in `/nudges_log/{logId}` (which also triggers `onNudgeCreated`).
 */
exports.sendNudgeNotification = functions
  .runWith({
    maxInstances: 10,
    timeoutSeconds: 10,
  })
  .https.onCall(async (data, context) => {
    if (process.env.NODE_ENV === "production" && !context.app) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Yêu cầu bị từ chối do không qua được xác thực Firebase App Check."
      );
    }

    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Bạn cần đăng nhập để gửi lời nhắc Đi tập đê!"
      );
    }

    const targetUserId = data?.recipientId || data?.targetUserId;
    const senderId = context.auth.uid;

    if (!targetUserId || typeof targetUserId !== "string" || targetUserId === senderId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Mục tiêu nhận thông báo không hợp lệ."
      );
    }

    const db = admin.firestore();

    // Rate Limit: max 1 nudge per 30 seconds between the same pair of users
    const recentNudgeQuery = await db
      .collection("nudges_log")
      .where("senderId", "==", senderId)
      .where("targetUserId", "==", targetUserId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (!recentNudgeQuery.empty) {
      const lastNudge = recentNudgeQuery.docs[0].data();
      if (lastNudge.createdAt && typeof lastNudge.createdAt.toMillis === "function") {
        const timeDiff = (Date.now() - lastNudge.createdAt.toMillis()) / 1000;
        if (timeDiff < 30) {
          throw new functions.https.HttpsError(
            "resource-exhausted",
            `Vui lòng đợi ${Math.ceil(30 - timeDiff)} giây trước khi nhắc tiếp!`
          );
        }
      }
    }

    const senderDoc = await db.collection("users").doc(senderId).get();
    const senderData = senderDoc.data() || {};
    const senderName =
      data?.senderName || senderData.displayName || senderData.name || "Cạ tập";

    // Writing to `nudges_log` automatically invokes `exports.onNudgeCreated`
    const logRef = await db.collection("nudges_log").add({
      senderId,
      senderName,
      recipientId: targetUserId,
      targetUserId,
      message:
        data?.message ||
        `${senderName} vừa nhắc: "Đến giờ nâng tạ rồi, đi tập đê!" 💪`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, logId: logRef.id };
  });
