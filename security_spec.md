# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Identity Ownership (`/users/{userId}`)**: A user profile document can only be created or updated by the authenticated user whose `request.auth.uid == userId`. The `id` field is immutable once created.
2. **Session Ownership (`/users/{userId}/sessions/{sessionId}`)**: A workout session can only be created, updated, or deleted by `request.auth.uid == userId`, and `incoming().userId` must equal `userId`. Private sessions can only be read by their owner.
3. **Feed Post Integrity (`/posts/{postId}` & `/feed_posts/{postId}`)**: A feed post can only be created by an authenticated user where `incoming().userId == request.auth.uid`. Only the author can delete the post or update core workout fields; other signed-in users can only update interaction fields (`dapsCount`, `dappedBy`, `commentsCount`, `comments`, `forkCount`).
4. **Nudge Integrity (`/nudges/{nudgeId}`)**: A nudge document can only be created by an authenticated user (`senderId == request.auth.uid`) targeting a different user (`targetUserId != request.auth.uid`), with message length `<= 250`. Only the sender or recipient (`targetUserId`) can read the nudge.

## 2. The "Dirty Dozen" Payloads
1. **Identity Spoofing on User Create**: Authenticated as `user_A`, attempting to create `/users/user_B` with `{"id": "user_B", "name": "Spoofer", "streakWeeks": 1}` -> `PERMISSION_DENIED`.
2. **ID Mutation on User Update**: Authenticated as `user_A`, attempting to update `/users/user_A` with `{"id": "user_B", "name": "Valid", "streakWeeks": 2}` -> `PERMISSION_DENIED`.
3. **Negative Streak Poisoning**: Authenticated as `user_A`, attempting to create `/users/user_A` with `{"id": "user_A", "name": "Valid", "streakWeeks": -5}` -> `PERMISSION_DENIED`.
4. **Oversized Name DoS**: Authenticated as `user_A`, attempting to create `/users/user_A` with `name` of 500 characters (`> 100`) -> `PERMISSION_DENIED`.
5. **Cross-User Session Write**: Authenticated as `user_A`, attempting to create `/users/user_B/sessions/sess_1` -> `PERMISSION_DENIED`.
6. **Private Session Read Leak**: Authenticated as `user_B`, attempting to read `/users/user_A/sessions/sess_private` where `visibility == 'private'` -> `PERMISSION_DENIED`.
7. **Negative Tonnage Session Write**: Authenticated as `user_A`, attempting to create `/users/user_A/sessions/sess_1` with `totalTonnageKg: -100` -> `PERMISSION_DENIED`.
8. **Forged Feed Post Author**: Authenticated as `user_A`, attempting to create `/posts/post_1` with `{"id": "post_1", "userId": "user_B", "userName": "Spoof", "title": "Leg Day", "totalTonnageKg": 1000, "durationMinutes": 45}` -> `PERMISSION_DENIED`.
9. **Unauthorized Post Title Hijack**: Authenticated as `user_B`, attempting to update `/posts/post_1` (owned by `user_A`) changing `title` to `"Hacked"` -> `PERMISSION_DENIED`.
10. **Unauthorized Post Deletion**: Authenticated as `user_B`, attempting to delete `/posts/post_1` (owned by `user_A`) -> `PERMISSION_DENIED`.
11. **Self-Nudge / Spoofed Sender Nudge**: Authenticated as `user_A`, attempting to create `/nudges/nudge_1` with `senderId: "user_B"` or `targetUserId: "user_A"` -> `PERMISSION_DENIED`.
12. **Unauthenticated Write Attempt**: Unauthenticated client (`request.auth == null`) attempting to create or update any document in `/users`, `/posts`, `/feed_posts`, or `/nudges` -> `PERMISSION_DENIED`.
