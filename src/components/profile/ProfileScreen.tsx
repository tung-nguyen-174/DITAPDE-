import React, { useState, useMemo } from 'react';
import { 
  Settings, 
  Flame, 
  Trophy, 
  MapPin, 
  CheckCircle2, 
  Calendar, 
  Shield,
  Activity,
  LogIn,
  LogOut,
  Edit3,
  Save,
  X,
  Cloud,
  UserPlus,
  Users,
  Mail,
  AtSign,
  Zap,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { MuscleHeatmap } from '../common/MuscleHeatmap';
import { EmptyStateView } from '../common/EmptyStateView';
import { MuscleGroup, GymBuddy } from '../../types/gym';
import { DISCOVERABLE_GYM_USERS, INITIAL_GYM_BUDDIES } from '../../data/mockData';
import profileAvatarImg from '../../assets/images/regenerated_image_1790319027239.png';
import { useAuth } from '../../firebase/AuthContext';
import { updateUserProfileInDb } from '../../firebase/auth';
import { NudgeModal } from '../feed/NudgeModal';
import { PLATE_CODE_COLORS } from '../../utils/fitnessCalculations';
import { RoutineSection } from './RoutineSection';
import {
  ChangeProfileButton,
  getSavedCustomAvatar,
} from './ChangeProfileButton';
import {
  RoutineForkService,
  RoutineModel,
  RoutineExerciseModel,
} from '../../services/routineForkService';
import {
  GymLocationModel,
} from '../../services/googlePlacesService';
import {
  WorkoutDraftCacheService,
  Manual1RMRecord,
  AIVerifiedPRRecord,
} from '../../services/workoutDraftCacheService';
import {
  KineticPRTrackerModal,
  KineticPRTestResult,
} from './KineticPRTrackerModal';
import { calculateE1RM } from '../../utils/fitnessCalculations';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

interface ProfileScreenProps {
  buddies?: GymBuddy[];
  onAddFriend?: (inputOrBuddy: string | GymBuddy) => Promise<{ success: boolean; message: string; buddy?: GymBuddy }>;
  onRemoveFriend?: (buddyId: string) => void;
  onSendNudge?: (buddyId: string, message: string) => boolean | void;
  onGoToFeed?: () => void;
  onGoToDiscover?: () => void;
  onOpenLogger?: () => void;
  activeGymCheckIn?: GymLocationModel;
  savedRoutines?: RoutineModel[];
  onCreateCustomRoutine?: (title: string, exercises: RoutineExerciseModel[]) => void;
  onDeleteRoutine?: (routineId: string) => void;
  onStartWorkoutWithRoutine?: (routine: RoutineModel) => void;
  customAvatar?: string | null;
  onUpdateCustomAvatar?: (avatarDataUrl: string | null) => void;
}

const NUDGE_COOLDOWN_MS = 30 * 60 * 1000;

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  buddies = INITIAL_GYM_BUDDIES,
  onAddFriend,
  onRemoveFriend,
  onSendNudge,
  onGoToFeed,
  onGoToDiscover,
  onOpenLogger,
  activeGymCheckIn,
  savedRoutines,
  onCreateCustomRoutine,
  onDeleteRoutine,
  onStartWorkoutWithRoutine,
  customAvatar,
  onUpdateCustomAvatar,
}) => {
  const { user, profile, openAuthModal, signOut, refreshProfile } = useAuth();
  const [localCustomAvatar, setLocalCustomAvatar] = useState<string | null>(() =>
    getSavedCustomAvatar()
  );
  const effectiveCustomAvatar =
    customAvatar !== undefined ? customAvatar : localCustomAvatar;

  const handleAvatarChange = async (newAvatarDataUrl: string) => {
    setLocalCustomAvatar(newAvatarDataUrl);
    if (onUpdateCustomAvatar) {
      onUpdateCustomAvatar(newAvatarDataUrl);
    }
    if (user && newAvatarDataUrl.length <= 500) {
      try {
        await updateUserProfileInDb(user.uid, { avatar: newAvatarDataUrl });
        await refreshProfile();
      } catch (err) {
        console.warn('Avatar cloud sync note:', err);
      }
    }
  };

  const handleResetAvatar = () => {
    setLocalCustomAvatar(null);
    if (onUpdateCustomAvatar) {
      onUpdateCustomAvatar(null);
    }
  };
  const [localRoutines, setLocalRoutines] = useState<RoutineModel[]>(() =>
    RoutineForkService.getSavedRoutines()
  );
  const effectiveRoutines = savedRoutines ?? localRoutines;
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editBio, setEditBio] = useState<string>('');
  const [editGym, setEditGym] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [friendInputMode, setFriendInputMode] = useState<'username' | 'gmail'>('username');
  const [friendQuery, setFriendQuery] = useState<string>('');
  const [isAddingFriend, setIsAddingFriend] = useState<boolean>(false);
  const [friendStatusMsg, setFriendStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [selectedBuddyForNudge, setSelectedBuddyForNudge] = useState<GymBuddy | null>(null);

  const handleAddFriendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = friendQuery.trim();
    if (!trimmed) {
      setFriendStatusMsg({
        text: friendInputMode === 'gmail' ? 'Vui lòng nhập địa chỉ Gmail của bạn tập!' : 'Vui lòng nhập tên người dùng của bạn tập!',
        isError: true,
      });
      return;
    }

    if (friendInputMode === 'gmail' && !trimmed.includes('@')) {
      setFriendStatusMsg({
        text: 'Vui lòng nhập đúng định dạng Gmail (ví dụ: duc.power@gmail.com)',
        isError: true,
      });
      return;
    }

    if (!onAddFriend) return;
    setIsAddingFriend(true);
    setFriendStatusMsg(null);
    try {
      const res = await onAddFriend(trimmed);
      setFriendStatusMsg({ text: res.message, isError: !res.success });
      if (res.success) {
        setFriendQuery('');
      }
    } finally {
      setIsAddingFriend(false);
    }
  };

  const handleQuickAddSuggested = async (suggestedBuddy: GymBuddy) => {
    if (!onAddFriend) return;
    setIsAddingFriend(true);
    setFriendStatusMsg(null);
    try {
      const res = await onAddFriend(suggestedBuddy);
      setFriendStatusMsg({ text: res.message, isError: !res.success });
    } finally {
      setIsAddingFriend(false);
    }
  };

  const availableSuggestions = DISCOVERABLE_GYM_USERS.filter(
    (item) => !buddies.some((b) => b.id === item.buddy.id || b.email === item.buddy.email || b.username === item.buddy.username)
  );

  const startEditing = () => {
    setEditName(profile?.name || user?.displayName || 'Gymer Chuột');
    setEditBio(profile?.bio || 'Đi tập đê! Không có lý do nào lớn hơn mục tiêu của bạn.');
    setEditGym(profile?.gymVenue || 'California Fitness Thanh Hóa');
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateUserProfileInDb(user.uid, {
        name: editName.trim() || 'Gymer Chuột',
        bio: editBio.trim(),
        gymVenue: editGym.trim() || 'California Fitness Thanh Hóa',
      });
      await refreshProfile();
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const MONTHLY_MUSCLE_VOLUME: Partial<Record<MuscleGroup, number>> = {
    chest: 14,
    triceps: 10,
    front_delts: 8,
    side_delts: 7,
    lats: 12,
    upper_back: 8,
    lower_back: 6,
    quads: 11,
    hamstrings: 9,
    glutes: 8,
    abs: 6,
    calves: 4,
  };

  const CORE_PR_LIFTS = [
    {
      key: 'bench_press',
      name: 'Bench Press',
      shortLabel: 'Bench Press',
      icon: '🏋️‍♂️',
      color: PLATE_CODE_COLORS.red,
      baselineStartKg: 92.5,
      baselinePrevDate: '12/08/2026',
      baselinePrKg: 112.5,
      baselinePrDate: '19/09/2026',
      keywords: ['bench press', 'barbell bench press', 'dumbbell bench press', 'đẩy ngực ngang'],
    },
    {
      key: 'back_squat',
      name: 'Back Squat',
      shortLabel: 'Back Squat',
      icon: '🦵',
      color: PLATE_CODE_COLORS.blue,
      baselineStartKg: 125,
      baselinePrevDate: '05/08/2026',
      baselinePrKg: 150,
      baselinePrDate: '21/09/2026',
      keywords: ['back squat', 'barbell back squat', 'barbell squat', 'squat', 'gánh tạ'],
    },
    {
      key: 'deadlift',
      name: 'Deadlift',
      shortLabel: 'Deadlift',
      icon: '⚡',
      color: PLATE_CODE_COLORS.yellow,
      baselineStartKg: 150,
      baselinePrevDate: '18/08/2026',
      baselinePrKg: 180,
      baselinePrDate: '24/09/2026',
      keywords: ['deadlift', 'barbell deadlift', 'conventional deadlift', 'sumo deadlift', 'romanian deadlift', 'kéo tạ'],
    },
    {
      key: 'overhead_press',
      name: 'Overhead Press',
      shortLabel: 'Overhead Press',
      icon: '🥇',
      color: PLATE_CODE_COLORS.green,
      baselineStartKg: 55,
      baselinePrevDate: '10/08/2026',
      baselinePrKg: 67.5,
      baselinePrDate: '26/09/2026',
      keywords: ['overhead press', 'overhead barbell press', 'military press', 'shoulder press', 'đẩy vai'],
    },
  ] as const;

  const [manual1RMMap, setManual1RMMap] = useState<Record<string, Manual1RMRecord>>(() =>
    WorkoutDraftCacheService.getManual1RMMap()
  );
  const [aiVerifiedPRMap, setAiVerifiedPRMap] = useState<Record<string, AIVerifiedPRRecord>>(() =>
    WorkoutDraftCacheService.getAIVerifiedPRMap()
  );
  const [activeKineticLiftKey, setActiveKineticLiftKey] = useState<string | null>(null);
  const [selectedLiftKey, setSelectedLiftKey] = useState<string | null>(null);
  const [isEntering1RM, setIsEntering1RM] = useState<boolean>(false);
  const [manualWeightInput, setManualWeightInput] = useState<string>('');

  const handleOpenKineticTracker = (liftKey: string) => {
    setActiveKineticLiftKey(liftKey);
  };

  const handleSaveAIVerifiedPR = (result: KineticPRTestResult) => {
    if (!activeKineticLiftKey) return;
    const updated = WorkoutDraftCacheService.saveAIVerifiedPR(activeKineticLiftKey, result);
    setAiVerifiedPRMap(updated);
    setActiveKineticLiftKey(null);
  };

  const prTrophies = useMemo(() => {
    const syncedCompoundPRs = WorkoutDraftCacheService.getSyncedCompoundPRs();
    const loggedHistory = WorkoutDraftCacheService.getUserLoggedHistory();
    const draftSession = WorkoutDraftCacheService.getDraftSession();

    return CORE_PR_LIFTS.map((lift) => {
      let bestLoggerE1rmKg = 0;
      let bestSetSummary = '';
      let matchedExerciseName = '';

      // 1. Check automatically synced Compound E1RMs from the Logger summary view
      const syncedRecord = syncedCompoundPRs[lift.key];
      if (syncedRecord && syncedRecord.e1rmKg > 0) {
        bestLoggerE1rmKg = syncedRecord.e1rmKg;
        bestSetSummary = `${syncedRecord.heaviestWeightKg}kg × ${syncedRecord.reps}${
          syncedRecord.rpe ? ` @ RPE ${syncedRecord.rpe}` : ''
        }`;
        matchedExerciseName = syncedRecord.matchedExerciseName;
      }

      const checkSet = (weightKg: number, reps: number, rpe: number | undefined, exName: string) => {
        if (weightKg <= 0 || reps <= 0) return;
        const e1rm = calculateE1RM(weightKg, reps, rpe);
        if (e1rm > bestLoggerE1rmKg) {
          bestLoggerE1rmKg = e1rm;
          bestSetSummary = `${weightKg}kg × ${reps}${rpe ? ` @ RPE ${rpe}` : ''}`;
          matchedExerciseName = exName;
        }
      };

      // 2. Check completed Logger sessions history
      Object.entries(loggedHistory).forEach(([exKey, sets]) => {
        const lower = exKey.toLowerCase();
        if (lift.keywords.some((kw) => lower.includes(kw))) {
          sets.forEach((s) => checkSet(s.weight, s.reps, s.rpe, exKey));
        }
      });

      // 3. Check active/draft Logger session for completed sets
      if (draftSession && Array.isArray(draftSession.exercises)) {
        draftSession.exercises.forEach((ex) => {
          const lowerName = `${ex.name} ${ex.vietnameseName || ''}`.toLowerCase();
          if (lift.keywords.some((kw) => lowerName.includes(kw))) {
            ex.sets
              .filter((s) => s.completed && s.weight > 0 && s.reps > 0)
              .forEach((s) => checkSet(s.weight, s.reps, s.rpe, ex.name));
          }
        });
      }

      const aiVerifiedEntry = aiVerifiedPRMap[lift.key];
      const hasAiVerified = Boolean(
        aiVerifiedEntry && (aiVerifiedEntry.e1rmKg > 0 || aiVerifiedEntry.weightKg > 0)
      );
      const aiWeightKg = hasAiVerified
        ? aiVerifiedEntry.e1rmKg > 0
          ? aiVerifiedEntry.e1rmKg
          : aiVerifiedEntry.weightKg
        : 0;

      const manualEntry = manual1RMMap[lift.key];
      const hasLoggerData = bestLoggerE1rmKg > 0;
      const hasManualData = Boolean(manualEntry && manualEntry.weightKg > 0);
      const manualWeightKg = hasManualData ? manualEntry.weightKg : 0;

      let activeWeightKg = 0;
      let typeLabel = 'Chưa có dữ liệu Logger';
      let source: 'ai_verified' | 'logger' | 'manual' | 'none' = 'none';

      if (hasAiVerified && aiWeightKg >= bestLoggerE1rmKg && aiWeightKg >= manualWeightKg) {
        activeWeightKg = aiWeightKg;
        typeLabel = `Đã xác thực AI · ${aiVerifiedEntry.weightKg}kg × ${aiVerifiedEntry.reps}`;
        source = 'ai_verified';
      } else if (hasLoggerData && (!hasManualData || bestLoggerE1rmKg >= manualWeightKg)) {
        activeWeightKg = bestLoggerE1rmKg;
        typeLabel = `1RM ước tính · ${bestSetSummary.split(' @')[0]}`;
        source = 'logger';
      } else if (hasManualData) {
        activeWeightKg = manualWeightKg;
        typeLabel = '1RM tối đa · Đã nhập';
        source = 'manual';
      } else if (hasAiVerified) {
        activeWeightKg = aiWeightKg;
        typeLabel = `Đã xác thực AI · ${aiVerifiedEntry.weightKg}kg × ${aiVerifiedEntry.reps}`;
        source = 'ai_verified';
      }

      const displayWeightValue =
        activeWeightKg > 0
          ? unit === 'lbs'
            ? `${Math.round(activeWeightKg * 2.20462 * 10) / 10} lbs`
            : `${Math.round(activeWeightKg * 10) / 10} kg`
          : '-- kg';

      let aiVerifiedTimestamp = '';
      if (hasAiVerified && aiVerifiedEntry) {
        if (aiVerifiedEntry.verifiedAt) {
          try {
            const d = new Date(aiVerifiedEntry.verifiedAt);
            if (!isNaN(d.getTime())) {
              const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
              const dateStr = d.toLocaleDateString('vi-VN');
              aiVerifiedTimestamp = `${timeStr} · ${dateStr}`;
            }
          } catch {
            aiVerifiedTimestamp = aiVerifiedEntry.updatedAt || '';
          }
        }
        if (!aiVerifiedTimestamp) {
          aiVerifiedTimestamp = aiVerifiedEntry.updatedAt || '';
        }
      }

      const prDate =
        (hasAiVerified && (aiVerifiedEntry.updatedAt || aiVerifiedTimestamp)) ||
        syncedRecord?.updatedAt ||
        manualEntry?.updatedAt ||
        lift.baselinePrDate;

      const currentKgForChart = activeWeightKg > 0 ? activeWeightKg : lift.baselinePrKg;
      const previousKgForChart =
        activeWeightKg > 0
          ? Math.round(Math.min(lift.baselineStartKg, activeWeightKg * 0.88) * 10) / 10
          : lift.baselineStartKg;

      const convertUnit = (valKg: number) =>
        unit === 'lbs'
          ? Math.round(valKg * 2.20462 * 10) / 10
          : Math.round(valKg * 10) / 10;

      return {
        ...lift,
        hasData: activeWeightKg > 0,
        activeWeightKg,
        weight: displayWeightValue,
        type: typeLabel,
        source,
        isAiVerified: hasAiVerified,
        aiVerifiedTimestamp,
        aiVerifiedRecord: aiVerifiedEntry,
        bestSetSummary,
        matchedExerciseName,
        updatedAt:
          (hasAiVerified && aiVerifiedEntry.updatedAt) ||
          syncedRecord?.updatedAt ||
          manualEntry?.updatedAt,
        prDate,
        previousDate: lift.baselinePrevDate,
        previousWeightDisplay: convertUnit(previousKgForChart),
        currentWeightDisplay: convertUnit(currentKgForChart),
        gainDisplay: Math.round((convertUnit(currentKgForChart) - convertUnit(previousKgForChart)) * 10) / 10,
      };
    });
  }, [manual1RMMap, aiVerifiedPRMap, unit]);

  const handleOpen1RMInput = (liftKey: string, currentWeightKg: number) => {
    setSelectedLiftKey(liftKey);
    setIsEntering1RM(true);
    if (currentWeightKg > 0) {
      const val =
        unit === 'lbs'
          ? Math.round(currentWeightKg * 2.20462 * 10) / 10
          : Math.round(currentWeightKg * 10) / 10;
      setManualWeightInput(String(val));
    } else {
      setManualWeightInput('');
    }
  };

  const handleSaveManual1RM = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLiftKey) return;
    const parsed = parseFloat(manualWeightInput);
    if (isNaN(parsed) || parsed <= 0) return;
    const weightInKg = unit === 'lbs' ? parsed / 2.20462 : parsed;
    const updated = WorkoutDraftCacheService.saveManual1RM(selectedLiftKey, weightInKg);
    setManual1RMMap(updated);
    setIsEntering1RM(false);
  };

  const BADGES = [
    { title: 'Chuột Titan 100 tấn', icon: '🦾', date: 'T9/2026' },
    { title: 'Chuỗi 6 tuần đều đặn', icon: '🔥', date: 'Đang giữ' },
    { title: 'Đi tập đê Squad Leader', icon: '⚡', date: 'T8/2026' },
    { title: 'Ngực thép 140 kg', icon: '🏆', date: 'T9/2026' },
  ];

  const PAST_WORKOUTS = [
    {
      date: 'Hôm nay, 18:30',
      title: 'Upper Body Hypertrophy & PR Push Day 🔥',
      volume: '8,450 kg',
      sets: 18,
      duration: '62 phút',
      gym: 'California Fitness Thanh Hóa',
      rpeColor: PLATE_CODE_COLORS.red,
    },
    {
      date: 'Hôm qua, 06:15',
      title: 'Quads & Calves Heavy Squats Session',
      volume: '7,200 kg',
      sets: 16,
      duration: '55 phút',
      gym: 'California Fitness Thanh Hóa',
      rpeColor: PLATE_CODE_COLORS.blue,
    },
    {
      date: '3 ngày trước',
      title: 'Deadlift & Upper Back Blast',
      volume: '9,100 kg',
      sets: 17,
      duration: '68 phút',
      gym: 'Strongman Gym Hà Nội',
      rpeColor: PLATE_CODE_COLORS.red,
    },
  ];

  const currentDisplayName = profile?.name || user?.displayName || 'Long Aura (PT Pro)';
  const currentHandle = profile?.handle || (user ? `@${(user.displayName || user.email?.split('@')[0] || 'lifter').toLowerCase()}` : '@long_powerbuilder');
  const currentGym = profile?.gymVenue || 'California Fitness Thanh Hóa';
  const currentBio = profile?.bio || '"Đi tập đê! Không có lý do nào lớn hơn mục tiêu của bạn."';
  const currentAvatar = effectiveCustomAvatar || profile?.avatar || user?.photoURL || profileAvatarImg;
  const currentStreak = profile?.streakWeeks ?? 6;

  return (
    <div className="flex flex-col px-4 sm:px-6 py-6 gap-6 max-w-3xl mx-auto w-full bg-zinc-950 text-zinc-100">
      {/* 0. Guest Banner if not signed in */}
      {!user && (
        <section className="p-6 rounded-3xl apple-card border border-[#E4483C]/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="apple-icon-badge-accent">
              <Cloud className="w-5 h-5 stroke-[1.75]" />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="font-display text-base font-bold tracking-tight text-zinc-100">
                Chưa đăng nhập tài khoản
              </h4>
              <p className="text-xs text-zinc-400 font-normal">
                Đăng nhập để đồng bộ hồ sơ, kỷ lục PR và lịch sử buổi tập.
              </p>
            </div>
          </div>
          <button
            onClick={openAuthModal}
            className="apple-btn-primary min-h-[44px] px-5 py-2 text-xs sm:text-sm shrink-0 flex items-center gap-2"
          >
            <LogIn className="w-4 h-4 stroke-[1.75]" />
            <span>Đăng nhập</span>
          </button>
        </section>
      )}

      {/* 1. Profile Header & Identity Card */}
      <section className="apple-card p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="font-display text-xs font-semibold text-zinc-400 tracking-tight">
              {currentHandle}
            </span>
            {user && (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                <span aria-hidden="true">·</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
                <span>Đã đồng bộ đám mây</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <button
                onClick={startEditing}
                className="w-10 h-10 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-300 hover:text-white transition-all duration-200 ease-out active:scale-[0.96] flex items-center justify-center"
                title="Sửa hồ sơ"
                aria-label="Sửa hồ sơ"
              >
                <Edit3 className="w-4 h-4 stroke-[1.75]" />
              </button>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-10 h-10 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-300 hover:text-white transition-all duration-200 ease-out active:scale-[0.96] flex items-center justify-center"
              title="Cài đặt & tài khoản"
              aria-label="Cài đặt"
            >
              <Settings className="w-4 h-4 stroke-[1.75]" />
            </button>
          </div>
        </div>

        {/* Profile Edit Mode */}
        {isEditing ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 pb-2">
              <img
                src={currentAvatar}
                alt="Hồ sơ vận động viên"
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#E4483C] shadow-sm shrink-0"
              />
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-zinc-400">Ảnh đại diện cá nhân</span>
                <ChangeProfileButton
                  currentAvatar={currentAvatar}
                  hasCustomAvatar={Boolean(effectiveCustomAvatar)}
                  onAvatarChange={handleAvatarChange}
                  onResetAvatar={handleResetAvatar}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 block font-medium">
                Tên hiển thị
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-2xl px-4 py-2 text-base text-zinc-100 focus:outline-none focus:border-[#E4483C] transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 block font-medium">
                Phòng tập thường trú
              </label>
              <input
                type="text"
                value={editGym}
                onChange={(e) => setEditGym(e.target.value)}
                className="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-2xl px-4 py-2 text-base text-zinc-100 focus:outline-none focus:border-[#E4483C] transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-400 block font-medium">
                Tiểu sử
              </label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={2}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-base text-zinc-100 focus:outline-none focus:border-[#E4483C] transition-colors"
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="apple-btn-secondary min-h-[42px] px-4 py-2 text-xs font-medium"
              >
                <X className="w-4 h-4 stroke-[1.75]" />
                <span>Hủy</span>
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="apple-btn-primary min-h-[42px] px-5 py-2 text-xs font-semibold gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4 stroke-[1.75]" />
                )}
                <span>Lưu hồ sơ</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <img
                src={currentAvatar}
                alt="Hồ sơ vận động viên"
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#E4483C]/70 shadow-sm"
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display font-bold text-lg text-zinc-100 truncate tracking-tight">
                  {currentDisplayName}
                </h2>
                <ChangeProfileButton
                  currentAvatar={currentAvatar}
                  hasCustomAvatar={Boolean(effectiveCustomAvatar)}
                  onAvatarChange={handleAvatarChange}
                  onResetAvatar={handleResetAvatar}
                />
              </div>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#E4483C] stroke-[1.75] shrink-0" />
                <span className="truncate">{currentGym}</span>
              </p>
              <p className="text-sm text-zinc-300 font-normal leading-relaxed">
                {currentBio}
              </p>
            </div>
          </div>
        )}

        {/* Consistency Dashboard */}
        <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-3 sm:gap-4 text-center">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-1.5">
            <span className="text-xs text-zinc-400 block font-medium">
              Chuỗi tập đều đặn
            </span>
            <div className="flex items-center justify-center gap-2">
              <Flame className="w-4 h-4 text-[#E0B93D] fill-[#E0B93D] stroke-[1.75]" />
              <span className="font-display tabular-nums text-base font-bold text-[#E0B93D]">
                {currentStreak} tuần
              </span>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">Thứ hạng: nhóm 5% dẫn đầu</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-1.5">
            <span className="text-xs text-zinc-400 block font-medium">
              Mục tiêu tháng
            </span>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[1.75]" />
              <span className="font-display tabular-nums text-base font-bold text-zinc-100">
                14 / 16 buổi
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-medium">Mục tiêu: 100 tấn</span>
          </div>
        </div>
      </section>

      {/* Settings Panel Drawer if open */}
      {showSettings && (
        <section className="apple-card p-6 flex flex-col gap-5">
          <h3 className="font-display font-bold text-lg text-zinc-100 tracking-tight">
            Tùy chọn & tài khoản
          </h3>
          <div className="flex items-center justify-between gap-4 py-2 border-b border-white/10">
            <span className="text-sm text-zinc-200">Đơn vị trọng lượng</span>
            <div className="apple-segmented-control">
              <button
                onClick={() => setUnit('kg')}
                className={`min-h-[36px] px-4 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 ease-out font-display active:scale-[0.98] ${
                  unit === 'kg'
                    ? 'bg-white/15 text-white border border-white/10 shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                kg
              </button>
              <button
                onClick={() => setUnit('lbs')}
                className={`min-h-[36px] px-4 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 ease-out font-display active:scale-[0.98] ${
                  unit === 'lbs'
                    ? 'bg-white/15 text-white border border-white/10 shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                lbs
              </button>
            </div>
          </div>

          {user ? (
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-zinc-400 block">Tài khoản liên kết:</span>
                  <span className="text-sm text-zinc-100 font-semibold truncate">
                    {user.email || user.displayName}
                  </span>
                </div>
                <span className="text-xs text-emerald-400 font-medium">
                  Đã đồng bộ
                </span>
              </div>
              <button
                onClick={signOut}
                className="w-full min-h-[44px] py-2 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-all duration-200 ease-out active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4 stroke-[1.75]" />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setShowSettings(false);
                openAuthModal();
              }}
              className="apple-btn-primary w-full min-h-[44px] py-2 px-4 text-xs font-semibold gap-2"
            >
              <LogIn className="w-4 h-4 stroke-[1.75]" />
              <span>Đăng nhập / tạo tài khoản</span>
            </button>
          )}
        </section>
      )}

      {/* 1.2. Saved & Custom Workout Routines ("Lịch tập") */}
      <RoutineSection
        routines={effectiveRoutines}
        currentUserName={currentDisplayName}
        onCreateCustomRoutine={(title, exercises) => {
          if (onCreateCustomRoutine) {
            onCreateCustomRoutine(title, exercises);
          } else {
            RoutineForkService.createCustomRoutine({
              title,
              creatorName: currentDisplayName,
              exercises,
            });
            setLocalRoutines(RoutineForkService.getSavedRoutines());
          }
        }}
        onDeleteRoutine={(routineId) => {
          if (onDeleteRoutine) {
            onDeleteRoutine(routineId);
          } else {
            const next = RoutineForkService.deleteRoutine(routineId);
            setLocalRoutines(next);
          }
        }}
        onStartWorkoutWithRoutine={(routine) => {
          if (onStartWorkoutWithRoutine) {
            onStartWorkoutWithRoutine(routine);
          }
        }}
        onGoToFeed={onGoToFeed}
      />

      {/* 1.5. Adding Friends via Username or Gmail & Synced Gym Buddies */}
      <section className="apple-card p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="apple-icon-badge-accent">
              <UserPlus className="w-5 h-5 stroke-[1.75]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="font-display font-bold text-lg text-zinc-100 tracking-tight">
                Kết bạn & bạn tập ({buddies.length})
              </h3>
              <p className="text-xs text-zinc-400 font-normal">
                Đồng bộ trực tiếp với bảng tin chính để nhắc tập
              </p>
            </div>
          </div>
          {onGoToFeed && (
            <button
              type="button"
              onClick={onGoToFeed}
              className="apple-btn-secondary min-h-[40px] px-3.5 py-1.5 text-xs font-semibold gap-1.5 shrink-0"
              title="Xem bạn tập trên bảng tin"
            >
              <span>Bảng tin</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#E4483C] stroke-[1.75]" />
            </button>
          )}
        </div>

        {/* Mode Switcher: Username vs Gmail (Apple Segmented Control) */}
        <div className="apple-segmented-control w-full">
          <button
            type="button"
            onClick={() => {
              setFriendInputMode('username');
              setFriendStatusMsg(null);
            }}
            className={`flex-1 min-h-[38px] py-1.5 px-4 rounded-xl text-xs font-semibold transition-all duration-200 ease-out flex items-center justify-center gap-2 active:scale-[0.98] ${
              friendInputMode === 'username'
                ? 'bg-white/15 text-white shadow-xs border border-white/10'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <AtSign className="w-3.5 h-3.5 stroke-[1.75]" />
            <span>Theo tên người dùng</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFriendInputMode('gmail');
              setFriendStatusMsg(null);
            }}
            className={`flex-1 min-h-[38px] py-1.5 px-4 rounded-xl text-xs font-semibold transition-all duration-200 ease-out flex items-center justify-center gap-2 active:scale-[0.98] ${
              friendInputMode === 'gmail'
                ? 'bg-white/15 text-white shadow-xs border border-white/10'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5 stroke-[1.75]" />
            <span>Theo Gmail</span>
          </button>
        </div>

        {/* Add Friend Input Form */}
        <form onSubmit={handleAddFriendSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <div className="relative flex-1 min-w-0">
            {friendInputMode === 'username' ? (
              <AtSign className="w-4 h-4 text-zinc-400 absolute left-4 top-3.5 stroke-[1.75]" />
            ) : (
              <Mail className="w-4 h-4 text-[#E4483C] absolute left-4 top-3.5 stroke-[1.75]" />
            )}
            <input
              type={friendInputMode === 'gmail' ? 'email' : 'text'}
              value={friendQuery}
              onChange={(e) => setFriendQuery(e.target.value)}
              placeholder={
                friendInputMode === 'username'
                  ? 'Nhập tên người dùng (vd: @duc_power)...'
                  : 'Nhập Gmail (vd: duc.power@gmail.com)...'
              }
              className="w-full min-w-0 min-h-[44px] bg-black/40 border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-base text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#E4483C] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isAddingFriend}
            className="apple-btn-primary min-h-[44px] px-5 py-2 text-xs font-semibold shrink-0 gap-2 disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4 stroke-[1.75] shrink-0" />
            <span>{isAddingFriend ? 'Đang thêm...' : 'Kết bạn'}</span>
          </button>
        </form>

        {/* Feedback Banner */}
        {friendStatusMsg && (
          <div
            className={`px-4 py-2.5 rounded-2xl text-xs font-medium flex items-center justify-between gap-4 ${
              friendStatusMsg.isError
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            <span>{friendStatusMsg.text}</span>
            <button
              type="button"
              onClick={() => setFriendStatusMsg(null)}
              className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-all duration-200 active:scale-[0.96]"
              title="Đóng thông báo"
              aria-label="Đóng thông báo"
            >
              <X className="w-4 h-4 stroke-[1.75]" />
            </button>
          </div>
        )}

        {/* Quick Suggested Athletes to Add */}
        {availableSuggestions.length > 0 && (
          <div className="flex flex-col gap-2.5 pt-2">
            <span className="text-xs text-zinc-400 block font-medium">
              Gợi ý bạn tập cùng hệ thống:
            </span>
            <div className="flex flex-col gap-2.5">
              {availableSuggestions.map(({ buddy }) => (
                <div
                  key={buddy.id}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-wrap sm:flex-nowrap items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1 basis-[180px]">
                    <img
                      src={buddy.avatar}
                      alt={buddy.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-2xl object-cover border border-[#E4483C]/70 shrink-0"
                    />
                    <div className="min-w-0 flex-1 flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display text-sm font-semibold text-zinc-100 truncate tracking-tight">
                          {buddy.name}
                        </span>
                        <span className="text-xs text-[#E4483C] font-medium">
                          {buddy.username}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400 block truncate">
                        {buddy.email} · {buddy.gymLocation}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickAddSuggested(buddy)}
                    disabled={isAddingFriend}
                    className="apple-btn-secondary min-h-[40px] px-4 py-1.5 text-xs font-semibold shrink-0 gap-1.5 ml-auto"
                  >
                    <span>+ Kết bạn</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Synced Friends List */}
        <div className="pt-4 border-t border-white/10 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-2 tracking-tight">
              <Users className="w-4 h-4 text-[#E4483C] stroke-[1.75]" />
              <span>Danh sách bạn tập đã đồng bộ ({buddies.length})</span>
            </span>
          </div>

          <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
            {buddies.length === 0 ? (
              <EmptyStateView
                type="friends"
                title="Chưa có bạn tập nào"
                description="Hãy kết bạn với các Gymer khác để cùng chia sẻ lịch tập, nhắc nhau đi tập và tăng động lực."
                ctaText="Tìm & kết bạn ngay"
                onCtaClick={() => setFriendQuery('duc_power')}
              />
            ) : (
              buddies.map((buddy) => (
                <div
                  key={buddy.id}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-wrap sm:flex-nowrap items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1 basis-[170px]">
                    <div className="relative shrink-0">
                      <img
                        src={buddy.avatar}
                        alt={buddy.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-2xl object-cover border border-[#E4483C]/70 shadow-xs"
                      />
                      <span className="absolute -bottom-1 -right-1 text-[10px] bg-zinc-950/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 font-display font-semibold text-[#E0B93D] tabular-nums">
                        🔥{buddy.streakWeeks}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display text-sm font-semibold text-zinc-100 truncate tracking-tight">
                          {buddy.name}
                        </span>
                        {buddy.username && (
                          <span className="text-xs text-zinc-400">
                            {buddy.username}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-400 block truncate">
                        📍 {buddy.gymLocation}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    {onSendNudge && (() => {
                      const isOnCooldown = Boolean(
                        buddy.lastNudgeTime && Date.now() - buddy.lastNudgeTime < NUDGE_COOLDOWN_MS
                      );
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (isOnCooldown) {
                              onSendNudge(
                                buddy.id,
                                `Ê ${buddy.name}! Đi tập đê, hôm nay không bỏ buổi nào nhé! 🔥`
                              );
                            } else {
                              setSelectedBuddyForNudge(buddy);
                            }
                          }}
                          className={`min-h-[40px] px-4 py-1.5 rounded-2xl text-xs font-semibold transition-all duration-200 ease-out flex items-center gap-2 active:scale-[0.98] ${
                            isOnCooldown
                              ? 'bg-white/[0.04] text-zinc-400 border border-white/10 cursor-not-allowed'
                              : 'apple-btn-accent'
                          }`}
                          title={
                            isOnCooldown
                              ? 'Đang trong thời gian chờ chống spam'
                              : `Nhắc ${buddy.name} đi tập ngay`
                          }
                        >
                          {isOnCooldown ? <span className="text-xs">⏳</span> : <Zap className="w-3.5 h-3.5 stroke-[1.75]" />}
                          <span>{isOnCooldown ? 'Đang chờ' : 'Nhắc tập'}</span>
                        </button>
                      );
                    })()}
                    {onRemoveFriend && (
                      <button
                        type="button"
                        onClick={() => onRemoveFriend(buddy.id)}
                        className="w-10 h-10 rounded-2xl bg-white/[0.04] hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-white/10 transition-all duration-200 ease-out flex items-center justify-center active:scale-[0.96]"
                        title="Xóa bạn tập"
                        aria-label={`Xóa bạn tập ${buddy.name}`}
                      >
                        <Trash2 className="w-4 h-4 stroke-[1.75]" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 2. PR Trophy Case */}
      <section className="apple-card p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="apple-icon-badge-accent">
              <Trophy className="w-5 h-5 stroke-[1.75]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="font-display font-bold text-lg text-zinc-100 tracking-tight">
                Kỷ lục cá nhân (PR)
              </h3>
              <p className="text-xs text-zinc-400 font-normal">
                Đồng bộ từ Logger ({unit.toUpperCase()})
              </p>
            </div>
          </div>
          <span className="text-xs text-zinc-400 font-medium">
            4 bài Compound
          </span>
        </div>

        {/* Recharts Responsive Bar Chart */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="font-display font-semibold text-sm text-zinc-100 tracking-tight">
                Biểu đồ tiến độ mức tạ PR
              </span>
              <span className="text-xs text-zinc-400">
                So sánh kỷ lục trước và PR mới nhất · Di chuột để xem ngày lập PR
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-400 font-medium">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span>Kỷ lục trước</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E4483C]" />
                <span>PR hiện tại</span>
              </span>
            </div>
          </div>

          <div className="w-full h-56 sm:h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={prTrophies}
                margin={{ top: 8, right: 8, left: -16, bottom: 4 }}
                barGap={6}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255, 255, 255, 0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="shortLabel"
                  tick={{ fill: '#A1A1AA', fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#A1A1AA', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  unit={` ${unit}`}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.04)', radius: 8 }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const dataPoint = payload[0]?.payload as (typeof prTrophies)[number] | undefined;
                    if (!dataPoint) return null;

                    return (
                      <div className="rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-4 shadow-2xl flex flex-col gap-2 min-w-[210px]">
                        <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/10">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{dataPoint.icon}</span>
                            <span className="font-display font-bold text-xs text-zinc-100">
                              {dataPoint.name}
                            </span>
                          </div>
                          <span
                            className="text-[11px] font-display font-bold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${dataPoint.color}25`,
                              color: dataPoint.color,
                            }}
                          >
                            +{dataPoint.gainDisplay} {unit}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1.5 text-xs">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-zinc-400">PR hiện tại:</span>
                            <strong
                              className="font-display tabular-nums text-sm"
                              style={{ color: dataPoint.color }}
                            >
                              {dataPoint.currentWeightDisplay} {unit}
                            </strong>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-zinc-400">Ngày lập PR:</span>
                            <span className="font-display tabular-nums text-zinc-100 font-semibold">
                              📅 {dataPoint.prDate}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 pt-1 border-t border-white/10 text-[11px]">
                            <span className="text-zinc-500">
                              Kỷ lục trước ({dataPoint.previousDate}):
                            </span>
                            <span className="font-display tabular-nums text-zinc-400">
                              {dataPoint.previousWeightDisplay} {unit}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="previousWeightDisplay"
                  name="Kỷ lục trước"
                  fill="rgba(255, 255, 255, 0.15)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="currentWeightDisplay"
                  name="PR hiện tại"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={28}
                >
                  {prTrophies.map((entry) => (
                    <Cell key={`cell-${entry.key}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3 sm:gap-4">
          {prTrophies.map((pr) => {
            const isSelected = selectedLiftKey === pr.key;
            return (
              <div
                key={pr.key}
                onClick={() => {
                  if (pr.hasData) {
                    setSelectedLiftKey(isSelected && !isEntering1RM ? null : pr.key);
                    setIsEntering1RM(false);
                  }
                }}
                role={pr.hasData ? 'button' : undefined}
                tabIndex={pr.hasData ? 0 : undefined}
                onKeyDown={(e) => {
                  if (pr.hasData && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    setSelectedLiftKey(isSelected && !isEntering1RM ? null : pr.key);
                    setIsEntering1RM(false);
                  }
                }}
                className={`p-4 sm:p-5 rounded-2xl bg-white/[0.03] border transition-all duration-200 ease-out flex flex-col justify-between gap-3 active:scale-[0.98] ${
                  isSelected
                    ? 'border-[#E4483C] bg-white/[0.06] shadow-sm'
                    : pr.isAiVerified
                    ? 'border-[#00FF88]/40 bg-[#00FF88]/[0.03] hover:border-[#00FF88]/60 hover:bg-[#00FF88]/[0.06] cursor-pointer'
                    : pr.hasData
                    ? 'border-white/[0.08] hover:border-white/20 hover:bg-white/[0.05] cursor-pointer'
                    : 'border-white/[0.06]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-zinc-400 block truncate font-medium">
                        {pr.name}
                      </span>
                      {pr.isAiVerified && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/40 text-[10px] font-bold tracking-tight">
                          <CheckCircle2 className="w-2.5 h-2.5 stroke-[2.5]" />
                          <span>Đã xác thực AI</span>
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-display tabular-nums text-xl sm:text-2xl font-bold block tracking-tight ${
                        pr.hasData
                          ? pr.isAiVerified
                            ? 'text-[#00FF88]'
                            : 'text-zinc-100'
                          : 'text-zinc-500'
                      }`}
                    >
                      {pr.weight}
                    </span>
                    {pr.isAiVerified && pr.aiVerifiedTimestamp ? (
                      <span className="text-[11px] text-zinc-400 font-normal">
                        Cập nhật: {pr.aiVerifiedTimestamp}
                      </span>
                    ) : pr.hasData ? (
                      <span
                        className="text-xs font-semibold block truncate"
                        style={{ color: pr.color }}
                      >
                        {pr.type}
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-500">Chưa có kỷ lục</span>
                    )}
                  </div>
                  <span className="text-2xl shrink-0">{pr.icon}</span>
                </div>

                <div className="flex flex-col gap-2 w-full pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenKineticTracker(pr.key);
                    }}
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#00FF88]/15 hover:bg-[#00FF88]/25 text-[#00FF88] border border-[#00FF88]/30 hover:border-[#00FF88]/50 text-xs sm:text-sm font-bold tracking-wide flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-[0.96] shadow-sm shadow-[#00FF88]/10"
                    title={`Test luôn ${pr.name} bằng camera AI`}
                  >
                    <Zap className="w-4 h-4 fill-[#00FF88]" />
                    <span>Test luôn 🏋️</span>
                  </button>
                  {!pr.hasData && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpen1RMInput(pr.key, 0);
                      }}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 border border-white/10 text-xs font-semibold transition-all duration-200 inline-flex items-center justify-center gap-1 active:scale-[0.96]"
                    >
                      <span>Nhập 1RM tối đa</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Linked PR Detail / Manual 1RM Input Drawer */}
        {selectedLiftKey && (() => {
          const activeLift = prTrophies.find((item) => item.key === selectedLiftKey);
          if (!activeLift) return null;

          return (
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                  <span className="text-lg shrink-0">{activeLift.icon}</span>
                  <span className="font-display font-semibold text-sm text-zinc-100 truncate tracking-tight">
                    {activeLift.name}
                  </span>
                  {activeLift.isAiVerified ? (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 font-bold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                      <span>Đã xác thực AI</span>
                    </span>
                  ) : activeLift.source === 'logger' ? (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                      Logger PR
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLiftKey(null);
                    setIsEntering1RM(false);
                  }}
                  className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-all duration-200 active:scale-[0.96]"
                  title="Đóng chi tiết PR"
                  aria-label="Đóng chi tiết PR"
                >
                  <X className="w-4 h-4 stroke-[1.75]" />
                </button>
              </div>

              {isEntering1RM ? (
                <form onSubmit={handleSaveManual1RM} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="1000"
                      autoFocus
                      value={manualWeightInput}
                      onChange={(e) => setManualWeightInput(e.target.value)}
                      placeholder={`Nhập mức tạ 1RM tối đa (${unit})...`}
                      className="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-2xl px-4 py-2 text-base font-display tabular-nums text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#E4483C] transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="submit"
                      className="apple-btn-primary min-h-[44px] px-5 py-2 text-xs font-semibold gap-1.5"
                    >
                      <Save className="w-4 h-4 stroke-[1.75]" />
                      <span>Lưu 1RM</span>
                    </button>
                    {onOpenLogger && (
                      <button
                        type="button"
                        onClick={onOpenLogger}
                        className="apple-btn-secondary min-h-[44px] px-4 py-2 text-xs font-medium"
                      >
                        Mở Logger
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="text-xs text-zinc-400">
                    {activeLift.isAiVerified && activeLift.aiVerifiedRecord ? (
                      <span>
                        Kỷ lục xác thực qua camera AI: <strong className="text-[#00FF88] font-semibold">{activeLift.aiVerifiedRecord.weightKg}kg × {activeLift.aiVerifiedRecord.reps} reps</strong> (Vận tốc đỉnh: {activeLift.aiVerifiedRecord.peakVelocityMps} m/s · 1RM: {activeLift.weight}{activeLift.aiVerifiedTimestamp ? ` · ${activeLift.aiVerifiedTimestamp}` : ''})
                      </span>
                    ) : activeLift.source === 'logger' ? (
                      <span>
                        Kỷ lục gần nhất từ bài <strong className="text-zinc-100 font-semibold">{activeLift.matchedExerciseName}</strong> ({activeLift.bestSetSummary})
                      </span>
                    ) : (
                      <span>
                        1RM tối đa đã nhập thủ công{activeLift.updatedAt ? ` ngày ${activeLift.updatedAt}` : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleOpenKineticTracker(activeLift.key)}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-[#00FF88]/15 hover:bg-[#00FF88]/25 text-[#00FF88] border border-[#00FF88]/30 hover:border-[#00FF88]/50 text-xs font-bold inline-flex items-center gap-1.5 transition-all duration-200 active:scale-[0.96]"
                    >
                      <Zap className="w-3.5 h-3.5 fill-[#00FF88]" />
                      <span>Test lại bằng AI</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpen1RMInput(activeLift.key, activeLift.activeWeightKg)}
                      className="apple-btn-secondary min-h-[44px] px-4 py-2 text-xs font-semibold"
                    >
                      Nhập 1RM tối đa
                    </button>
                    {onOpenLogger && (
                      <button
                        type="button"
                        onClick={onOpenLogger}
                        className="apple-btn-accent min-h-[44px] px-4 py-2 text-xs font-semibold"
                      >
                        Tập bài này
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Kinetic Pose Tracker Modal */}
        {activeKineticLiftKey && (() => {
          const activeLift =
            prTrophies.find((item) => item.key === activeKineticLiftKey) ||
            CORE_PR_LIFTS.find((item) => item.key === activeKineticLiftKey);
          if (!activeLift) return null;
          const currentPr =
            prTrophies.find((item) => item.key === activeKineticLiftKey)?.activeWeightKg ?? 0;
          return (
            <KineticPRTrackerModal
              liftKey={activeKineticLiftKey}
              liftName={activeLift.name}
              unit={unit}
              currentPrKg={currentPr}
              onClose={() => setActiveKineticLiftKey(null)}
              onSave={handleSaveAIVerifiedPR}
            />
          );
        })()}
      </section>

      {/* 3. Completed Challenge Badges */}
      <section className="apple-card p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="apple-icon-badge-accent">
              <Shield className="w-5 h-5 stroke-[1.75]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="font-display font-bold text-lg text-zinc-100 tracking-tight">
                Huy hiệu đã đạt
              </h3>
              <p className="text-xs text-zinc-400 font-normal">
                Ghi nhận cột mốc tập luyện
              </p>
            </div>
          </div>
          <span className="text-xs text-zinc-400 font-display tabular-nums font-medium">4 huy hiệu</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {BADGES.map((b, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3.5"
            >
              <span className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-xl shrink-0 shadow-xs">
                {b.icon}
              </span>
              <div className="min-w-0 flex flex-col gap-1">
                <span className="font-display text-xs sm:text-sm font-semibold text-zinc-100 block truncate tracking-tight">
                  {b.title}
                </span>
                <span className="text-xs text-zinc-400 block">{b.date}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Monthly Muscle Heatmap Coverage (30 Days) */}
      <section className="apple-card p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="apple-icon-badge-accent">
              <Activity className="w-5 h-5 stroke-[1.75]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="font-display font-bold text-lg text-zinc-100 tracking-tight">
                Bản đồ cơ bắp 30 ngày
              </h3>
              <p className="text-xs text-zinc-400 font-normal">
                Tần suất toàn thân · Khối lượng tập trung mạnh vào ngực và xô
              </p>
            </div>
          </div>
        </div>

        <MuscleHeatmap volumeMap={MONTHLY_MUSCLE_VOLUME} />
      </section>

      {/* 5. Past Workout Activity Log */}
      <section className="apple-card p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="apple-icon-badge-accent">
              <Calendar className="w-5 h-5 stroke-[1.75]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="font-display font-bold text-lg text-zinc-100 tracking-tight">
                Lịch sử buổi tập gần đây
              </h3>
              <p className="text-xs text-zinc-400 font-normal">
                3 buổi tập hoàn thành mới nhất
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {PAST_WORKOUTS.map((w, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-2 hover:bg-white/[0.05] transition-all duration-200 ease-out"
            >
              <div className="flex items-center justify-between gap-4 text-xs text-zinc-400 font-medium">
                <span>{w.date}</span>
                <span className="truncate">{w.gym}</span>
              </div>
              <h5 className="font-display font-semibold text-base text-zinc-100 tracking-tight">
                {w.title}
              </h5>
              <div className="flex items-center gap-2 text-xs font-display tabular-nums">
                <span className="font-semibold" style={{ color: w.rpeColor }}>
                  {w.volume}
                </span>
                <span className="text-zinc-600" aria-hidden="true">·</span>
                <span className="text-zinc-200">{w.sets} hiệp</span>
                <span className="text-zinc-600" aria-hidden="true">·</span>
                <span className="text-zinc-400">{w.duration}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Nudge Modal with Custom Message Support */}
      {selectedBuddyForNudge && onSendNudge && (
        <NudgeModal
          buddy={selectedBuddyForNudge}
          onClose={() => setSelectedBuddyForNudge(null)}
          onSendNudge={(buddyId, message) => {
            const res = onSendNudge(buddyId, message);
            setSelectedBuddyForNudge(null);
            return res;
          }}
        />
      )}
    </div>
  );
};
