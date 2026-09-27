/**
 * Firestore Security Rules Verification Suite (Dirty Dozen Payloads)
 * Verifies all 12 adversarial payloads defined in security_spec.md return PERMISSION_DENIED.
 */

export interface DirtyDozenScenario {
  id: number;
  name: string;
  authUid: string | null;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_SCENARIOS: DirtyDozenScenario[] = [
  {
    id: 1,
    name: 'Identity Spoofing on User Create',
    authUid: 'user_A',
    operation: 'create',
    path: 'users/user_B',
    payload: { id: 'user_B', name: 'Spoofer', streakWeeks: 1 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'ID Mutation on User Update',
    authUid: 'user_A',
    operation: 'update',
    path: 'users/user_A',
    payload: { id: 'user_B', name: 'Valid', streakWeeks: 2 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Negative Streak Poisoning',
    authUid: 'user_A',
    operation: 'create',
    path: 'users/user_A',
    payload: { id: 'user_A', name: 'Valid', streakWeeks: -5 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Oversized Name DoS (> 100 chars)',
    authUid: 'user_A',
    operation: 'create',
    path: 'users/user_A',
    payload: { id: 'user_A', name: 'A'.repeat(150), streakWeeks: 1 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Cross-User Session Write',
    authUid: 'user_A',
    operation: 'create',
    path: 'users/user_B/sessions/sess_1',
    payload: {
      id: 'sess_1',
      userId: 'user_B',
      title: 'Push Day',
      totalTonnageKg: 2500,
      durationSeconds: 3600,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Private Session Read Leak',
    authUid: 'user_B',
    operation: 'get',
    path: 'users/user_A/sessions/sess_private',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Negative Tonnage Session Write',
    authUid: 'user_A',
    operation: 'create',
    path: 'users/user_A/sessions/sess_1',
    payload: {
      id: 'sess_1',
      userId: 'user_A',
      title: 'Push Day',
      totalTonnageKg: -100,
      durationSeconds: 3600,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Forged Feed Post Author',
    authUid: 'user_A',
    operation: 'create',
    path: 'posts/post_1',
    payload: {
      id: 'post_1',
      userId: 'user_B',
      userName: 'Spoof',
      title: 'Leg Day',
      totalTonnageKg: 1000,
      durationMinutes: 45,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Unauthorized Post Title Hijack',
    authUid: 'user_B',
    operation: 'update',
    path: 'posts/post_1',
    payload: { title: 'Hacked Title' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Unauthorized Post Deletion',
    authUid: 'user_B',
    operation: 'delete',
    path: 'posts/post_1',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Self-Nudge / Spoofed Sender Nudge',
    authUid: 'user_A',
    operation: 'create',
    path: 'nudges/nudge_1',
    payload: {
      senderId: 'user_A',
      senderName: 'User A',
      targetUserId: 'user_A',
      message: 'Đi tập đê!',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unauthenticated Write Attempt',
    authUid: null,
    operation: 'create',
    path: 'posts/post_unauth',
    payload: {
      id: 'post_unauth',
      userId: 'anon',
      userName: 'Anon',
      title: 'Workout',
      totalTonnageKg: 500,
      durationMinutes: 30,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
];
