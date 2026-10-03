import React, { useState, useEffect } from 'react';
import {
  Flame,
  MessageSquare,
  GitFork,
  Play,
  Check,
  Zap,
  MapPin,
  Activity,
  MoreHorizontal,
  Pencil,
  Trash2,
  Camera,
  Video,
  Image as ImageIcon,
  Upload,
  Dumbbell,
  BellRing,
  Clock,
} from 'lucide-react';
import { FeedPost, GymBuddy } from '../../types/gym';
import { MuscleHeatmap } from '../common/MuscleHeatmap';
import { EmptyStateView } from '../common/EmptyStateView';
import { FeedEmptyState } from './FeedEmptyState';
import { NudgeModal } from './NudgeModal';
import { CommentModal } from './CommentModal';
import { EditPostModal } from './EditPostModal';
import { processUploadedMediaFile } from '../../utils/mediaUpload';
import {
  formatPostTimestamp,
  sortPostsByRealTime,
} from '../../utils/postTimestamp';

interface FeedScreenProps {
  posts: FeedPost[];
  buddies: GymBuddy[];
  onToggleDap?: (postId: string) => void;
  onDapPost?: (postId: string) => void;
  onForkRoutine: (post: FeedPost) => void;
  onNudgeBuddy?: (buddyId: string, message: string) => boolean | void;
  onSendNudge?: (buddyId: string, message: string) => boolean | void;
  onAddComment?: (postId: string, text: string) => void;
  onEditPost?: (postId: string, newTitle: string, newCaption: string) => void;
  onUpdatePostMedia?: (
    postId: string,
    mediaType: 'image' | 'video',
    mediaUrl: string,
    persistInCloud?: boolean
  ) => void;
  onDeletePost?: (postId: string) => void;
  onNavigateToDiscover?: () => void;
  onConnectFriends?: () => void;
  onStartWorkout?: () => void;
  onOpenLogger?: () => void;
  hasUserLoggedWorkout?: boolean;
  currentUser?: {
    uid?: string;
    name?: string;
    avatar?: string;
  };
  currentUserId?: string;
  currentUserName?: string;
  currentUserAvatar?: string;
  isLandscape?: boolean;
  isTablet?: boolean;
}

export const FeedScreen: React.FC<FeedScreenProps> = ({
  posts,
  buddies,
  onToggleDap,
  onDapPost,
  onForkRoutine,
  onNudgeBuddy,
  onSendNudge,
  onAddComment,
  onEditPost,
  onUpdatePostMedia,
  onDeletePost,
  onNavigateToDiscover,
  onConnectFriends,
  onStartWorkout,
  onOpenLogger,
  hasUserLoggedWorkout,
  currentUser,
  currentUserId,
  currentUserName,
  currentUserAvatar,
}) => {
  const triggerDap = onToggleDap || onDapPost || (() => {});
  const triggerNudge = onNudgeBuddy || onSendNudge || (() => true);
  const triggerStartWorkout = onStartWorkout || onOpenLogger || (() => {});
  const triggerConnectFriends = onConnectFriends || onNavigateToDiscover || (() => {});
  const effectiveUser = currentUser || {
    uid: currentUserId,
    name: currentUserName,
    avatar: currentUserAvatar,
  };
  const [selectedBuddyForNudge, setSelectedBuddyForNudge] = useState<GymBuddy | null>(null);
  const [forkedPostIds, setForkedPostIds] = useState<string[]>([]);
  const [activeCardTab, setActiveCardTab] = useState<Record<string, 'heatmap' | 'telemetry'>>({});
  const [activeFilter, setActiveFilter] = useState<'all' | 'friends' | 'mine'>('all');

  const [commentModalPost, setCommentModalPost] = useState<FeedPost | null>(null);
  const [editModalPost, setEditModalPost] = useState<FeedPost | null>(null);
  const [menuOpenPostId, setMenuOpenPostId] = useState<string | null>(null);
  const [animatingDapPostId, setAnimatingDapPostId] = useState<string | null>(null);
  const [localMediaMap, setLocalMediaMap] = useState<
    Record<string, { type: 'image' | 'video'; url: string; fileName: string; fileSizeLabel: string }>
  >({});
  const [uploadingPostId, setUploadingPostId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(timer);
  }, []);

  const handleMediaFileChange = async (
    post: FeedPost,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPostId(post.id);
    setActiveCardTab((prev) => ({ ...prev, [post.id]: 'telemetry' }));

    try {
      const processed = await processUploadedMediaFile(file);
      setLocalMediaMap((prev) => ({
        ...prev,
        [post.id]: {
          type: processed.type,
          url: processed.url,
          fileName: processed.fileName,
          fileSizeLabel: processed.fileSizeLabel,
        },
      }));
      if (onUpdatePostMedia) {
        onUpdatePostMedia(
          post.id,
          processed.type,
          processed.url,
          processed.isPersistableInCloud
        );
      }
    } finally {
      setUploadingPostId(null);
      e.target.value = '';
    }
  };

  const NUDGE_COOLDOWN_MS = 30 * 60 * 1000;

  const isBuddyOnCooldown = (buddy: GymBuddy) => {
    if (!buddy.lastNudgeTime) return false;
    return Date.now() - buddy.lastNudgeTime < NUDGE_COOLDOWN_MS;
  };

  const getRemainingCooldownMinutes = (buddy: GymBuddy) => {
    if (!buddy.lastNudgeTime) return 30;
    const elapsed = Date.now() - buddy.lastNudgeTime;
    return Math.max(1, Math.ceil((NUDGE_COOLDOWN_MS - elapsed) / 60000));
  };

  const handleBuddyNudgeClick = (buddy: GymBuddy) => {
    if (isBuddyOnCooldown(buddy)) {
      triggerNudge(buddy.id, '');
      return;
    }
    setSelectedBuddyForNudge(buddy);
  };

  const handleFork = (post: FeedPost) => {
    if (!forkedPostIds.includes(post.id)) {
      setForkedPostIds((prev) => [...prev, post.id]);
    }
    onForkRoutine(post);
  };

  const handleDapClick = (postId: string) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(12);
      } catch {
        // Ignore vibration permission restrictions
      }
    }
    setAnimatingDapPostId(null);
    requestAnimationFrame(() => {
      setAnimatingDapPostId(postId);
    });
    triggerDap(postId);
    setTimeout(() => {
      setAnimatingDapPostId((prev) => (prev === postId ? null : prev));
    }, 360);
  };

  const toggleCardTab = (postId: string, tab: 'heatmap' | 'telemetry') => {
    setActiveCardTab((prev) => ({ ...prev, [postId]: tab }));
  };

  const sortedPosts = sortPostsByRealTime(posts);

  const myPosts = sortedPosts.filter(
    (p) =>
      (effectiveUser.uid && p.userId === effectiveUser.uid) ||
      (effectiveUser.name && p.userName === effectiveUser.name) ||
      p.id.startsWith('post-live-') ||
      p.id.startsWith('post-session-')
  );

  const hasLoggedData = hasUserLoggedWorkout ?? myPosts.length > 0;

  const filteredPosts =
    activeFilter === 'friends'
      ? sortedPosts.filter((p) => buddies.some((b) => b.name === p.userName))
      : activeFilter === 'mine'
      ? myPosts
      : sortedPosts;

  return (
    <div className="flex flex-col p-6 sm:p-8 gap-6 max-w-3xl mx-auto w-full bg-zinc-950 text-zinc-100">
      {/* 1. Top Gym Buddies "Đi tập đê!" Card */}
      <section className="apple-card p-6 flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="apple-icon-badge-accent">
              <Zap className="w-5 h-5 stroke-[1.75]" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight text-zinc-100 leading-tight">
                Anh em bạn tập · Đi tập đê!
              </h2>
              <p className="text-xs text-zinc-400 mt-1 font-normal">
                {buddies.filter((b) => b.status === 'online_gym').length} đang tập tại phòng
                <span className="mx-1.5 text-zinc-600">·</span>
                {buddies.filter((b) => b.status === 'resting').length} đang nghỉ cần nhắc tập
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-400 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
              Đang tập
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-300 ring-2 ring-zinc-300/20" />
              Giữ chuỗi
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-600 ring-2 ring-zinc-600/20" />
              Cần nhắc
            </span>
          </div>
        </div>

        {buddies.length === 0 ? (
          <EmptyStateView
            type="friends"
            title="Chưa có bạn tập nào"
            description="Kết bạn với các Gymer cùng phòng tập hoặc khu vực để thúc giục nhau giữ lửa."
            ctaText="Kết nối bạn bè"
            onCtaClick={() => triggerConnectFriends()}
            secondaryCtaText="Bắt đầu buổi tập"
            onSecondaryCtaClick={() => triggerStartWorkout()}
          />
        ) : (
          <div className="flex items-stretch gap-3.5 overflow-x-auto pb-1 no-scrollbar">
            {buddies.map((buddy) => {
              const onCooldown = isBuddyOnCooldown(buddy);
              const minsLeft = onCooldown ? getRemainingCooldownMinutes(buddy) : 0;

              const statusMeta =
                buddy.status === 'online_gym'
                  ? {
                      ringClass: 'border-emerald-400/80',
                      badgeBg: 'bg-emerald-500 text-white',
                      icon: <Dumbbell className="w-3 h-3 stroke-[2]" />,
                      label: 'Đang tập tại phòng',
                      labelColor: 'text-emerald-400',
                      ctaLabel: onCooldown ? `Đã gửi · ${minsLeft}p` : 'Gửi cổ vũ',
                      ctaStyle: onCooldown
                        ? 'bg-white/[0.04] text-zinc-500 border-white/5'
                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-white',
                    }
                  : buddy.status === 'streak_active'
                  ? {
                      ringClass: 'border-zinc-400/80',
                      badgeBg: 'bg-zinc-200 text-zinc-950',
                      icon: <Flame className="w-3 h-3 stroke-[2]" />,
                      label: 'Đã tập · Giữ chuỗi',
                      labelColor: 'text-zinc-300',
                      ctaLabel: onCooldown ? `Đã nhắc · ${minsLeft}p` : 'Tiếp lửa',
                      ctaStyle: onCooldown
                        ? 'bg-white/[0.04] text-zinc-500 border-white/5'
                        : 'bg-white/[0.08] text-zinc-200 border-white/10 hover:bg-white/20 hover:text-white',
                    }
                  : {
                      ringClass: 'border-zinc-700',
                      badgeBg: 'bg-zinc-800 text-zinc-200',
                      icon: onCooldown ? (
                        <Clock className="w-3 h-3 stroke-[2]" />
                      ) : (
                        <BellRing className="w-3 h-3 stroke-[2]" />
                      ),
                      label: onCooldown ? `Chờ ${minsLeft} phút` : 'Đang nghỉ · Chưa tập',
                      labelColor: 'text-zinc-400',
                      ctaLabel: onCooldown ? `Đã nhắc · ${minsLeft}p` : 'Nhắc đi tập',
                      ctaStyle: onCooldown
                        ? 'bg-white/[0.04] text-zinc-500 border-white/5'
                        : 'apple-btn-primary',
                    };

              return (
                <button
                  key={buddy.id}
                  type="button"
                  onClick={() => handleBuddyNudgeClick(buddy)}
                  className="flex flex-col justify-between w-[168px] min-h-[48px] p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/15 transition-all duration-200 ease-out active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-zinc-400 shrink-0 group text-left gap-3 shadow-xs"
                >
                  {/* Top Row: Avatar + Unboxed Streak Counter */}
                  <div className="flex items-start justify-between gap-2 w-full">
                    <div className={`relative p-0.5 rounded-2xl border ${statusMeta.ringClass}`}>
                      <img
                        src={buddy.avatar}
                        alt={buddy.name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-xl object-cover block"
                      />
                      <span
                        title={statusMeta.label}
                        className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-lg flex items-center justify-center border-2 border-zinc-950 shadow-xs ${statusMeta.badgeBg}`}
                      >
                        {statusMeta.icon}
                      </span>
                    </div>

                    <span className="text-xs font-display font-medium tabular-nums text-zinc-400">
                      {buddy.streakWeeks} tuần
                    </span>
                  </div>

                  {/* Middle Row: Full Name + Status */}
                  <div className="flex flex-col gap-0.5 w-full">
                    <span className="text-sm font-semibold text-zinc-100 truncate w-full">
                      {buddy.name}
                    </span>
                    <span className={`text-xs font-normal truncate w-full ${statusMeta.labelColor}`}>
                      {statusMeta.label}
                    </span>
                  </div>

                  {/* Bottom Row: Action Button */}
                  <div
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 font-display tabular-nums ${statusMeta.ctaStyle}`}
                  >
                    {onCooldown ? (
                      <Clock className="w-3.5 h-3.5 stroke-[1.75] shrink-0" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 stroke-[1.75] shrink-0" />
                    )}
                    <span className="truncate">{statusMeta.ctaLabel}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. Personal Empty State Guidance Card when user hasn't logged any workout yet */}
      {!hasLoggedData && activeFilter !== 'mine' && (
        <FeedEmptyState
          variant="no_personal_logs"
          onStartWorkout={() => triggerStartWorkout()}
          onConnectFriends={() => triggerConnectFriends()}
        />
      )}

      {/* 3. Weekly Consistency Banner */}
      <section className="p-6 rounded-3xl apple-card flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="apple-icon-badge-accent">
            <Flame className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-display text-base font-bold tracking-tight text-zinc-100">
              Mục tiêu tuần: 3/4 buổi hoàn thành
            </h3>
            <p className="text-sm text-zinc-400 font-normal">
              Tập thêm 1 buổi trước Chủ nhật để nâng chuỗi lên{' '}
              <strong className="text-zinc-100 font-display font-semibold">7 tuần</strong>
            </p>
          </div>
        </div>
        <div className="hidden sm:flex gap-2 shrink-0">
          {[1, 2, 3, 4].map((day) => (
            <div
              key={day}
              className={`w-2.5 h-8 rounded-full transition-all duration-200 ${
                day <= 3 ? 'bg-[#E4483C] shadow-sm shadow-[#E4483C]/30' : 'bg-white/[0.06] border border-white/10'
              }`}
            />
          ))}
        </div>
      </section>

      {/* 4. Filter Tabs (Apple Segmented Control) */}
      <div className="apple-segmented-control overflow-x-auto no-scrollbar whitespace-nowrap">
        <button
          onClick={() => setActiveFilter('all')}
          className={`min-h-[40px] px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ease-out shrink-0 focus:outline-none active:scale-[0.98] ${
            activeFilter === 'all'
              ? 'bg-white/15 text-white font-semibold shadow-xs border border-white/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
          }`}
        >
          Tất cả hoạt động ({posts.length})
        </button>
        <button
          onClick={() => setActiveFilter('friends')}
          className={`min-h-[40px] px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ease-out flex items-center gap-2 shrink-0 focus:outline-none active:scale-[0.98] ${
            activeFilter === 'friends'
              ? 'bg-white/15 text-white font-semibold shadow-xs border border-white/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
          }`}
        >
          <span>Bạn tập ({buddies.length})</span>
        </button>
        <button
          onClick={() => setActiveFilter('mine')}
          className={`min-h-[40px] px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ease-out flex items-center gap-2 shrink-0 focus:outline-none active:scale-[0.98] ${
            activeFilter === 'mine'
              ? 'bg-white/15 text-white font-semibold shadow-xs border border-white/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
          }`}
        >
          <span>Nhật ký của tôi ({myPosts.length})</span>
        </button>
      </div>

      {/* 5. Social Feed Posts List */}
      <div className="flex flex-col gap-6 w-full">
        {filteredPosts.length === 0 ? (
          <FeedEmptyState
            variant={
              activeFilter === 'friends'
                ? 'no_friends'
                : activeFilter === 'mine'
                ? 'no_personal_logs'
                : 'empty_feed'
            }
            onStartWorkout={() => triggerStartWorkout()}
            onConnectFriends={() => triggerConnectFriends()}
          />
        ) : (
          filteredPosts.map((post) => {
            const isForked = forkedPostIds.includes(post.id);
            const currentTab = activeCardTab[post.id] || 'heatmap';
            const postBuddy = buddies.find((b) => b.name === post.userName);
            const isAnimatingDap = animatingDapPostId === post.id;

            const primaryExerciseObj =
              post.workoutSummary.exercises.find(
                (ex) =>
                  post.media?.telemetryData?.exercise &&
                  ex.name.toLowerCase() === post.media.telemetryData.exercise.toLowerCase()
              ) || post.workoutSummary.exercises[0];

            const topSetRaw =
              primaryExerciseObj?.topSet ||
              post.media?.telemetryData?.weightReps ||
              '120kg × 5 (RPE 9)';
            const rpeMatch = topSetRaw.match(/RPE\s*([\d.]+)/i);
            const rpeVal = rpeMatch
              ? parseFloat(rpeMatch[1])
              : post.media?.telemetryData?.rpe || 9.0;

            const weightRepsMatch = topSetRaw.match(/([+\d.]+)\s*kg\s*[x×]\s*(\d+)/i);
            const formattedWeightReps = weightRepsMatch
              ? `${weightRepsMatch[1]} kg × ${weightRepsMatch[2]} lần`
              : (post.media?.telemetryData?.weightReps || topSetRaw)
                  .replace(/\s*\(RPE[^)]*\)/i, '')
                  .replace(/REPS/i, 'lần')
                  .replace(/\s*x\s*/i, ' × ')
                  .trim();

            const primaryExerciseName =
              primaryExerciseObj?.name ||
              post.media?.telemetryData?.exercise ||
              'Barbell Bench Press';
            const primaryExerciseVolumeKg =
              primaryExerciseObj?.volumeKg || post.totalTonnageKg;

            return (
              <article
                key={post.id}
                className="w-full apple-card-interactive p-6 sm:p-8 flex flex-col gap-6 relative"
              >
                {/* Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1 basis-[180px]">
                    <img
                      src={post.userAvatar}
                      alt={post.userName}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-2xl object-cover border border-white/10 shadow-xs shrink-0"
                    />
                    <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-bold tracking-tight text-base text-zinc-100 truncate">
                          {post.userName}
                        </span>
                        {postBuddy && (
                          <span className="text-xs text-emerald-400 font-medium shrink-0">
                            · Bạn tập
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 overflow-hidden font-normal">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400 stroke-[1.75] shrink-0" />
                        <span className="truncate">{post.userGym}</span>
                        <span aria-hidden="true" className="shrink-0">·</span>
                        <span className="shrink-0 font-display tabular-nums text-zinc-300">
                          {formatPostTimestamp(post)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side Header Actions */}
                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    {postBuddy && (
                      <button
                        type="button"
                        onClick={() => handleBuddyNudgeClick(postBuddy)}
                        className={`min-h-[38px] px-3.5 py-1.5 rounded-2xl text-xs font-medium transition-all duration-200 ease-out flex items-center justify-center gap-1.5 active:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-zinc-400 border whitespace-nowrap shrink-0 ${
                          isBuddyOnCooldown(postBuddy)
                            ? 'bg-white/[0.04] border-white/5 text-zinc-500'
                            : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-400'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 stroke-[1.75] shrink-0" />
                        <span>
                          {isBuddyOnCooldown(postBuddy)
                            ? `${getRemainingCooldownMinutes(postBuddy)}p`
                            : 'Nhắc tập'}
                        </span>
                      </button>
                    )}

                    {/* Three-dot Button */}
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setMenuOpenPostId(menuOpenPostId === post.id ? null : post.id)}
                        className="w-10 h-10 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-400 hover:text-zinc-100 transition-all duration-200 ease-out active:scale-[0.96] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-zinc-400"
                        title="Tùy chọn bài viết"
                        aria-label="Tùy chọn bài viết"
                      >
                        <MoreHorizontal className="w-5 h-5 stroke-[1.75]" />
                      </button>

                      {menuOpenPostId === post.id && (
                        <div
                          className="absolute right-0 mt-2 w-48 rounded-2xl bg-zinc-900/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/40 z-30 overflow-hidden p-1.5 flex flex-col gap-1"
                          onMouseLeave={() => setMenuOpenPostId(null)}
                        >
                          <button
                            onClick={() => {
                              setMenuOpenPostId(null);
                              setEditModalPost(post);
                            }}
                            className="w-full min-h-[40px] px-3 py-2 text-left text-xs font-medium text-zinc-100 hover:bg-white/[0.08] rounded-xl flex items-center gap-2.5 transition-all duration-200 active:scale-[0.98]"
                          >
                            <Pencil className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
                            <span>Chỉnh sửa bài viết</span>
                          </button>
                          <button
                            onClick={() => {
                              setMenuOpenPostId(null);
                              if (onDeletePost) {
                                onDeletePost(post.id);
                              }
                            }}
                            className="w-full min-h-[40px] px-3 py-2 text-left text-xs font-medium text-rose-400 hover:bg-rose-500/15 rounded-xl flex items-center gap-2.5 transition-all duration-200 active:scale-[0.98]"
                          >
                            <Trash2 className="w-4 h-4 text-rose-400 stroke-[1.75]" />
                            <span>Xóa bài viết</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Title, PR Callout & Caption */}
                <div className="flex flex-col gap-2 items-start">
                  {post.prHighlight && (
                    <span className="text-xs font-display font-semibold text-emerald-400 tracking-tight">
                      {post.prHighlight}
                    </span>
                  )}
                  <h4 className="font-display text-lg font-bold tracking-tight text-zinc-100 leading-snug">
                    {post.title}
                  </h4>
                  <p className="text-sm font-normal text-zinc-400 leading-relaxed">
                    {post.caption}
                  </p>
                </div>

                {/* Stats Matrix Bar */}
                <div className="grid grid-cols-3 gap-4 py-4 border-y border-white/[0.08] text-left">
                  <div className="min-w-0 flex flex-col gap-1">
                    <span className="text-xs text-zinc-400 block truncate">
                      Tổng tải
                    </span>
                    <span className="font-display tabular-nums text-base font-bold text-emerald-400 block whitespace-nowrap truncate">
                      {post.totalTonnageKg.toLocaleString()} kg
                    </span>
                  </div>
                  <div className="min-w-0 flex flex-col gap-1 border-l border-white/[0.08] pl-4">
                    <span className="text-xs text-zinc-400 block truncate">
                      Hiệp tập
                    </span>
                    <span className="font-display tabular-nums text-base font-bold text-zinc-100 block whitespace-nowrap truncate">
                      {post.totalSets} hiệp
                    </span>
                  </div>
                  <div className="min-w-0 flex flex-col gap-1 border-l border-white/[0.08] pl-4">
                    <span className="text-xs text-zinc-400 block truncate">
                      Thời lượng
                    </span>
                    <span className="font-display tabular-nums text-base font-bold text-zinc-100 block whitespace-nowrap truncate">
                      {post.durationMinutes} phút
                    </span>
                  </div>
                </div>

                {/* Interactive Media Tabs (Heatmap vs Media) */}
                <div className="flex flex-col gap-4 w-full">
                  <div className="apple-segmented-control w-full">
                    <button
                      type="button"
                      onClick={() => toggleCardTab(post.id, 'heatmap')}
                      className={`flex-1 min-w-0 min-h-[38px] py-1.5 px-4 rounded-xl text-xs font-medium inline-flex items-center justify-center gap-2 transition-all duration-200 ease-out focus:outline-none active:scale-[0.98] ${
                        currentTab === 'heatmap'
                          ? 'bg-white/15 text-white font-semibold shadow-xs border border-white/10'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                      }`}
                    >
                      <Activity className="w-4 h-4 text-emerald-400 stroke-[1.75] shrink-0" />
                      <span className="truncate">Bản đồ cơ bắp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCardTab(post.id, 'telemetry')}
                      className={`flex-1 min-w-0 min-h-[38px] py-1.5 px-4 rounded-xl text-xs font-medium inline-flex items-center justify-center gap-2 transition-all duration-200 ease-out focus:outline-none active:scale-[0.98] ${
                        currentTab === 'telemetry'
                          ? 'bg-white/15 text-white font-semibold shadow-xs border border-white/10'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                      }`}
                    >
                      <Play className="w-4 h-4 text-emerald-400 stroke-[1.75] shrink-0" />
                      <span className="truncate">Media</span>
                    </button>
                  </div>

                  <div>
                    {currentTab === 'heatmap' ? (
                      <div className="flex flex-col gap-4">
                        <MuscleHeatmap volumeMap={post.workoutSummary.muscleVolumeMap} />
                        <div className="max-h-28 overflow-y-auto scroll-touch rounded-2xl bg-white/[0.03] border border-white/[0.06] p-3 flex flex-col gap-2 text-xs text-zinc-400">
                          {post.workoutSummary.exercises.map((ex, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-3 py-1 border-b border-white/[0.04] last:border-b-0 last:pb-0 first:pt-0"
                            >
                              <span className="text-zinc-300 font-medium truncate">
                                <span className="text-zinc-500 font-display tabular-nums mr-1.5">
                                  {idx + 1}.
                                </span>
                                {ex.name}
                              </span>
                              <strong className="text-zinc-100 font-display tabular-nums font-semibold shrink-0">
                                {ex.topSet}
                              </strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="rounded-2xl overflow-hidden bg-black/40 border border-white/10 flex flex-col">
                          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10">
                            <div className="flex items-center gap-2 min-w-0">
                              {(localMediaMap[post.id]?.type || post.media?.type) === 'video' ? (
                                <Video className="w-4 h-4 text-emerald-400 stroke-[1.75] shrink-0" />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-emerald-400 stroke-[1.75] shrink-0" />
                              )}
                              <span className="text-xs font-medium text-zinc-100 truncate">
                                {localMediaMap[post.id]
                                  ? `${localMediaMap[post.id].type === 'video' ? 'Video' : 'Ảnh'} đã tải (${localMediaMap[post.id].fileSizeLabel})`
                                  : 'Thông số trực tiếp'}
                              </span>
                            </div>
                            <span className="text-xs font-display font-semibold tabular-nums text-emerald-400 shrink-0">
                              RPE {rpeVal}
                            </span>
                          </div>

                          <div className="relative w-full aspect-video max-h-[280px] bg-black/60 overflow-hidden flex items-center justify-center">
                            {(localMediaMap[post.id]?.type || post.media?.type) === 'video' ? (
                              <video
                                key={localMediaMap[post.id]?.url || post.media?.url}
                                src={localMediaMap[post.id]?.url || post.media?.url}
                                controls
                                playsInline
                                preload="metadata"
                                className="w-full h-full object-contain bg-black"
                              />
                            ) : (
                              <>
                                <img
                                  src={
                                    localMediaMap[post.id]?.url ||
                                    post.media?.url ||
                                    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80'
                                  }
                                  alt={post.title}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                                {!localMediaMap[post.id] && (
                                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent pointer-events-none" />
                                )}
                              </>
                            )}
                          </div>

                          <div className="bg-black/30 p-4 border-t border-white/10 flex flex-col gap-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                  <span className="text-emerald-400 font-medium">
                                    Hiệp đỉnh nhất
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-display tabular-nums">
                                    Tải bài: {primaryExerciseVolumeKg.toLocaleString()} kg
                                  </span>
                                </div>
                                <span className="font-display font-bold tracking-tight text-sm text-zinc-100 truncate">
                                  {primaryExerciseName}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 text-xs font-display tabular-nums">
                                <span className="font-bold text-zinc-100">
                                  {formattedWeightReps}
                                </span>
                                <span aria-hidden="true" className="text-zinc-600">·</span>
                                <span className="font-semibold text-emerald-400">
                                  RPE {rpeVal}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Mobile Camera & Photo/Video Library Upload Section */}
                        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-zinc-100 flex items-center gap-2">
                              <Upload className="w-4 h-4 text-emerald-400 stroke-[1.75] shrink-0" />
                              <span>Tải lên Video / Ảnh buổi tập</span>
                            </span>
                            {uploadingPostId === post.id && (
                              <span className="text-xs font-medium text-emerald-400">
                                Đang xử lý...
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2.5">
                            <label className="apple-btn-secondary min-h-[40px] px-3 py-2 text-xs font-medium cursor-pointer select-none text-center gap-2">
                              <Video className="w-4 h-4 text-emerald-400 stroke-[1.75] shrink-0" />
                              <span className="truncate">Quay video</span>
                              <input
                                type="file"
                                accept="video/*"
                                capture="environment"
                                onChange={(e) => handleMediaFileChange(post, e)}
                                className="hidden"
                              />
                            </label>

                            <label className="apple-btn-secondary min-h-[40px] px-3 py-2 text-xs font-medium cursor-pointer select-none text-center gap-2">
                              <Camera className="w-4 h-4 text-zinc-400 stroke-[1.75] shrink-0" />
                              <span className="truncate">Chụp ảnh</span>
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={(e) => handleMediaFileChange(post, e)}
                                className="hidden"
                              />
                            </label>

                            <label className="apple-btn-secondary min-h-[40px] px-3 py-2 text-xs font-medium cursor-pointer select-none text-center gap-2">
                              <ImageIcon className="w-4 h-4 text-zinc-400 stroke-[1.75] shrink-0" />
                              <span className="truncate">Thư viện</span>
                              <input
                                type="file"
                                accept="image/*,video/*"
                                onChange={(e) => handleMediaFileChange(post, e)}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Compact Comment Preview Trigger */}
                {post.comments && post.comments.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCommentModalPost(post)}
                    className="w-full min-h-[44px] px-4 py-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-zinc-400 flex items-center justify-between gap-4 text-left active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <MessageSquare className="w-4 h-4 text-emerald-400 stroke-[1.75] shrink-0" />
                      <span className="font-display font-semibold text-xs text-zinc-100 shrink-0">
                        {post.comments[post.comments.length - 1].userName}:
                      </span>
                      <span className="text-xs text-zinc-400 truncate font-normal">
                        {post.comments[post.comments.length - 1].text}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-emerald-400 shrink-0">
                      Xem tất cả ({post.commentsCount})
                    </span>
                  </button>
                )}

                {/* Card Footer Actions */}
                <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2 sm:gap-3 w-full">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Daps Button (Apple HIG pill with subtle glow & active state) */}
                    <button
                      type="button"
                      onClick={() => handleDapClick(post.id)}
                      className={`relative h-10 px-3.5 py-1.5 rounded-2xl border transition-all duration-200 ease-out active:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-zinc-400 inline-flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap select-none shadow-xs ${
                        post.isDapped
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-500/10'
                          : 'backdrop-blur-md bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-zinc-100'
                      } ${isAnimatingDap ? 'animate-dap-haptic ring-2 ring-emerald-400/40' : ''}`}
                    >
                      <Flame
                        className={`w-4 h-4 stroke-[1.75] shrink-0 transition-transform duration-200 ${
                          post.isDapped ? 'fill-emerald-400/30' : ''
                        } ${isAnimatingDap ? 'animate-dap-icon text-emerald-400' : ''}`}
                      />
                      <span
                        className={`text-xs font-display font-semibold tabular-nums transition-transform duration-200 ${
                          isAnimatingDap ? 'scale-105' : ''
                        }`}
                      >
                        {post.dapsCount} Daps
                      </span>
                    </button>

                    {/* Comment Button (Apple Secondary Glass) */}
                    <button
                      type="button"
                      onClick={() => setCommentModalPost(post)}
                      className="apple-btn-secondary h-10 px-3.5 py-1.5 rounded-2xl text-xs font-medium inline-flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap active:scale-[0.96]"
                      title="Mở bình luận"
                    >
                      <MessageSquare className="w-4 h-4 text-zinc-400 stroke-[1.75] shrink-0" />
                      <span className="font-display tabular-nums font-semibold">{post.commentsCount}</span>
                    </button>
                  </div>

                  {/* Routine Fork Button ("Xin lịch") */}
                  <button
                    type="button"
                    onClick={() => handleFork(post)}
                    className={`h-10 px-4 py-1.5 rounded-2xl text-xs font-semibold border transition-all duration-200 ease-out active:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-zinc-400 inline-flex items-center justify-center gap-1.5 w-auto max-w-fit shrink-0 whitespace-nowrap ml-auto shadow-xs ${
                      isForked
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'backdrop-blur-md bg-white/[0.06] text-zinc-100 hover:bg-white/[0.12] border-white/10'
                    }`}
                  >
                    {isForked ? (
                      <Check className="w-4 h-4 stroke-[2] shrink-0" />
                    ) : (
                      <GitFork className="w-4 h-4 text-emerald-400 stroke-[1.75] shrink-0" />
                    )}
                    <span>{isForked ? 'Đã lưu' : 'Xin lịch'}</span>
                    {!isForked && (
                      <span className="text-[11px] text-zinc-400 font-display tabular-nums">
                        {post.forkCount}
                      </span>
                    )}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Nudge Modal */}
      {selectedBuddyForNudge && (
        <NudgeModal
          buddy={selectedBuddyForNudge}
          onClose={() => setSelectedBuddyForNudge(null)}
          onSendNudge={triggerNudge}
        />
      )}

      {/* Comment Modal */}
      {commentModalPost && (
        <CommentModal
          post={posts.find((p) => p.id === commentModalPost.id) || commentModalPost}
          onClose={() => setCommentModalPost(null)}
          onAddComment={(postId, text) => {
            if (onAddComment) {
              onAddComment(postId, text);
            }
          }}
          currentUser={effectiveUser}
        />
      )}

      {/* Edit Post Modal */}
      {editModalPost && (
        <EditPostModal
          post={editModalPost}
          onClose={() => setEditModalPost(null)}
          onSave={(postId, newTitle, newCaption) => {
            if (onEditPost) {
              onEditPost(postId, newTitle, newCaption);
            }
          }}
        />
      )}
    </div>
  );
};
