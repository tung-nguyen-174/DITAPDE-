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

interface ProfileScreenProps {
  buddies?: GymBuddy[];
  onAddFriend?: (inputOrBuddy: string | GymBuddy) => Promise<{ success: boolean; message: string; buddy?: GymBuddy }>;
  onRemoveFriend?: (buddyId: string) => void;
  onSendNudge?: (buddyId: string, message: string) => boolean | void;
  onGoToFeed?: () => void;
  onGoToDiscover?: () => void;
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

  const PR_TROPHIES = [
    { name: 'Bench Press', weight: '140 kg', type: '1RM ước tính', icon: '🏋️‍♂️', color: PLATE_CODE_COLORS.red },
    { name: 'Back Squat', weight: '180 kg', type: '1RM tối đa', icon: '🦵', color: PLATE_CODE_COLORS.blue },
    { name: 'Deadlift', weight: '220 kg', type: '1RM tối đa', icon: '⚡', color: PLATE_CODE_COLORS.yellow },
    { name: 'Overhead Press', weight: '85 kg', type: '1RM tối đa', icon: '🥇', color: PLATE_CODE_COLORS.green },
  ];

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
    <div className="flex flex-col px-4 sm:px-6 py-6 gap-6 max-w-3xl mx-auto w-full bg-[#17161A]">
      {/* 0. Guest Banner if not signed in */}
      {!user && (
        <section className="p-4 sm:p-6 rounded-[20px] bg-[#1F1E24] border border-[#E4483C] flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-[#28272E] border border-[#35343C] flex items-center justify-center text-[#E4483C] shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="font-display text-[16px] font-semibold text-[#F2F1ED]">
                Chưa đăng nhập tài khoản
              </h4>
              <p className="text-[12px] text-[#9C9AA3]">
                Đăng nhập để đồng bộ hồ sơ, kỷ lục PR và lịch sử buổi tập.
              </p>
            </div>
          </div>
          <button
            onClick={openAuthModal}
            className="min-h-[48px] min-w-[48px] px-4 py-2 rounded-[14px] bg-[#E4483C] hover:bg-[#C23629] active:bg-[#C23629] text-[#F2F1ED] text-[14px] font-semibold transition shrink-0 flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Đăng nhập</span>
          </button>
        </section>
      )}

      {/* 1. Profile Header & Identity Card */}
      <section className="bg-[#1F1E24] rounded-[20px] border border-[#35343C] p-4 sm:p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#35343C]">
          <div className="flex items-center gap-2">
            <span className="font-display text-[13px] font-medium text-[#9C9AA3]">
              {currentHandle}
            </span>
            {user && (
              <span className="text-[12px] text-[#4CAF6D] font-medium flex items-center gap-2">
                <span aria-hidden="true">·</span>
                <span className="w-2 h-2 rounded-[14px] bg-[#4CAF6D]" />
                <span>Đã đồng bộ đám mây</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <button
                onClick={startEditing}
                className="min-w-[48px] min-h-[48px] w-12 h-12 rounded-[14px] text-[#9C9AA3] hover:text-[#F2F1ED] hover:bg-[#28272E] transition flex items-center justify-center"
                title="Sửa hồ sơ"
                aria-label="Sửa hồ sơ"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="min-w-[48px] min-h-[48px] w-12 h-12 rounded-[14px] text-[#9C9AA3] hover:text-[#F2F1ED] hover:bg-[#28272E] transition flex items-center justify-center"
              title="Cài đặt & tài khoản"
              aria-label="Cài đặt"
            >
              <Settings className="w-5 h-5" />
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
                className="w-16 h-16 rounded-[14px] object-cover border-2 border-[#E4483C] shrink-0"
              />
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] text-[#9C9AA3]">Ảnh đại diện cá nhân</span>
                <ChangeProfileButton
                  currentAvatar={currentAvatar}
                  hasCustomAvatar={Boolean(effectiveCustomAvatar)}
                  onAvatarChange={handleAvatarChange}
                  onResetAvatar={handleResetAvatar}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[12px] text-[#9C9AA3] block">
                Tên hiển thị
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full min-h-[48px] bg-[#28272E] border border-[#35343C] rounded-[14px] px-4 py-2 text-[14px] text-[#F2F1ED] focus:outline-hidden focus:border-[#E4483C]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[12px] text-[#9C9AA3] block">
                Phòng tập thường trú
              </label>
              <input
                type="text"
                value={editGym}
                onChange={(e) => setEditGym(e.target.value)}
                className="w-full min-h-[48px] bg-[#28272E] border border-[#35343C] rounded-[14px] px-4 py-2 text-[14px] text-[#F2F1ED] focus:outline-hidden focus:border-[#E4483C]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[12px] text-[#9C9AA3] block">
                Tiểu sử
              </label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={2}
                className="w-full bg-[#28272E] border border-[#35343C] rounded-[14px] p-4 text-[14px] text-[#F2F1ED] focus:outline-hidden focus:border-[#E4483C]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="min-h-[48px] min-w-[48px] px-4 py-2 rounded-[14px] bg-[#28272E] hover:bg-[#35343C] text-[#F2F1ED] text-[14px] font-medium border border-[#35343C] transition flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                <span>Hủy</span>
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="min-h-[48px] min-w-[48px] px-4 py-2 rounded-[14px] bg-[#E4483C] hover:bg-[#C23629] active:bg-[#C23629] text-[#F2F1ED] text-[14px] font-semibold transition flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <span className="w-4 h-4 border-2 border-[#F2F1ED]/30 border-t-[#F2F1ED] rounded-[14px] animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
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
                className="w-16 h-16 rounded-[14px] object-cover border-2 border-[#E4483C]"
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display font-bold text-[18px] text-[#F2F1ED] truncate">
                  {currentDisplayName}
                </h2>
                <ChangeProfileButton
                  currentAvatar={currentAvatar}
                  hasCustomAvatar={Boolean(effectiveCustomAvatar)}
                  onAvatarChange={handleAvatarChange}
                  onResetAvatar={handleResetAvatar}
                />
              </div>
              <p className="text-[12px] text-[#9C9AA3] flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#E4483C] shrink-0" />
                <span className="truncate">{currentGym}</span>
              </p>
              <p className="text-[14px] text-[#F2F1ED] font-normal leading-relaxed">
                {currentBio}
              </p>
            </div>
          </div>
        )}

        {/* Consistency Dashboard */}
        <div className="pt-4 border-t border-[#35343C] grid grid-cols-2 gap-2 sm:gap-4 text-center">
          <div className="p-4 rounded-[14px] bg-[#17161A] border border-[#35343C] flex flex-col gap-2">
            <span className="text-[12px] text-[#9C9AA3] block">
              Chuỗi tập đều đặn
            </span>
            <div className="flex items-center justify-center gap-2">
              <Flame className="w-4 h-4 text-[#E0B93D] fill-[#E0B93D]" />
              <span className="font-display tabular-nums text-[16px] font-semibold text-[#E0B93D]">
                {currentStreak} tuần
              </span>
            </div>
            <span className="text-[12px] text-[#4CAF6D]">Thứ hạng: nhóm 5% dẫn đầu</span>
          </div>

          <div className="p-4 rounded-[14px] bg-[#17161A] border border-[#35343C] flex flex-col gap-2">
            <span className="text-[12px] text-[#9C9AA3] block">
              Mục tiêu tháng
            </span>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#4CAF6D]" />
              <span className="font-display tabular-nums text-[16px] font-semibold text-[#F2F1ED]">
                14 / 16 buổi
              </span>
            </div>
            <span className="text-[12px] text-[#9C9AA3]">Mục tiêu: 100 tấn</span>
          </div>
        </div>
      </section>

      {/* Settings Panel Drawer if open */}
      {showSettings && (
        <section className="bg-[#1F1E24] rounded-[20px] border border-[#35343C] p-4 sm:p-6 flex flex-col gap-4">
          <h3 className="font-display font-bold text-[18px] text-[#F2F1ED]">
            Tùy chọn & tài khoản
          </h3>
          <div className="flex items-center justify-between gap-4 py-2 border-b border-[#35343C]">
            <span className="text-[14px] text-[#F2F1ED]">Đơn vị trọng lượng</span>
            <div className="flex bg-[#17161A] p-2 rounded-[14px] border border-[#35343C] gap-2">
              <button
                onClick={() => setUnit('kg')}
                className={`min-h-[48px] min-w-[48px] px-4 py-2 text-[13px] font-semibold rounded-[14px] transition font-display ${
                  unit === 'kg'
                    ? 'bg-[#E4483C] text-[#F2F1ED]'
                    : 'text-[#9C9AA3] hover:text-[#F2F1ED]'
                }`}
              >
                kg
              </button>
              <button
                onClick={() => setUnit('lbs')}
                className={`min-h-[48px] min-w-[48px] px-4 py-2 text-[13px] font-semibold rounded-[14px] transition font-display ${
                  unit === 'lbs'
                    ? 'bg-[#E4483C] text-[#F2F1ED]'
                    : 'text-[#9C9AA3] hover:text-[#F2F1ED]'
                }`}
              >
                lbs
              </button>
            </div>
          </div>

          {user ? (
            <div className="p-4 rounded-[14px] bg-[#17161A] border border-[#35343C] flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] text-[#9C9AA3] block">Tài khoản liên kết:</span>
                  <span className="text-[14px] text-[#F2F1ED] font-semibold">
                    {user.email || user.displayName}
                  </span>
                </div>
                <span className="text-[12px] text-[#4CAF6D] font-medium">
                  Đã đồng bộ
                </span>
              </div>
              <button
                onClick={signOut}
                className="w-full min-h-[48px] py-2 px-4 rounded-[14px] bg-[#E4483C]/15 hover:bg-[#E4483C]/25 border border-[#E4483C] text-[#E4483C] text-[14px] font-semibold transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setShowSettings(false);
                openAuthModal();
              }}
              className="w-full min-h-[48px] py-2 px-4 rounded-[14px] bg-[#E4483C] hover:bg-[#C23629] active:bg-[#C23629] text-[#F2F1ED] text-[14px] font-semibold transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
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
      <section className="bg-[#1F1E24] rounded-[20px] border border-[#35343C] p-4 sm:p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-[#28272E] border border-[#35343C] flex items-center justify-center text-[#E4483C] shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-display font-bold text-[18px] text-[#F2F1ED]">
                Kết bạn & bạn tập ({buddies.length})
              </h3>
              <p className="text-[12px] text-[#9C9AA3]">
                Đồng bộ trực tiếp với bảng tin chính để nhắc tập
              </p>
            </div>
          </div>
          {onGoToFeed && (
            <button
              type="button"
              onClick={onGoToFeed}
              className="min-h-[48px] min-w-[48px] px-4 py-2 rounded-[14px] bg-[#28272E] hover:bg-[#35343C] text-[#F2F1ED] text-[13px] font-semibold transition flex items-center gap-2 border border-[#35343C] shrink-0"
              title="Xem bạn tập trên bảng tin"
            >
              <span>Bảng tin</span>
              <ExternalLink className="w-4 h-4 text-[#E4483C]" />
            </button>
          )}
        </div>

        {/* Mode Switcher: Username vs Gmail */}
        <div className="flex items-center gap-2 bg-[#17161A] p-2 rounded-[14px] border border-[#35343C]">
          <button
            type="button"
            onClick={() => {
              setFriendInputMode('username');
              setFriendStatusMsg(null);
            }}
            className={`flex-1 min-h-[48px] py-2 px-4 rounded-[14px] text-[14px] font-semibold transition flex items-center justify-center gap-2 ${
              friendInputMode === 'username'
                ? 'bg-[#E4483C] text-[#F2F1ED]'
                : 'text-[#9C9AA3] hover:text-[#F2F1ED]'
            }`}
          >
            <AtSign className="w-4 h-4" />
            <span>Theo tên người dùng</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setFriendInputMode('gmail');
              setFriendStatusMsg(null);
            }}
            className={`flex-1 min-h-[48px] py-2 px-4 rounded-[14px] text-[14px] font-semibold transition flex items-center justify-center gap-2 ${
              friendInputMode === 'gmail'
                ? 'bg-[#E4483C] text-[#F2F1ED]'
                : 'text-[#9C9AA3] hover:text-[#F2F1ED]'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Theo Gmail</span>
          </button>
        </div>

        {/* Add Friend Input Form */}
        <form onSubmit={handleAddFriendSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          <div className="relative flex-1 min-w-0">
            {friendInputMode === 'username' ? (
              <AtSign className="w-4 h-4 text-[#9C9AA3] absolute left-4 top-4" />
            ) : (
              <Mail className="w-4 h-4 text-[#E4483C] absolute left-4 top-4" />
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
              className="w-full min-w-0 min-h-[48px] bg-[#28272E] border border-[#35343C] rounded-[14px] pl-10 pr-4 py-2 text-[14px] text-[#F2F1ED] placeholder-[#656470] focus:outline-hidden focus:border-[#E4483C]"
            />
          </div>
          <button
            type="submit"
            disabled={isAddingFriend}
            className="min-h-[48px] min-w-[48px] px-4 py-2 rounded-[14px] bg-[#E4483C] hover:bg-[#C23629] active:bg-[#C23629] text-[#F2F1ED] font-semibold text-[14px] transition shrink-0 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>{isAddingFriend ? 'Đang thêm...' : 'Kết bạn'}</span>
          </button>
        </form>

        {/* Feedback Banner */}
        {friendStatusMsg && (
          <div
            className={`px-4 py-2 rounded-[14px] text-[13px] font-medium flex items-center justify-between gap-4 ${
              friendStatusMsg.isError
                ? 'bg-[#E4483C]/15 text-[#E4483C] border border-[#E4483C]'
                : 'bg-[#4CAF6D]/15 text-[#4CAF6D] border border-[#4CAF6D]'
            }`}
          >
            <span>{friendStatusMsg.text}</span>
            <button
              type="button"
              onClick={() => setFriendStatusMsg(null)}
              className="min-w-[48px] min-h-[48px] w-12 h-12 rounded-[14px] flex items-center justify-center text-[#9C9AA3] hover:text-[#F2F1ED]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Quick Suggested Athletes to Add */}
        {availableSuggestions.length > 0 && (
          <div className="flex flex-col gap-2 pt-2">
            <span className="text-[12px] text-[#9C9AA3] block">
              Gợi ý bạn tập cùng hệ thống:
            </span>
            <div className="flex flex-col gap-2">
              {availableSuggestions.map(({ buddy }) => (
                <div
                  key={buddy.id}
                  className="p-4 rounded-[14px] bg-[#17161A] border border-[#35343C] flex flex-wrap sm:flex-nowrap items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1 basis-[180px]">
                    <img
                      src={buddy.avatar}
                      alt={buddy.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-[14px] object-cover border border-[#E4483C] shrink-0"
                    />
                    <div className="min-w-0 flex-1 flex flex-col gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display text-[14px] font-semibold text-[#F2F1ED] truncate">
                          {buddy.name}
                        </span>
                        <span className="text-[12px] text-[#E4483C]">
                          {buddy.username}
                        </span>
                      </div>
                      <span className="text-[12px] text-[#9C9AA3] block truncate">
                        {buddy.email} · {buddy.gymLocation}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickAddSuggested(buddy)}
                    disabled={isAddingFriend}
                    className="min-h-[48px] min-w-[48px] px-4 py-2 rounded-[14px] bg-[#28272E] hover:bg-[#35343C] text-[#F2F1ED] text-[13px] font-semibold border border-[#35343C] shrink-0 transition ml-auto"
                  >
                    + Kết bạn
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Synced Friends List */}
        <div className="pt-4 border-t border-[#35343C] flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[13px] font-medium text-[#F2F1ED] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#E4483C]" />
              <span>Danh sách bạn tập đã đồng bộ ({buddies.length})</span>
            </span>
          </div>

          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-2">
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
                  className="p-4 rounded-[14px] bg-[#17161A] border border-[#35343C] flex flex-wrap sm:flex-nowrap items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1 basis-[170px]">
                    <div className="relative shrink-0">
                      <img
                        src={buddy.avatar}
                        alt={buddy.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-[14px] object-cover border border-[#E4483C]"
                      />
                      <span className="absolute -bottom-1 -right-1 text-[10px] bg-[#1F1E24] px-2 py-0.5 rounded-[14px] border border-[#35343C] font-display font-semibold text-[#E0B93D] tabular-nums">
                        🔥{buddy.streakWeeks}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display text-[15px] font-semibold text-[#F2F1ED] truncate">
                          {buddy.name}
                        </span>
                        {buddy.username && (
                          <span className="text-[12px] text-[#9C9AA3]">
                            {buddy.username}
                          </span>
                        )}
                      </div>
                      <span className="text-[12px] text-[#9C9AA3] block truncate">
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
                          className={`min-h-[48px] min-w-[48px] px-4 py-2 rounded-[14px] border text-[13px] font-semibold transition flex items-center gap-2 active:scale-95 ${
                            isOnCooldown
                              ? 'bg-[#28272E] text-[#9C9AA3] border-[#35343C]'
                              : 'bg-[#E4483C]/15 hover:bg-[#E4483C]/25 text-[#E4483C] border-[#E4483C]'
                          }`}
                          title={
                            isOnCooldown
                              ? 'Đang trong thời gian chờ chống spam'
                              : `Nhắc ${buddy.name} đi tập ngay`
                          }
                        >
                          {isOnCooldown ? <span>⏳</span> : <Zap className="w-4 h-4" />}
                          <span>{isOnCooldown ? 'Đang chờ' : 'Nhắc tập'}</span>
                        </button>
                      );
                    })()}
                    {onRemoveFriend && (
                      <button
                        type="button"
                        onClick={() => onRemoveFriend(buddy.id)}
                        className="min-w-[48px] min-h-[48px] w-12 h-12 rounded-[14px] bg-[#28272E] hover:bg-[#E4483C]/20 text-[#9C9AA3] hover:text-[#E4483C] border border-[#35343C] transition flex items-center justify-center"
                        title="Xóa bạn tập"
                        aria-label={`Xóa bạn tập ${buddy.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
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
      <section className="bg-[#1F1E24] rounded-[20px] border border-[#35343C] p-4 sm:p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#E4483C]" />
            <h3 className="font-display font-bold text-[18px] text-[#F2F1ED]">
              Kỷ lục cá nhân
            </h3>
          </div>
          <span className="text-[12px] text-[#9C9AA3]">Đã kiểm chứng</span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {PR_TROPHIES.map((pr) => (
            <div
              key={pr.name}
              className="p-4 rounded-[14px] bg-[#17161A] border border-[#35343C] flex items-center justify-between gap-4"
            >
              <div className="flex flex-col gap-2">
                <span className="text-[12px] text-[#9C9AA3] block">{pr.name}</span>
                <span className="font-display tabular-nums text-[18px] font-bold text-[#F2F1ED] block">
                  {pr.weight}
                </span>
                <span
                  className="text-[12px] font-medium block"
                  style={{ color: pr.color }}
                >
                  {pr.type}
                </span>
              </div>
              <span className="text-2xl">{pr.icon}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Completed Challenge Badges */}
      <section className="bg-[#1F1E24] rounded-[20px] border border-[#35343C] p-4 sm:p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#E4483C]" />
            <h3 className="font-display font-bold text-[18px] text-[#F2F1ED]">
              Huy hiệu đã đạt
            </h3>
          </div>
          <span className="text-[12px] text-[#9C9AA3] font-display tabular-nums">4 huy hiệu</span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {BADGES.map((b, i) => (
            <div
              key={i}
              className="p-4 rounded-[14px] bg-[#17161A] border border-[#35343C] flex items-center gap-4"
            >
              <span className="w-12 h-12 rounded-[14px] bg-[#28272E] border border-[#35343C] flex items-center justify-center text-xl shrink-0">
                {b.icon}
              </span>
              <div className="min-w-0 flex flex-col gap-2">
                <span className="font-display text-[14px] font-semibold text-[#F2F1ED] block truncate">
                  {b.title}
                </span>
                <span className="text-[12px] text-[#9C9AA3] block">{b.date}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Monthly Muscle Heatmap Coverage (30 Days) */}
      <section className="bg-[#1F1E24] rounded-[20px] border border-[#35343C] p-4 sm:p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#E4483C]" />
            <h3 className="font-display font-bold text-[18px] text-[#F2F1ED]">
              Bản đồ cơ bắp 30 ngày
            </h3>
          </div>
          <span className="text-[12px] text-[#9C9AA3]">Tần suất toàn thân</span>
        </div>

        <p className="text-[14px] text-[#F2F1ED] font-normal">
          Độ phủ hiệp tập trong 30 ngày vừa qua. Khối lượng tập trung mạnh vào ngực và xô.
        </p>

        <MuscleHeatmap volumeMap={MONTHLY_MUSCLE_VOLUME} />
      </section>

      {/* 5. Past Workout Activity Log */}
      <section className="bg-[#1F1E24] rounded-[20px] border border-[#35343C] p-4 sm:p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#E4483C]" />
            <h3 className="font-display font-bold text-[18px] text-[#F2F1ED]">
              Lịch sử buổi tập gần đây
            </h3>
          </div>
          <span className="text-[12px] text-[#9C9AA3] font-display tabular-nums">3 buổi gần nhất</span>
        </div>

        <div className="flex flex-col gap-4">
          {PAST_WORKOUTS.map((w, idx) => (
            <div
              key={idx}
              className="p-4 rounded-[14px] bg-[#17161A] border border-[#35343C] flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-4 text-[12px] text-[#9C9AA3]">
                <span>{w.date}</span>
                <span>{w.gym}</span>
              </div>
              <h5 className="font-display font-semibold text-[16px] text-[#F2F1ED]">
                {w.title}
              </h5>
              <div className="flex items-center gap-2 text-[13px] font-display tabular-nums">
                <span className="font-semibold" style={{ color: w.rpeColor }}>
                  {w.volume}
                </span>
                <span className="text-[#656470]" aria-hidden="true">·</span>
                <span className="text-[#F2F1ED]">{w.sets} hiệp</span>
                <span className="text-[#656470]" aria-hidden="true">·</span>
                <span className="text-[#9C9AA3]">{w.duration}</span>
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
