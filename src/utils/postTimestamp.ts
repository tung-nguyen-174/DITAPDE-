import { FeedPost, PostComment } from '../types/gym';

// Stable session boot timestamp so relative mock timestamps ("18 phút trước")
// anchor to the moment the app started and age naturally in real time.
const APP_BOOT_MS = Date.now();

/**
 * Extracts a canonical epoch millisecond timestamp from any Firestore/client value,
 * post ID, or legacy Vietnamese relative timestamp string.
 */
export function resolveTimestampMs(
  createdAt?: unknown,
  id?: string,
  legacyTimestamp?: string,
  referenceMs: number = APP_BOOT_MS
): number {
  // 1. Explicit createdAt (ISO string, epoch ms number, or Firestore Timestamp)
  if (createdAt !== undefined && createdAt !== null) {
    if (typeof createdAt === 'number' && Number.isFinite(createdAt)) {
      return createdAt < 1e12 ? createdAt * 1000 : createdAt;
    }
    if (typeof createdAt === 'string' && createdAt.trim()) {
      const numeric = Number(createdAt.trim());
      if (Number.isFinite(numeric) && numeric > 1e9) {
        return numeric < 1e12 ? numeric * 1000 : numeric;
      }
      const parsed = Date.parse(createdAt);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    if (typeof createdAt === 'object') {
      const obj = createdAt as {
        toMillis?: () => number;
        seconds?: number;
        _seconds?: number;
      };
      if (typeof obj.toMillis === 'function') {
        return obj.toMillis();
      }
      const secs = obj.seconds ?? obj._seconds;
      if (typeof secs === 'number' && Number.isFinite(secs)) {
        return secs * 1000;
      }
    }
  }

  // 2. Extract 13-digit epoch ms embedded in ID (e.g., "post-1759234567890" or "comment-1759234567890-ab12")
  if (typeof id === 'string' && id) {
    const match13 = id.match(/\b(1[5-9]\d{11})\b/) || id.match(/(1[5-9]\d{11})/);
    if (match13) {
      const parsedIdMs = parseInt(match13[1], 10);
      if (Number.isFinite(parsedIdMs)) {
        return parsedIdMs;
      }
    }
  }

  // 3. Parse legacy Vietnamese relative strings ("18 phút trước", "1 giờ trước", "2 ngày trước")
  if (typeof legacyTimestamp === 'string' && legacyTimestamp.trim()) {
    const raw = legacyTimestamp.trim();
    const lower = raw.toLowerCase();

    const minsMatch = lower.match(/(\d+)\s*phút\s*trước/);
    if (minsMatch) {
      return referenceMs - parseInt(minsMatch[1], 10) * 60 * 1000;
    }

    const hoursMatch = lower.match(/(\d+)\s*(?:giờ|tiếng)\s*trước/);
    if (hoursMatch) {
      return referenceMs - parseInt(hoursMatch[1], 10) * 60 * 60 * 1000;
    }

    const daysMatch = lower.match(/(\d+)\s*ngày\s*trước/);
    if (daysMatch) {
      return referenceMs - parseInt(daysMatch[1], 10) * 24 * 60 * 60 * 1000;
    }

    // Check if legacyTimestamp already contains "HH:mm" or "DD/MM/YYYY"
    const clockDateMatch = raw.match(/(\d{1,2}):(\d{2})(?:\s*·\s*(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?)?/);
    if (clockDateMatch) {
      const now = new Date(referenceMs);
      const hh = parseInt(clockDateMatch[1], 10);
      const mm = parseInt(clockDateMatch[2], 10);
      const day = clockDateMatch[3] ? parseInt(clockDateMatch[3], 10) : now.getDate();
      const month = clockDateMatch[4] ? parseInt(clockDateMatch[4], 10) - 1 : now.getMonth();
      const year = clockDateMatch[5] ? parseInt(clockDateMatch[5], 10) : now.getFullYear();
      const constructed = new Date(year, month, day, hh, mm).getTime();
      if (!Number.isNaN(constructed)) {
        return constructed;
      }
    }

    const directParse = Date.parse(raw);
    if (!Number.isNaN(directParse)) {
      return directParse;
    }
  }

  // Deterministic fallback for static seed IDs
  if (id === 'post-1') return referenceMs - 18 * 60 * 1000;
  if (id === 'post-friend-thao') return referenceMs - 25 * 60 * 1000;
  if (id === 'post-friend-huy') return referenceMs - 40 * 60 * 1000;
  if (id === 'post-2') return referenceMs - 60 * 60 * 1000;
  if (id === 'post-3') return referenceMs - 3 * 60 * 60 * 1000;
  if (id === 'post-friend-duc') return referenceMs - 8 * 60 * 1000;

  return referenceMs;
}

export function getPostEpochMs(post: FeedPost): number {
  return resolveTimestampMs(post.createdAt, post.id, post.timestamp);
}

/**
 * Formats an epoch ms timestamp into a human-readable Vietnamese string
 * that includes both the exact clock time (and date if not today) and relative elapsed time.
 * Example:
 * - < 1 min: "Vừa xong · 14:10"
 * - < 60 mins: "12 phút trước · 13:58"
 * - Today >= 1 hr: "2 giờ trước · 12:10"
 * - Yesterday: "Hôm qua lúc 18:30"
 * - Older: "28/09/2026 lúc 18:30"
 */
export function formatRealTimeDisplay(epochMs: number, nowMs: number = Date.now()): string {
  const date = new Date(epochMs);
  const now = new Date(nowMs);

  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const timeStr = `${hh}:${mm}`;

  const diffMs = Math.max(0, nowMs - epochMs);
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);

  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (diffMinutes < 1) {
    return `Vừa xong · ${timeStr}`;
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước · ${timeStr}`;
  }
  if (isSameDay) {
    return `${diffHours} giờ trước · ${timeStr}`;
  }
  if (isYesterday) {
    return `Hôm qua lúc ${timeStr}`;
  }

  const dd = String(date.getDate()).padStart(2, '0');
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mo}/${yyyy} lúc ${timeStr}`;
}

export function formatPostTimestamp(post: FeedPost, nowMs: number = Date.now()): string {
  const epochMs = getPostEpochMs(post);
  return formatRealTimeDisplay(epochMs, nowMs);
}

export function formatCommentTimestamp(comment: PostComment, nowMs: number = Date.now()): string {
  const epochMs = resolveTimestampMs(comment.createdAt, comment.id, comment.timestamp);
  return formatRealTimeDisplay(epochMs, nowMs);
}

/**
 * Sorts feed posts in descending real-time order (newest post first).
 */
export function sortPostsByRealTime(posts: FeedPost[]): FeedPost[] {
  return [...posts].sort((a, b) => getPostEpochMs(b) - getPostEpochMs(a));
}
