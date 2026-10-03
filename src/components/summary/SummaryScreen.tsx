import React, { useState, useMemo, useEffect } from 'react';
import { 
  Share2, 
  MapPin, 
  Flame, 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp,
  Dumbbell,
  Layers,
  Clock,
  Video,
  Image as ImageIcon,
  Trophy
} from 'lucide-react';
import { WorkoutSession, FeedPost, MuscleGroup } from '../../types/gym';
import {
  calculateE1RM,
  getSessionExerciseProgressions,
  getRpePlateColor,
  PLATE_CODE_COLORS,
  SetCalculator,
  calculateCompoundLiftsE1RM,
} from '../../utils/fitnessCalculations';
import { WorkoutDraftCacheService } from '../../services/workoutDraftCacheService';
import { processUploadedMediaFile } from '../../utils/mediaUpload';
import { MuscleHeatmapWidget } from '../common/MuscleHeatmapWidget';
import { buildSetVolumeMapFromExercisesJson } from '../../services/exerciseImporter';
import { GooglePlacesService } from '../../services/googlePlacesService';
import { FlexStoryModal } from './FlexStoryModal';
import { formatRealTimeDisplay } from '../../utils/postTimestamp';
import bannerLogoImg from '../../assets/images/regenerated_image_1790319031345.png';
import profileAvatarImg from '../../assets/images/regenerated_image_1790319027239.png';

interface SummaryScreenProps {
  session: WorkoutSession;
  onPublishToFeed: (post: FeedPost) => void;
  onBackToLogger: () => void;
  isLandscape?: boolean;
  isTablet?: boolean;
}

export const SummaryScreen: React.FC<SummaryScreenProps> = ({
  session,
  onPublishToFeed,
  onBackToLogger,
}) => {
  const [caption, setCaption] = useState<string>(
    'Buổi tập hôm nay quá đã! Tạ lên đều và kỹ thuật cực kỳ mượt mà. Anh em cùng phòng tập điểm danh đê!'
  );
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const activeCheckedInGym = GooglePlacesService.loadSavedCheckIn();
  const [selectedGym, setSelectedGym] = useState<string>(
    activeCheckedInGym?.name || session.gymVenue || 'California Fitness & Yoga Thanh Hóa'
  );
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isFlexStoryModalOpen, setIsFlexStoryModalOpen] = useState<boolean>(false);
  const [uploadedMedia, setUploadedMedia] = useState<{
    type: 'image' | 'video';
    url: string;
    fileName: string;
    fileSizeLabel: string;
  } | null>(null);

  const handleSummaryMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const processed = await processUploadedMediaFile(file);
    setUploadedMedia({
      type: processed.type,
      url: processed.url,
      fileName: processed.fileName,
      fileSizeLabel: processed.fileSizeLabel,
    });
    e.target.value = '';
  };

  const durationMinutes = Math.max(1, Math.round(session.durationSeconds / 60));
  const hasAnyCompleted = useMemo(
    () => SetCalculator.hasAnyCompletedSet(session.exercises),
    [session.exercises]
  );

  const computedTonnage = useMemo(
    () =>
      SetCalculator.calculateSessionTonnage(
        session.exercises,
        {
          bodyweightKg: session.userBodyweightKg,
          preferredUnit: session.preferredUnit,
        },
        { includeUncompletedIfNoneDone: true }
      ),
    [session.exercises, session.userBodyweightKg, session.preferredUnit]
  );

  const computedSetsCount = useMemo(
    () =>
      SetCalculator.calculateCompletedSetsCount(session.exercises, {
        includeUncompletedIfNoneDone: true,
      }),
    [session.exercises]
  );

  const totalVolume = computedTonnage > 0 ? computedTonnage : session.totalTonnageKg || 6850;
  const totalSets = computedSetsCount > 0 ? computedSetsCount : session.totalSets || 14;

  const muscleVolumeMap = useMemo<Partial<Record<MuscleGroup, number>>>(
    () =>
      buildSetVolumeMapFromExercisesJson(session.exercises, {
        includeUncompletedIfNoneDone: true,
      }),
    [session.exercises]
  );

  const heatmapDisplayVolumes = useMemo(
    () =>
      SetCalculator.buildMacroMuscleVolumes(session.exercises, {
        includeUncompletedIfNoneDone: true,
      }),
    [session.exercises]
  );

  const exerciseProgressions = useMemo(
    () => getSessionExerciseProgressions(session),
    [session]
  );

  const topPR = useMemo(
    () =>
      SetCalculator.findSessionTopPR(session, {
        includeUncompletedIfNoneDone: true,
      }),
    [session]
  );

  const compoundLiftsSummary = useMemo(
    () =>
      calculateCompoundLiftsE1RM(session.exercises, {
        bodyweightKg: session.userBodyweightKg,
        preferredUnit: session.preferredUnit,
      }).filter((l) => l.isTopThreeSBD),
    [session.exercises, session.userBodyweightKg, session.preferredUnit]
  );

  useEffect(() => {
    WorkoutDraftCacheService.syncCompoundPRsFromSession(session);
  }, [session]);

  const handlePublish = () => {
    setIsPublishing(true);

    const summaryExercises = session.exercises
      .map((ex) => {
        const activeSets = hasAnyCompleted ? ex.sets.filter((s) => s.completed) : ex.sets;
        if (activeSets.length === 0) return null;
        const bestExSet = activeSets.reduce((prev, curr) => {
          const prevScore = calculateE1RM(prev.weight, prev.reps, prev.rpe) || prev.weight * prev.reps;
          const currScore = calculateE1RM(curr.weight, curr.reps, curr.rpe) || curr.weight * curr.reps;
          return currScore >= prevScore ? curr : prev;
        }, activeSets[0]);
        const exVolume = activeSets.reduce((acc, s) => acc + s.weight * s.reps, 0);
        return {
          name: ex.name,
          topSet: bestExSet
            ? `${bestExSet.weight}kg × ${bestExSet.reps}${bestExSet.rpe ? ` (RPE ${bestExSet.rpe})` : ''}`
            : 'Hoàn thành',
          primaryMuscle: ex.primaryMuscle,
          volumeKg: exVolume,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();

    const newPost: FeedPost = {
      id: `post-${nowMs}`,
      userId: 'user-current',
      userName: 'Long Aura (Bạn)',
      userAvatar: profileAvatarImg,
      userBadge: 'Aura Master',
      userGym: selectedGym,
      timestamp: formatRealTimeDisplay(nowMs, nowMs),
      createdAt: nowIso,
      title: session.title,
      durationMinutes,
      totalTonnageKg: totalVolume,
      totalSets,
      prHighlight: `🏆 PR: ${topPR.exerciseName} ${topPR.weight}kg × ${topPR.reps} (1RM ${topPR.e1rm}kg)`,
      caption,
      dapsCount: 1,
      isDapped: true,
      commentsCount: 0,
      forkCount: 0,
      workoutSummary: {
        exercises: summaryExercises,
        muscleVolumeMap,
      },
      media: {
        type: uploadedMedia?.type || 'image',
        url: uploadedMedia?.url || bannerLogoImg,
        telemetryData: {
          exercise: topPR.exerciseName,
          weightReps: `${topPR.weight} kg × ${topPR.reps} lần`,
          rpe: topPR.rpe,
          volume: `${totalVolume.toLocaleString()} kg`,
        },
      },
    };

    setTimeout(() => {
      onPublishToFeed(newPost);
    }, 600);
  };

  return (
    <div className="flex flex-col min-h-full bg-zinc-950 text-zinc-100 w-full">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-zinc-950/85 backdrop-blur-xl border-b border-white/10 w-full">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <button
            onClick={onBackToLogger}
            className="apple-btn-secondary min-h-[44px] px-4 py-2 text-sm font-medium"
          >
            Quay lại
          </button>

          <h2 className="font-display font-bold text-lg text-zinc-100 tracking-tight truncate">
            Tổng kết buổi tập
          </h2>

          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="apple-btn-primary min-h-[44px] px-4 py-2 text-sm font-semibold flex items-center gap-2 shrink-0"
          >
            {isPublishing ? (
              <Sparkles className="w-4 h-4 stroke-[1.75] animate-spin" />
            ) : (
              <Share2 className="w-4 h-4 stroke-[1.75]" />
            )}
            <span>{isPublishing ? 'Đang đăng...' : 'Đăng bảng tin'}</span>
          </button>
        </div>
      </header>

      {/* Main Summary Body */}
      <div className="flex-1 px-4 sm:px-6 py-6 max-w-3xl mx-auto w-full flex flex-col gap-6">
        {/* 1. PR Celebration Banner */}
        <section
          className="apple-card p-5 sm:p-6 flex items-center gap-4 border border-[#E4483C]/40 bg-gradient-to-r from-[#E4483C]/10 to-transparent"
        >
          <div
            className="apple-icon-badge-accent w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
          >
            🏆
          </div>
          <div className="flex flex-col gap-1.5">
            <span
              className="text-xs font-semibold block text-[#E4483C] tracking-wide uppercase"
            >
              Kỷ lục cá nhân mới
            </span>
            <h3 className="font-display font-bold text-lg text-zinc-100 tracking-tight leading-snug">
              {topPR.exerciseName} {topPR.weight} kg × {topPR.reps} lần
            </h3>
            <p className="text-xs text-zinc-400">
              Ước tính 1RM:{' '}
              <strong className="font-display tabular-nums font-semibold text-zinc-200">
                {topPR.e1rm} kg
              </strong>{' '}
              (+4.2 kg)
            </p>
          </div>
        </section>

        {/* 2. Session Analytics Matrix Bar */}
        <section className="apple-card p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
            <h3 className="font-display text-base font-semibold text-zinc-100 tracking-tight">
              Thông số buổi tập
            </h3>
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>Hoàn thành</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 text-center">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col items-center gap-2">
              <Dumbbell className="w-5 h-5 text-[#E4483C] stroke-[1.75]" />
              <span className="text-xs text-zinc-400 block">
                Tổng tải
              </span>
              <span className="font-display tabular-nums text-base sm:text-lg font-bold text-[#E4483C] block tracking-tight">
                {totalVolume.toLocaleString()} kg
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col items-center gap-2">
              <Layers className="w-5 h-5 text-[#E4483C] stroke-[1.75]" />
              <span className="text-xs text-zinc-400 block">
                Hiệp tập
              </span>
              <span className="font-display tabular-nums text-base sm:text-lg font-bold text-zinc-100 block tracking-tight">
                {totalSets} hiệp
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col items-center gap-2">
              <Clock className="w-5 h-5 text-[#E4483C] stroke-[1.75]" />
              <span className="text-xs text-zinc-400 block">
                Thời lượng
              </span>
              <span className="font-display tabular-nums text-base sm:text-lg font-bold text-zinc-100 block tracking-tight">
                {durationMinutes} phút
              </span>
            </div>
          </div>
        </section>

        {/* 2.5 Dynamic Vector SVG Muscle Heatmap Widget */}
        <MuscleHeatmapWidget
          muscleVolumes={heatmapDisplayVolumes}
          setVolumeMap={muscleVolumeMap}
          exercises={session.exercises}
        />

        {/* 2.8 Top Compound Lifts E1RM Summary (Bench, Squat, Deadlift) & Kỷ lục cá nhân Sync */}
        <section className="apple-card p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="apple-icon-badge-accent">
                <Trophy className="w-4 h-4 stroke-[1.75]" />
              </div>
              <div className="flex flex-col">
                <h4 className="font-display font-semibold text-base text-zinc-100 tracking-tight">
                  1RM ước tính (E1RM) · 3 Bài Compound
                </h4>
                <span className="text-xs text-zinc-400">
                  Tính từ hiệp nặng nhất buổi tập & tự động đồng bộ vào Kỷ lục cá nhân
                </span>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>Đã đồng bộ Kỷ lục cá nhân</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {compoundLiftsSummary.map((lift) => (
              <div
                key={lift.key}
                className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col justify-between gap-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-semibold text-sm text-zinc-100 truncate">
                    {lift.name}
                  </span>
                  <span className="text-lg shrink-0">{lift.icon}</span>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs text-zinc-400">E1RM</span>
                  <span
                    className="font-display tabular-nums text-lg font-bold"
                    style={{ color: lift.hasSessionSet ? '#F2F1ED' : '#656470' }}
                  >
                    {lift.hasSessionSet ? `${lift.e1rmKg} kg` : '-- kg'}
                  </span>
                </div>

                <div
                  className="h-1 w-full rounded-full"
                  style={{ backgroundColor: lift.color }}
                />

                <span className="text-xs text-zinc-400 font-display tabular-nums truncate">
                  {lift.hasSessionSet
                    ? `Hiệp nặng nhất: ${lift.heaviestWeightKg}kg × ${lift.reps}${
                        lift.rpe ? ` (RPE ${lift.rpe})` : ''
                      }`
                    : 'Chưa có trong buổi tập này'}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Strength Progression & Estimated 1RM (E1RM) Breakdown */}
        <section className="apple-card p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="apple-icon-badge-accent">
              <TrendingUp className="w-4 h-4 stroke-[1.75]" />
            </div>
            <h4 className="font-display font-semibold text-base text-zinc-100 tracking-tight">
              Chi tiết bài tập & 1RM ước tính
            </h4>
          </div>

          <div className="flex flex-col gap-3">
            {exerciseProgressions.map((prog, idx) => {
              return (
                <div
                  key={prog.exerciseId || idx}
                  className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-display font-semibold text-sm sm:text-base text-zinc-100 block">
                        {prog.name}
                      </span>
                      <span className="text-xs text-zinc-400 block">
                        {prog.vietnameseName} · Tổng tải: {prog.totalVolume.toLocaleString()} kg
                      </span>
                    </div>

                    <div className="text-right shrink-0 flex flex-col gap-1">
                      <span className="text-[11px] text-zinc-400 block">1RM cao nhất</span>
                      <div className="flex items-center gap-1.5 justify-end font-display tabular-nums font-semibold text-sm text-[#E4483C]">
                        <Flame className="w-3.5 h-3.5 fill-[#E4483C] text-[#E4483C] stroke-[1.75]" />
                        <span>{prog.bestE1rm > 0 ? `${prog.bestE1rm} kg` : '--'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Set-by-Set Progression with semantic Plate-Code RPE color */}
                  <div className="pt-3 border-t border-white/10 flex flex-wrap gap-2">
                    {session.exercises[idx]?.sets.map((set, sIdx) => {
                      const setE1rm = calculateE1RM(set.weight, set.reps, set.rpe);
                      const isBestSet = prog.bestE1rm > 0 && setE1rm === prog.bestE1rm && set.weight > 0;
                      const rpeColor = getRpePlateColor(set.rpe);

                      return (
                        <div
                          key={set.id || sIdx}
                          className="flex items-center gap-2 py-1.5 px-3 rounded-xl text-xs font-display tabular-nums border bg-zinc-950/60"
                          style={{
                            borderColor: isBestSet ? PLATE_CODE_COLORS.red : 'rgba(255, 255, 255, 0.08)',
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: rpeColor }}
                          />
                          <span className="text-zinc-400">H{set.setNumber}:</span>
                          <span className="text-zinc-200">
                            {set.weight}kg × {set.reps}
                          </span>
                          <span className="text-zinc-500">→</span>
                          <span
                            className="font-semibold"
                            style={{ color: isBestSet ? PLATE_CODE_COLORS.red : '#F2F1ED' }}
                          >
                            {setE1rm > 0 ? `${setE1rm} kg` : '--'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Media Upload */}
        <section className="apple-card p-5 sm:p-6 flex flex-col gap-4">
          <h4 className="font-display font-semibold text-base text-zinc-100 tracking-tight">
            Hình ảnh & Video buổi tập
          </h4>

          <div className="grid grid-cols-3 gap-2.5">
            <label className="apple-btn-secondary min-h-[44px] px-2 sm:px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 cursor-pointer text-center">
              <Video className="w-4 h-4 text-[#E4483C] stroke-[1.75] shrink-0" />
              <span className="truncate leading-none">Quay video</span>
              <input
                type="file"
                accept="video/*"
                capture="environment"
                onChange={handleSummaryMediaSelect}
                className="hidden"
              />
            </label>

            <label className="apple-btn-secondary min-h-[44px] px-2 sm:px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 cursor-pointer text-center">
              <Camera className="w-4 h-4 text-[#3E8EDE] stroke-[1.75] shrink-0" />
              <span className="truncate leading-none">Chụp ảnh</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleSummaryMediaSelect}
                className="hidden"
              />
            </label>

            <label className="apple-btn-secondary min-h-[44px] px-2 sm:px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 cursor-pointer text-center">
              <ImageIcon className="w-4 h-4 text-emerald-400 stroke-[1.75] shrink-0" />
              <span className="truncate leading-none">Thư viện</span>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleSummaryMediaSelect}
                className="hidden"
              />
            </label>
          </div>

          {uploadedMedia && (
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 flex flex-col">
              <div className="px-4 py-2.5 bg-zinc-900/80 border-b border-white/10 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-emerald-400 truncate">
                  ✓ Đã đính kèm {uploadedMedia.type === 'video' ? 'Video' : 'Ảnh'} ({uploadedMedia.fileSizeLabel})
                </span>
                <button
                  type="button"
                  onClick={() => setUploadedMedia(null)}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-[#E4483C] border border-rose-500/20 text-xs font-medium transition-all duration-200 active:scale-[0.96]"
                >
                  Xóa
                </button>
              </div>
              <div className="relative w-full aspect-video max-h-60 bg-black flex items-center justify-center overflow-hidden">
                {uploadedMedia.type === 'video' ? (
                  <video
                    src={uploadedMedia.url}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={uploadedMedia.url}
                    alt="Uploaded workout media"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          )}
        </section>

        {/* 5. Privacy & Location */}
        <section className="apple-card p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-zinc-400 block">
              Phòng tập
            </label>
            <div className="relative">
              <input
                type="text"
                value={selectedGym}
                onChange={(e) => setSelectedGym(e.target.value)}
                placeholder="Nhập hoặc chọn phòng tập..."
                className="apple-input w-full min-h-[44px] px-4 py-2 pr-10 text-sm truncate"
              />
              <MapPin className="w-4 h-4 text-[#E4483C] stroke-[1.75] absolute right-4 top-3.5 pointer-events-none" />
            </div>
            {activeCheckedInGym && (
              <span className="text-xs text-[#E4483C] font-medium">
                📍 Đã đồng bộ từ Check-in: {activeCheckedInGym.name} — {activeCheckedInGym.address}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-zinc-400 block">
              Quyền riêng tư
            </label>
            <div className="apple-segmented-control grid grid-cols-3 gap-1">
              {[
                { id: 'public', label: 'Công khai', icon: '🌍' },
                { id: 'friends', label: 'Bạn tập', icon: '👥' },
                { id: 'private', label: 'Chỉ mình tôi', icon: '🔒' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setVisibility(item.id as any)}
                  className={`min-h-[40px] py-2 px-2 sm:px-4 text-center rounded-xl text-xs font-medium transition-all duration-200 ease-out flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                    visibility === item.id
                      ? 'bg-white/15 text-white font-semibold shadow-xs border border-white/10'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-zinc-400 block">
              Cảm nghĩ buổi tập
            </label>
            <textarea
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Hôm nay bài nào chất nhất? Rủ anh em đi tập đê..."
              className="apple-input w-full p-4 text-sm resize-none"
            />
          </div>
        </section>

        {/* Export Story Flex Button & Publish Big Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setIsFlexStoryModalOpen(true)}
            className="apple-btn-secondary flex-1 min-h-[48px] px-5 py-3 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-[#E4483C] stroke-[1.75]" />
            <span>Xuất Story Flex 🔥</span>
          </button>

          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="apple-btn-primary flex-1 min-h-[48px] p-4 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5 stroke-[1.75]" />
            <span>Đăng lên bảng tin Đi tập đê!</span>
          </button>
        </div>

        <FlexStoryModal
          isOpen={isFlexStoryModalOpen}
          onClose={() => setIsFlexStoryModalOpen(false)}
          userName="Tùng Nguyễn"
          userHandle="tung_powerbuilder"
          gymLocation={selectedGym || '📍 Strongman Gym'}
          workoutTitle={session.title || 'Gánh Đùi & Mông (Leg Day)'}
          totalVolumeKg={totalVolume}
          totalSets={totalSets}
          durationFormatted={`${String(Math.floor(durationMinutes / 60)).padStart(2, '0')}:${String(durationMinutes % 60).padStart(2, '0')}:00`}
          prBadgeText={
            topPR
              ? `NEW PR: ${topPR.exerciseName} ${topPR.weight}kg × ${topPR.reps} reps!`
              : 'NEW PR: Squat 140kg × 3 reps!'
          }
          muscleSetCounts={{
            Ngực: heatmapDisplayVolumes.Chest,
            Lưng: heatmapDisplayVolumes.Back,
            Vai: heatmapDisplayVolumes.Shoulders,
            Tay: heatmapDisplayVolumes.Arms,
            Bụng: heatmapDisplayVolumes.Core,
            Chân: heatmapDisplayVolumes.Legs,
          }}
          backgroundMedia={uploadedMedia}
          onUpdateBackgroundMedia={(media) => {
            if (!media) {
              setUploadedMedia(null);
            } else {
              setUploadedMedia({
                type: media.type,
                url: media.url,
                fileName: media.fileName || 'story_bg',
                fileSizeLabel: media.fileSizeLabel || '',
              });
            }
          }}
        />
      </div>
    </div>
  );
};
