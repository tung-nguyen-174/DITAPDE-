import React, { useState, useEffect, useRef } from 'react';
import { 
  INITIAL_FEED_POSTS, 
  INITIAL_GYM_BUDDIES, 
  INITIAL_NOTIFICATIONS,
  DISCOVERABLE_GYM_USERS,
  createBuddyAndPostFromQuery
} from './data/mockData';
import { 
  FeedPost, 
  GymBuddy, 
  WorkoutSession, 
  RoutineTemplate,
  PostComment,
  AppNotification
} from './types/gym';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { FeedScreen } from './components/feed/FeedScreen';
import { DiscoverScreen } from './components/discover/DiscoverScreen';
import { ChallengesScreen } from './components/challenges/ChallengesScreen';
import { ProfileScreen } from './components/profile/ProfileScreen';
import { getSavedCustomAvatar } from './components/profile/ChangeProfileButton';
import { ActiveLoggerScreen } from './components/logger/ActiveLoggerScreen';
import { WorkoutInitBottomSheet } from './components/logger/WorkoutInitBottomSheet';
import { CrashRecoverySnackbar } from './components/common/CrashRecoverySnackbar';
import { SummaryScreen } from './components/summary/SummaryScreen';
import { useDeviceOrientation } from './hooks/useDeviceOrientation';
import { AuthProvider, useAuth } from './firebase/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { testConnection } from './firebase/connectionTest';
import { 
  publishWorkoutAndPostBatch,
  subscribeToFeedPosts, 
  togglePostDap, 
  deletePostFromFirestore,
  updatePostInFirestore,
  addCommentToPost,
  createNudgeLogInFirestore,
  findUserByUsernameOrEmail,
  syncFriendsToFirestore
} from './firebase/firestoreService';
import { TelemetryParser } from './utils/fitnessCalculations';
import {
  sortPostsByRealTime,
  formatRealTimeDisplay,
} from './utils/postTimestamp';
import {
  RoutineForkService,
  RoutineModel,
  RoutineExerciseModel,
} from './services/routineForkService';
import { WorkoutDraftCacheService } from './services/workoutDraftCacheService';
import {
  GymLocationModel,
  GooglePlacesService,
} from './services/googlePlacesService';

function GymChuotAppContent() {
  const { user, profile, loading, isAuthModalOpen, openAuthModal, closeAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'discover' | 'challenges' | 'profile'>('feed');
  const [currentScreen, setCurrentScreen] = useState<'tabs' | 'logger' | 'summary'>('tabs');
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);
  
  // Device Orientation Hook (Reacts to physical mobile & tablet rotation + simulation)
  const {
    orientation,
    isLandscape,
    deviceType,
    isTablet,
  } = useDeviceOrientation();

  // App Data State
  const NUDGE_COOLDOWN_MS = 30 * 60 * 1000; // 30 phút chống spam
  const [nudgeCooldowns, setNudgeCooldowns] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('ditapde_nudge_cooldowns');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [posts, setPosts] = useState<FeedPost[]>(INITIAL_FEED_POSTS);
  const [buddies, setBuddies] = useState<GymBuddy[]>(() =>
    INITIAL_GYM_BUDDIES.map((b) => {
      const lastNudge = nudgeCooldowns[b.id] ?? b.lastNudgeTime;
      return lastNudge !== undefined ? { ...b, lastNudgeTime: lastNudge } : { ...b };
    })
  );
  const [streakWeeks, setStreakWeeks] = useState<number>(6);
  const [customAvatar, setCustomAvatar] = useState<string | null>(() =>
    getSavedCustomAvatar()
  );
  const [activeGymCheckIn, setActiveGymCheckIn] = useState<GymLocationModel>(() =>
    GooglePlacesService.loadSavedCheckIn()
  );
  const currentGym = activeGymCheckIn.name;
  const setCurrentGym = (gymName: string) => {
    setActiveGymCheckIn((prev) => {
      if (prev.name === gymName) return prev;
      const matched = GooglePlacesService.getCachedOrFallbackGyms().find(
        (g) => g.name === gymName
      );
      return matched || { ...prev, name: gymName };
    });
  };
  const [hasUserLoggedWorkout, setHasUserLoggedWorkout] = useState<boolean>(false);
  const [userLoggedVolumeTons, setUserLoggedVolumeTons] = useState<number>(0);
  const [isBottomReloading, setIsBottomReloading] = useState<boolean>(false);
  const wasAtBottomRef = useRef<boolean>(false);
  const lastScrollReloadTimeRef = useRef<number>(0);

  const handleMainScroll = (e: React.UIEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isAtBottom = el.scrollTop > 40 && distanceToBottom <= 12;

    if (isAtBottom && !wasAtBottomRef.current) {
      wasAtBottomRef.current = true;
      const now = Date.now();
      if (now - lastScrollReloadTimeRef.current > 2500) {
        lastScrollReloadTimeRef.current = now;
        setIsBottomReloading(true);
        showToast('🔄 Đã làm mới Bảng Tin thành công!', 'cyan');
        setTimeout(() => {
          setIsBottomReloading(false);
        }, 700);
      }
    } else if (distanceToBottom > 48) {
      wasAtBottomRef.current = false;
    }
  };
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('ditapde_notifications_v1');
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const updateNotifications = (updater: (prev: AppNotification[]) => AppNotification[]) => {
    setNotifications((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem('ditapde_notifications_v1', JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const handleMarkNotificationRead = (id: string) => {
    updateNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllNotificationsRead = () => {
    updateNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleAcceptFriendRequest = async (notif: AppNotification) => {
    updateNotifications((prev) =>
      prev.map((n) =>
        n.id === notif.id ? { ...n, read: true, actionTaken: 'accepted' } : n
      )
    );
    await handleAddFriend(notif.senderUsername || notif.senderName || '@duc_power');
  };

  const handleDeclineFriendRequest = (notif: AppNotification) => {
    updateNotifications((prev) =>
      prev.map((n) =>
        n.id === notif.id ? { ...n, read: true, actionTaken: 'declined' } : n
      )
    );
    showToast(`Đã từ chối lời mời kết bạn từ ${notif.senderName || 'người dùng'}.`, 'orange');
  };

  const handleReplyDirectMessage = (notif: AppNotification, replyText: string) => {
    updateNotifications((prev) =>
      prev.map((n) =>
        n.id === notif.id
          ? { ...n, read: true, actionTaken: 'replied', replyText }
          : n
      )
    );
    showToast(`💬 Đã gửi tin nhắn trực tiếp tới ${notif.senderName || 'bạn tập'}!`, 'green');
  };

  const handleNudgeBack = (notif: AppNotification) => {
    updateNotifications((prev) =>
      prev.map((n) =>
        n.id === notif.id ? { ...n, read: true, actionTaken: 'nudge_back' } : n
      )
    );
    const matchingBuddy = buddies.find(
      (b) =>
        (notif.senderUsername && b.username === notif.senderUsername) ||
        (notif.senderName && b.name === notif.senderName)
    );
    if (matchingBuddy) {
      handleSendNudge(matchingBuddy.id, 'Ra phòng ngay bro, đi tập đê!');
    } else {
      showToast(`⚡ Đã hú lại ${notif.senderName || 'bạn tập'}: "Đi tập đê!"`, 'orange');
    }
  };
  
  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type?: 'orange' | 'cyan' | 'green' } | null>(null);
  const toastTimerRef = React.useRef<number | null>(null);

  const showToast = (message: string, type: 'orange' | 'cyan' | 'green' = 'orange') => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToast({ message, type });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // Synchronize gym, streak, and friends from Firestore profile
  useEffect(() => {
    if (profile) {
      if (profile.gymVenue) setCurrentGym(profile.gymVenue);
      if (profile.streakWeeks) setStreakWeeks(profile.streakWeeks);
      if (profile.friends && profile.friends.length > 0) {
        setBuddies(
          profile.friends.map((friend) => {
            const lastNudge = nudgeCooldowns[friend.id] ?? friend.lastNudgeTime;
            return lastNudge !== undefined ? { ...friend, lastNudgeTime: lastNudge } : { ...friend };
          })
        );
        // Ensure any discoverable friend's posts are also synced into feed posts
        setPosts((prevPosts) => {
          const map = new Map<string, FeedPost>();
          prevPosts.forEach((p) => map.set(p.id, p));
          profile.friends?.forEach((friend) => {
            const found = DISCOVERABLE_GYM_USERS.find((d) => d.buddy.id === friend.id);
            if (found && !map.has(found.post.id)) {
              map.set(found.post.id, found.post);
            }
          });
          return Array.from(map.values());
        });
      }
    }
  }, [profile]);

  // Validate Firebase Firestore connection on boot
  useEffect(() => {
    testConnection();
  }, []);

  // Listen to real-time feed posts and sort in real time (newest first)
  useEffect(() => {
    if (loading) return;
    try {
      const unsubscribe = subscribeToFeedPosts((firestorePosts) => {
        if (firestorePosts.length > 0) {
          setPosts((prev) => {
            const map = new Map<string, FeedPost>();
            firestorePosts.forEach((p) => map.set(p.id, p));
            prev.forEach((p) => {
              if (!map.has(p.id)) map.set(p.id, p);
            });
            return sortPostsByRealTime(Array.from(map.values()));
          });
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Real-time feed listener note:', e);
    }
  }, [loading, user]);

  // Active / Draft Workout Session loaded from Local DB (Isar Cache) for Crash Recovery
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(() =>
    WorkoutDraftCacheService.getDraftSession()
  );

  // Bottom Sheet state when pressing FAB "Tập Ngay"
  const [isWorkoutInitSheetOpen, setIsWorkoutInitSheetOpen] = useState<boolean>(false);

  // Completed Session for Summary Screen
  const [completedSession, setCompletedSession] = useState<WorkoutSession | null>(null);

  // Saved & Forked & Custom Routines ("Lịch tập" in Profile & Bottom Sheet)
  const [savedRoutines, setSavedRoutines] = useState<RoutineModel[]>(() =>
    RoutineForkService.getSavedRoutines()
  );

  // Pressing FAB "Tập Ngay" opens the Workout Session Initialization Bottom Sheet
  const handleStartNewWorkout = () => {
    setIsWorkoutInitSheetOpen(true);
  };

  // Scenario 1: Initialize Workout Session from a Saved/Forked Routine (e.g., "Push Day - Ngực Vai Tay Sau")
  const handleStartWorkoutWithRoutine = (routine: RoutineModel) => {
    const newSession = RoutineForkService.toWorkoutSession(routine, currentGym);
    setActiveSession(newSession);
    setIsWorkoutInitSheetOpen(false);
    setCurrentScreen('logger');
    showToast(
      `🔥 Đã khởi tạo "${routine.title}" trong Isar Local DB · Đồng hồ bắt đầu từ 00:00:00!`,
      'green'
    );
  };

  // Scenario 2: Initialize a Blank Workout Session ("Tạo buổi tập trống")
  const handleStartBlankWorkout = () => {
    const blankSession = WorkoutDraftCacheService.createBlankSession(currentGym);
    setActiveSession(blankSession);
    setIsWorkoutInitSheetOpen(false);
    setCurrentScreen('logger');
    showToast('➕ Đã mở buổi tập trống · Nhấn "➕ Thêm bài tập" để bắt đầu!', 'cyan');
  };

  // Scenario 3: Continue interrupted draft workout from Crash Recovery Snackbar
  const handleResumeDraftSession = (draft?: WorkoutSession) => {
    const targetDraft = draft || activeSession;
    if (!targetDraft) return;
    setActiveSession(targetDraft);
    setIsWorkoutInitSheetOpen(false);
    setCurrentScreen('logger');
    showToast(`⚡ Đã khôi phục buổi tập "${targetDraft.title}" từ Local Cache!`, 'green');
  };

  // Simulate sudden app crash / kill app during an active workout to test Crash Recovery
  const handleSimulateCrash = (currentDraft: WorkoutSession) => {
    WorkoutDraftCacheService.saveDraftSession(currentDraft);
    setActiveSession(currentDraft);
    setCurrentScreen('tabs');
    setActiveTab('feed');
    showToast(
      '⚠️ Đã giả lập đóng ứng dụng đột ngột và mở lại DiTapDe (Phát hiện tệp nháp trong Local Cache)!',
      'orange'
    );
  };

  const handleCreateCustomRoutine = (title: string, exercises: RoutineExerciseModel[]) => {
    const creatorName = profile?.name || user?.displayName || 'Long Aura (PT Pro)';
    const created = RoutineForkService.createCustomRoutine({
      title,
      creatorName,
      exercises,
    });
    setSavedRoutines(RoutineForkService.getSavedRoutines());
    showToast(`✅ Đã tạo lịch tập Custom "${created.title}"!`, 'green');
  };

  const handleDeleteRoutine = (routineId: string) => {
    const next = RoutineForkService.deleteRoutine(routineId);
    setSavedRoutines(next);
    showToast('🗑️ Đã xóa lịch tập khỏi danh sách.', 'orange');
  };

  const handleDapPost = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const nextDapped = !post.isDapped;
          const updatedPost: FeedPost = {
            ...post,
            isDapped: nextDapped,
            dapsCount: nextDapped ? post.dapsCount + 1 : Math.max(0, post.dapsCount - 1),
          };
          if (user) {
            togglePostDap(postId, user.uid, !nextDapped, updatedPost).catch((err) => {
              console.warn('Dap sync notice:', err);
            });
          }
          return updatedPost;
        }
        return post;
      })
    );
    showToast('💪 Đã gửi Dap bắp tay tiếp lửa!', 'orange');
  };

  const handleForkRoutineFromPost = (post: FeedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, forkCount: p.forkCount + 1 } : p))
    );
    RoutineForkService.forkFromFeedPost(post);
    setSavedRoutines(RoutineForkService.getSavedRoutines());
    showToast(`🍴 Đã lưu lịch tập "${post.title}" vào mục Lịch tập (Cá nhân)!`, 'cyan');
  };

  const handleForkRoutineFromDiscover = (routine: RoutineTemplate) => {
    RoutineForkService.forkFromRoutineTemplate(routine);
    setSavedRoutines(RoutineForkService.getSavedRoutines());
    showToast(`🍴 Đã lưu "${routine.title}" vào mục Lịch tập (Cá nhân)!`, 'cyan');
  };

  const handleSendNudge = (buddyId: string, message: string): boolean => {
    const now = Date.now();
    const targetBuddy = buddies.find((b) => b.id === buddyId);
    const buddyName = targetBuddy?.name || 'bạn tập';
    const lastNudgeTime = nudgeCooldowns[buddyId] || targetBuddy?.lastNudgeTime || 0;
    const elapsed = now - lastNudgeTime;

    if (lastNudgeTime > 0 && elapsed < NUDGE_COOLDOWN_MS) {
      const remainingMs = NUDGE_COOLDOWN_MS - elapsed;
      const remainingMinutes = Math.floor(remainingMs / 60000);
      const remainingSeconds = Math.ceil((remainingMs % 60000) / 1000);
      const formattedRemaining =
        remainingMinutes > 0
          ? `${remainingMinutes} phút ${remainingSeconds} giây`
          : `${remainingSeconds} giây`;

      showToast(
        `⏳ Đang trong thời gian chờ! Vui lòng đợi ${formattedRemaining} nữa để hú ${buddyName} tiếp.`,
        'orange'
      );
      return false;
    }

    const updatedCooldowns = { ...nudgeCooldowns, [buddyId]: now };
    setNudgeCooldowns(updatedCooldowns);
    try {
      localStorage.setItem('ditapde_nudge_cooldowns', JSON.stringify(updatedCooldowns));
    } catch {
      // Ignore storage quota issues
    }

    const updatedBuddies = buddies.map((b) =>
      b.id === buddyId ? { ...b, canNudge: false, lastNudgeTime: now } : b
    );
    setBuddies(updatedBuddies);

    if (user) {
      syncFriendsToFirestore(user.uid, updatedBuddies).catch((err) => {
        console.warn('Firestore nudge sync note:', err);
      });
      createNudgeLogInFirestore({
        senderId: user.uid,
        senderName: profile?.name || user.displayName || 'Cạ tập Đi Tập Đê',
        recipientId: buddyId,
        message: message || 'Đi tập đê!',
      }).catch((err) => {
        console.warn('Firestore nudge log trigger note:', err);
      });
    }

    showToast(
      `⚡ Đã bắn thông báo "${message || 'Đi tập đê!'}" cho ${buddyName}!`,
      'orange'
    );
    return true;
  };

  const handleAddFriend = async (
    inputOrBuddy: string | GymBuddy
  ): Promise<{ success: boolean; message: string; buddy?: GymBuddy }> => {
    let targetBuddy: GymBuddy | null = null;
    let targetPost: FeedPost | null = null;

    if (typeof inputOrBuddy !== 'string') {
      targetBuddy = inputOrBuddy;
      const foundDiscoverable = DISCOVERABLE_GYM_USERS.find(
        (d) => d.buddy.id === inputOrBuddy.id
      );
      if (foundDiscoverable) {
        targetPost = foundDiscoverable.post;
      }
    } else {
      const q = inputOrBuddy.trim().toLowerCase();
      const qHandle = q.startsWith('@') ? q : `@${q}`;

      // 1. Check if already in buddies
      const alreadyFriend = buddies.find(
        (b) =>
          b.id.toLowerCase() === q ||
          (b.username && (b.username.toLowerCase() === q || b.username.toLowerCase() === qHandle)) ||
          (b.email && b.email.toLowerCase() === q) ||
          b.name.toLowerCase() === q
      );

      if (alreadyFriend) {
        return {
          success: false,
          message: `${alreadyFriend.name} (${alreadyFriend.username || alreadyFriend.email}) đã có trong danh sách bạn tập!`,
        };
      }

      // 2. Check discoverable gym athletes pool
      const discoverMatch = DISCOVERABLE_GYM_USERS.find(
        (d) =>
          d.buddy.id.toLowerCase() === q ||
          (d.buddy.username &&
            (d.buddy.username.toLowerCase() === q || d.buddy.username.toLowerCase() === qHandle)) ||
          (d.buddy.email && d.buddy.email.toLowerCase() === q) ||
          d.buddy.name.toLowerCase() === q
      );

      if (discoverMatch) {
        targetBuddy = discoverMatch.buddy;
        targetPost = discoverMatch.post;
      } else {
        // 3. Check Firestore /users if authenticated
        if (user) {
          try {
            const firestoreBuddy = await findUserByUsernameOrEmail(inputOrBuddy);
            if (firestoreBuddy) {
              targetBuddy = firestoreBuddy;
              const generated = createBuddyAndPostFromQuery(
                firestoreBuddy.username || firestoreBuddy.name
              );
              targetPost = {
                ...generated.post,
                id: `post-${firestoreBuddy.id}`,
                userId: firestoreBuddy.id,
                userName: firestoreBuddy.name,
                userAvatar: firestoreBuddy.avatar,
                userGym: firestoreBuddy.gymLocation,
              };
            }
          } catch (err) {
            console.warn('Firestore user lookup note:', err);
          }
        }

        // 4. Create friend profile & initial workout post from username or Gmail
        if (!targetBuddy) {
          const created = createBuddyAndPostFromQuery(inputOrBuddy);
          targetBuddy = created.buddy;
          targetPost = created.post;
        }
      }
    }

    if (!targetBuddy) {
      return { success: false, message: 'Không tìm thấy thông tin người dùng.' };
    }

    const updatedBuddies = [targetBuddy, ...buddies.filter((b) => b.id !== targetBuddy!.id)];
    setBuddies(updatedBuddies);

    if (targetPost) {
      const nowMs = Date.now();
      const stampedTargetPost: FeedPost = {
        ...targetPost,
        createdAt: targetPost.createdAt || new Date(nowMs).toISOString(),
        timestamp:
          !targetPost.timestamp || targetPost.timestamp === 'Vừa xong'
            ? formatRealTimeDisplay(nowMs, nowMs)
            : targetPost.timestamp,
      };
      setPosts((prev) => {
        if (prev.some((p) => p.id === stampedTargetPost.id)) return prev;
        return sortPostsByRealTime([stampedTargetPost, ...prev]);
      });
    }

    if (user) {
      try {
        await syncFriendsToFirestore(user.uid, updatedBuddies);
      } catch (err) {
        console.warn('Firestore friend sync note:', err);
      }
    }

    showToast(`🤝 Đã kết bạn với ${targetBuddy.name} & đồng bộ lên Bảng Tin!`, 'green');
    return {
      success: true,
      message: `Đã thêm ${targetBuddy.name} (${targetBuddy.username || targetBuddy.email})! Bạn có thể thấy họ ở Trang Chính, Hú đi tập và xem bài đăng ngay.`,
      buddy: targetBuddy,
    };
  };

  const handleRemoveFriend = async (buddyId: string) => {
    const removed = buddies.find((b) => b.id === buddyId);
    const updatedBuddies = buddies.filter((b) => b.id !== buddyId);
    setBuddies(updatedBuddies);
    if (removed) {
      showToast(`👋 Đã xóa ${removed.name} khỏi danh sách bạn tập.`, 'orange');
    }
    if (user) {
      try {
        await syncFriendsToFirestore(user.uid, updatedBuddies);
      } catch (err) {
        console.warn('Firestore friend remove sync note:', err);
      }
    }
  };

  const handleDeletePost = async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    showToast('🗑️ Đã xóa bài viết thành công!', 'orange');
    if (user) {
      try {
        await deletePostFromFirestore(postId, user.uid);
      } catch (e) {
        console.warn('Error deleting post:', e);
      }
    }
  };

  const handleEditPost = async (postId: string, newTitle: string, newCaption: string) => {
    let targetPost: FeedPost | undefined;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          targetPost = { ...p, title: newTitle, caption: newCaption };
          return targetPost;
        }
        return p;
      })
    );
    showToast('✅ Đã cập nhật bài viết thành công!', 'green');
    if (user) {
      try {
        await updatePostInFirestore(postId, { title: newTitle, caption: newCaption }, targetPost);
      } catch (e) {
        console.warn('Error updating post:', e);
      }
    }
  };

  const handleUpdatePostMedia = async (
    postId: string,
    mediaType: 'image' | 'video',
    mediaUrl: string,
    persistInCloud = false
  ) => {
    let updatedMediaObj: FeedPost['media'] | undefined;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          updatedMediaObj = {
            type: mediaType,
            url: mediaUrl,
            telemetryData: TelemetryParser.extractPostTelemetryOverlay(p),
          };
          return {
            ...p,
            media: updatedMediaObj,
          };
        }
        return p;
      })
    );

    showToast(
      mediaType === 'video'
        ? '🎬 Đã tải Video lên mục Media thành công!'
        : '📸 Đã tải Hình ảnh lên mục Media thành công!',
      'green'
    );

    if (user && persistInCloud && updatedMediaObj) {
      try {
        await updatePostInFirestore(postId, { media: updatedMediaObj });
      } catch (e) {
        console.warn('Error syncing media to Firestore:', e);
      }
    }
  };

  const handleAddComment = async (postId: string, commentText: string) => {
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const authorName = profile?.name || user?.displayName || 'Gymer DiTapDe';
    const authorAvatar = customAvatar || profile?.avatar || user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80';
    const newComment: PostComment = {
      id: `comment-${nowMs}-${Math.random().toString(36).substr(2, 4)}`,
      userId: user?.uid,
      userName: authorName,
      userAvatar: authorAvatar,
      timestamp: formatRealTimeDisplay(nowMs, nowMs),
      createdAt: nowIso,
      text: commentText,
    };

    let targetPost: FeedPost | undefined;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          targetPost = p;
          const currentComments = p.comments || [];
          return {
            ...p,
            commentsCount: p.commentsCount + 1,
            comments: [...currentComments, newComment],
          };
        }
        return p;
      })
    );

    showToast('💬 Đã gửi bình luận thành công!', 'cyan');

    if (user) {
      try {
        await addCommentToPost(postId, newComment, targetPost);
      } catch (e) {
        console.warn('Error adding comment:', e);
      }
    }
  };

  const handleFinishWorkout = (finalSession: WorkoutSession) => {
    WorkoutDraftCacheService.updateHistoryFromCompletedSession(finalSession);
    setCompletedSession(finalSession);
    setCurrentScreen('summary');
  };

  const handleDiscardSession = () => {
    WorkoutDraftCacheService.clearDraftSession();
    setActiveSession(null);
    setCurrentScreen('tabs');
    showToast('❌ Đã hủy bỏ buổi tập chưa hoàn thành.', 'orange');
  };

  const handlePublishToFeed = async (newPost: FeedPost) => {
    const nowMs = Date.now();
    const createdAt =
      typeof newPost.createdAt === 'string' && newPost.createdAt
        ? newPost.createdAt
        : new Date(nowMs).toISOString();
    const formattedTime = formatRealTimeDisplay(Date.parse(createdAt) || nowMs, nowMs);

    const enrichedPost: FeedPost = user && profile ? {
      ...newPost,
      userId: user.uid,
      userName: profile.name,
      userAvatar: customAvatar || profile.avatar || user.photoURL || newPost.userAvatar,
      userGym: profile.gymVenue || newPost.userGym,
      createdAt,
      timestamp: formattedTime,
    } : {
      ...newPost,
      userAvatar: customAvatar || newPost.userAvatar,
      createdAt,
      timestamp: formattedTime,
    };

    setPosts((prev) => sortPostsByRealTime([enrichedPost, ...prev.filter((p) => p.id !== enrichedPost.id)]));
    setHasUserLoggedWorkout(true);
    setUserLoggedVolumeTons((prev) => Number((prev + (enrichedPost.totalTonnageKg || 0) / 1000).toFixed(2)));
    WorkoutDraftCacheService.clearDraftSession();
    setActiveSession(null);
    setCompletedSession(null);
    setCurrentScreen('tabs');
    setActiveTab('feed');
    showToast('🎉 Đã đăng buổi tập lên Bảng Tin DiTapDe!', 'green');

    // Sync to Firestore Cloud atomically in a single batch write if authenticated
    if (user) {
      try {
        await publishWorkoutAndPostBatch(user.uid, enrichedPost, completedSession);
      } catch (err) {
        console.warn('Firestore sync note:', err);
      }
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-zinc-950 flex flex-col items-center justify-start text-zinc-100 selection:bg-[#E4483C] selection:text-white box-border overflow-x-hidden">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200 px-4 sm:px-6">
          <div
            className={`px-4 py-2.5 rounded-2xl border font-semibold text-xs tracking-tight flex items-center gap-2 backdrop-blur-xl shadow-xl shadow-black/25 ${
              toast.type === 'cyan'
                ? 'bg-[#3E8EDE]/90 text-white border-white/20'
                : toast.type === 'green'
                ? 'bg-emerald-600/90 text-white border-white/20'
                : 'bg-[#E4483C]/90 text-white border-white/20'
            }`}
          >
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Container: Automatically Responsive Full-Viewport Layout */}
      <div className="w-full h-[100dvh] max-h-[100dvh] overflow-hidden bg-zinc-950 flex flex-col">
        {/* Render View according to currentScreen */}
        {currentScreen === 'logger' && activeSession ? (
          <div className="flex-1 min-h-0 overflow-y-auto scroll-touch">
            <ActiveLoggerScreen
              session={activeSession}
              onUpdateSession={(updated) => {
                setActiveSession(updated);
                WorkoutDraftCacheService.saveDraftSessionAsync(updated);
              }}
              onFinishSession={handleFinishWorkout}
              onCancelSession={() => setCurrentScreen('tabs')}
              onDiscardSession={handleDiscardSession}
              onSimulateCrash={handleSimulateCrash}
              isLandscape={isLandscape}
              isTablet={isTablet}
            />
          </div>
        ) : currentScreen === 'summary' && completedSession ? (
          <div className="flex-1 min-h-0 overflow-y-auto scroll-touch">
            <SummaryScreen
              session={completedSession}
              onPublishToFeed={handlePublishToFeed}
              onBackToLogger={() => setCurrentScreen('logger')}
              isLandscape={isLandscape}
              isTablet={isTablet}
            />
          </div>
        ) : (
          <div className="flex flex-col flex-1 h-full min-h-0 relative">
            {/* Top Header with Gym Chuột Logo & Real Notifications */}
            <Header
              currentGym={currentGym}
              streakWeeks={streakWeeks}
              isPhoneFrame={isPhoneFrame}
              onTogglePhoneFrame={() => setIsPhoneFrame(!isPhoneFrame)}
              orientation={orientation}
              deviceType={deviceType}
              onShowNotification={(msg) => showToast(msg, 'cyan')}
              notifications={notifications}
              onMarkNotificationRead={handleMarkNotificationRead}
              onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
              onAcceptFriendRequest={handleAcceptFriendRequest}
              onDeclineFriendRequest={handleDeclineFriendRequest}
              onReplyDirectMessage={handleReplyDirectMessage}
              onNudgeBack={handleNudgeBack}
              onStartWorkout={handleStartNewWorkout}
            />

            {/* Active Tab Screen */}
            <main
              onScroll={handleMainScroll}
              className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain scroll-touch"
            >
              {activeTab === 'feed' && (
                <FeedScreen
                  posts={posts}
                  buddies={buddies}
                  onDapPost={handleDapPost}
                  onForkRoutine={handleForkRoutineFromPost}
                  onSendNudge={handleSendNudge}
                  onOpenLogger={handleStartNewWorkout}
                  onConnectFriends={() => {
                    setActiveTab('profile');
                    showToast('🤝 Kết nối bạn tập qua Username hoặc Gmail tại trang Cá nhân!', 'cyan');
                  }}
                  onNavigateToDiscover={() => setActiveTab('discover')}
                  hasUserLoggedWorkout={hasUserLoggedWorkout}
                  onDeletePost={handleDeletePost}
                  onEditPost={handleEditPost}
                  onUpdatePostMedia={handleUpdatePostMedia}
                  onAddComment={handleAddComment}
                  currentUserId={user?.uid}
                  currentUserName={profile?.name}
                  currentUserAvatar={customAvatar || profile?.avatar || user?.photoURL || undefined}
                  isLandscape={isLandscape}
                  isTablet={isTablet}
                />
              )}
              {activeTab === 'discover' && (
                <DiscoverScreen
                  onForkRoutine={handleForkRoutineFromDiscover}
                  activeGymCheckIn={activeGymCheckIn}
                  onCheckInGym={(gym) => {
                    setActiveGymCheckIn(gym);
                    if (activeSession) {
                      setActiveSession((prev) => {
                        if (!prev) return null;
                        const next = { ...prev, gymVenue: gym.name };
                        WorkoutDraftCacheService.saveDraftSession(next);
                        return next;
                      });
                    }
                    if (completedSession) {
                      setCompletedSession((prev) =>
                        prev ? { ...prev, gymVenue: gym.name } : null
                      );
                    }
                    showToast(`📍 Đã Check-in tại "${gym.name}"!`, 'orange');
                  }}
                />
              )}
              {activeTab === 'challenges' && (
                <ChallengesScreen
                  hasUserLoggedWorkout={hasUserLoggedWorkout}
                  userLoggedVolumeTons={userLoggedVolumeTons}
                  onStartWorkout={handleStartNewWorkout}
                  onConnectFriends={() => {
                    setActiveTab('profile');
                    showToast('🤝 Kết nối bạn tập để cùng đua top thử thách câu lạc bộ!', 'cyan');
                  }}
                />
              )}
              {activeTab === 'profile' && (
                <ProfileScreen
                  buddies={buddies}
                  onAddFriend={handleAddFriend}
                  onRemoveFriend={handleRemoveFriend}
                  onSendNudge={handleSendNudge}
                  onGoToFeed={() => setActiveTab('feed')}
                  onGoToDiscover={() => setActiveTab('discover')}
                  onOpenLogger={handleStartNewWorkout}
                  activeGymCheckIn={activeGymCheckIn}
                  savedRoutines={savedRoutines}
                  onCreateCustomRoutine={handleCreateCustomRoutine}
                  onDeleteRoutine={handleDeleteRoutine}
                  onStartWorkoutWithRoutine={handleStartWorkoutWithRoutine}
                  customAvatar={customAvatar}
                  onUpdateCustomAvatar={(newAvatar) => {
                    setCustomAvatar(newAvatar);
                    showToast(
                      newAvatar
                        ? '📸 Đã cập nhật ảnh đại diện cá nhân thành công!'
                        : '🔄 Đã khôi phục ảnh đại diện mặc định.',
                      newAvatar ? 'green' : 'cyan'
                    );
                  }}
                />
              )}
              {isBottomReloading && (
                <div className="py-4 flex items-center justify-center gap-2 text-xs font-display font-medium text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Đang làm mới trang...</span>
                </div>
              )}
            </main>

            {/* Scenario 3: Crash Recovery Snackbar when unfinished draft session is detected in Local Cache */}
            <CrashRecoverySnackbar
              draftSession={activeSession}
              onContinue={(draft) => handleResumeDraftSession(draft)}
              onDiscard={handleDiscardSession}
            />

            {/* Persistent Bottom Navigation with FAB "Tập Ngay" */}
            <BottomNav
              activeTab={activeTab}
              onSelectTab={(tab) => setActiveTab(tab)}
              onOpenLogger={handleStartNewWorkout}
              hasActiveSession={Boolean(activeSession)}
              isLandscape={isLandscape}
            />
          </div>
        )}
      </div>

      {/* Workout Session Initialization Bottom Sheet (FAB "Tập Ngay") */}
      <WorkoutInitBottomSheet
        isOpen={isWorkoutInitSheetOpen}
        onClose={() => setIsWorkoutInitSheetOpen(false)}
        savedRoutines={savedRoutines}
        onSelectRoutine={handleStartWorkoutWithRoutine}
        onSelectBlankSession={handleStartBlankWorkout}
        draftSession={activeSession}
        onResumeDraftSession={() => handleResumeDraftSession()}
      />

      {/* Firebase Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        onSuccess={() => showToast('🎉 Đã đồng bộ tài khoản Firebase thành công!', 'green')}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GymChuotAppContent />
    </AuthProvider>
  );
}
