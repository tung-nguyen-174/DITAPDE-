import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Sparkles,
  Check,
  TrendingUp,
  RotateCcw,
  Camera,
  Image as ImageIcon,
  Video,
  X,
  Search,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import {
  WorkoutSession,
  FeedPost,
  MuscleGroup,
} from '../../types/gym';
import {
  getSetsBestE1RM,
} from '../../utils/fitnessCalculations';
import { MuscleHeatmap } from '../common/MuscleHeatmap';
import { GYM_VENUES } from '../../data/mockData';
import { FlexStoryModal, AttachedStoryMedia } from './FlexStoryModal';
import { processUploadedMediaFile } from '../../utils/mediaUpload';
import { GymLocationModel } from '../../services/googlePlacesService';
import { getMuscleVietnameseLabel } from '../logger/ActiveLoggerScreen';

interface SummaryScreenProps {
  session: WorkoutSession;
  activeCheckInGym?: GymLocationModel | null;
  userName?: string;
  userHandle?: string;
  userAvatar?: string;
  onPublishToFeed: (post: FeedPost) => void;
  onDiscard: () => void;
}

export const SummaryScreen: React.FC<SummaryScreenProps> = ({
  session,
  activeCheckInGym,
  userName = 'Tùng Nguyễn',
  userHandle = 'tung_powerbuilder',
  userAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
  onPublishToFeed,
  onDiscard,
}) => {
  const [caption, setCaption] = useState(
    'Buổi tập cực cháy hôm nay! Ai đang ở phòng tập vào điểm danh đê 🔥💪'
  );
  const [selectedGymName, setSelectedGymName] = useState(
    activeCheckInGym?.name || session.gymVenue || GYM_VENUES[0].name
  );
  const [gymSearchQuery, setGymSearchQuery] = useState('');
  const [isGymDropdownOpen, setIsGymDropdownOpen] = useState(false);

  const [shareToFeed, setShareToFeed] = useState(true);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState<AttachedStoryMedia[]>([]);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (activeCheckInGym) {
      setSelectedGymName(activeCheckInGym.name);
    }
  }, [activeCheckInGym]);

  const filteredGyms = useMemo(() => {
    const q = gymSearchQuery.trim().toLowerCase();
    if (!q) return GYM_VENUES;
    return GYM_VENUES.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.address.toLowerCase().includes(q) ||
        g.city.toLowerCase().includes(q)
    );
  }, [gymSearchQuery]);

  const totalVolume = useMemo(() => {
    const computed = session.exercises.reduce((acc, ex) => {
      return (
        acc +
        ex.sets.reduce((sAcc, s) => {
          return sAcc + (s.completed ? s.weight * s.reps : s.weight * s.reps);
        }, 0)
      );
    }, 0);
    return computed > 0 ? computed : session.totalTonnageKg || 8450;
  }, [session]);

  const completedSets = useMemo(() => {
    const done = session.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
      0
    );
    const total = session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    return done > 0 ? done : total || 14;
  }, [session.exercises]);

  const muscleVolumes = useMemo(() => {
    const map: Partial<Record<MuscleGroup, number>> = {};
    session.exercises.forEach((ex) => {
      const doneCount = ex.sets.filter((s) => s.completed).length;
      const count = doneCount > 0 ? doneCount : ex.sets.length;
      map[ex.primaryMuscle] = (map[ex.primaryMuscle] || 0) + count;
    });
    return map;
  }, [session.exercises]);

  const muscleSetCounts: Record<string, number> = {};
  session.exercises.forEach((ex) => {
    const completed = ex.sets.filter((s) => s.completed).length;
    const countToUse = completed > 0 ? completed : ex.sets.length;
    const label = getMuscleVietnameseLabel(ex.primaryMuscle);
    if (countToUse > 0) {
      muscleSetCounts[label] = (muscleSetCounts[label] || 0) + countToUse;
    }
  });
  if (Object.keys(muscleSetCounts).length === 0) {
    muscleSetCounts['Ngực'] = 4;
    muscleSetCounts['Tay Sau'] = 3;
  }

  const durationMinutes = Math.max(1, Math.round(session.durationSeconds / 60));

  const formatDurationReadout = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) return `${hrs}g ${remMins}p`;
    return `${mins} phút`;
  };

  let topExerciseName = session.exercises[0]?.name || 'Barbell Bench Press';
  let topE1RM = 0;
  let topWeightReps = '100 kg × 5 lần';
  let topRpe = 8.5;
  session.exercises.forEach((ex) => {
    const bestInfo = getSetsBestE1RM(ex.sets);
    if (bestInfo && bestInfo.e1rm > topE1RM) {
      topE1RM = bestInfo.e1rm;
      topExerciseName = ex.name;
      topWeightReps = `${bestInfo.weight} kg × ${bestInfo.reps} lần`;
      topRpe = bestInfo.set.rpe;
    }
  });

  const handleMediaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setMediaUploading(true);
    setMediaUploadError(null);
    try {
      const processedList: AttachedStoryMedia[] = [];
      for (let i = 0; i < files.length; i++) {
        const item = await processUploadedMediaFile(files[i]);
        processedList.push({
          type: item.type,
          url: item.url,
          fileName: item.fileName,
          fileSizeLabel: item.fileSizeLabel,
        });
      }
      setAttachedMedia((prev) => [...prev, ...processedList]);
    } catch (err) {
      console.error('Error uploading workout media:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Không thể xử lý tệp hình ảnh/video. Vui lòng thử lại.';
      setMediaUploadError(message);
    } finally {
      setMediaUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveMedia = (index: number) => {
    setAttachedMedia((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleStoryBackgroundUpdate = (storyMedia: AttachedStoryMedia | null) => {
    if (!storyMedia) {
      setAttachedMedia([]);
    } else {
      setAttachedMedia([storyMedia]);
    }
  };

  const handlePublish = () => {
    const primaryMedia = attachedMedia[0];
    const newPost: FeedPost = {
      id: `post-${Date.now()}`,
      userId: 'current-user',
      userName,
      userAvatar,
      userBadge: 'Chuột Chiến',
      userGym: selectedGymName,
      timestamp: 'Vừa xong',
      title: session.title,
      durationMinutes,
      totalTonnageKg: totalVolume,
      totalSets: completedSets,
      prHighlight:
        topE1RM > 0
          ? `🏆 PR: ${topExerciseName} • E1RM ${topE1RM} kg`
          : undefined,
      caption,
      dapsCount: 1,
      isDapped: true,
      commentsCount: 0,
      comments: [],
      forkCount: 0,
      workoutSummary: {
        exercises: session.exercises.map((ex) => {
          const bestSet = ex.sets.reduce(
            (acc, s) => (s.weight > acc.weight ? s : acc),
            ex.sets[0] || { weight: 60, reps: 10, rpe: 8 }
          );
          const vol = ex.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
          return {
            name: ex.name,
            topSet: `${bestSet.weight}kg x ${bestSet.reps} (RPE ${bestSet.rpe})`,
            primaryMuscle: ex.primaryMuscle,
            volumeKg: vol || 1200,
          };
        }),
        muscleVolumeMap:
          Object.keys(muscleVolumes).length > 0
            ? muscleVolumes
            : { chest: 8, triceps: 6, front_delts: 5 },
      },
      media: primaryMedia
        ? {
            type: primaryMedia.type,
            url: primaryMedia.url,
            telemetryData: {
              exercise: topExerciseName,
              weightReps: topWeightReps,
              rpe: topRpe,
              volume: `${totalVolume.toLocaleString('vi-VN')} kg`,
            },
          }
        : undefined,
    };

    onPublishToFeed(newPost);
  };

  const primaryStoryMedia: AttachedStoryMedia | null =
    attachedMedia.length > 0 ? attachedMedia[0] : null;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 text-zinc-100 flex flex-col overflow-y-auto">
      <div className="max-w-lg mx-auto w-full px-6 py-8 flex flex-col gap-6 pb-28">
        {/* Top Celebration Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-emerald-400">
              Hoàn thành giáo án hôm nay
            </span>
            <h2 className="font-display font-bold text-[22px] tracking-tight text-zinc-100">
              Tổng Kết Buổi Tập
            </h2>
          </div>

          <button
            onClick={onDiscard}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 text-[13px] font-semibold flex items-center gap-2 transition-all duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-zinc-500"
          >
            <RotateCcw className="w-4 h-4 stroke-[1.5]" />
            <span>Sửa lại</span>
          </button>
        </div>

        {/* Shareable Workout Summary Card */}
        <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/50 backdrop-blur-md p-6 flex flex-col gap-6 shadow-sm">
          {/* Card Brand Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={userAvatar}
                alt={userName}
                className="w-11 h-11 rounded-full object-cover border border-zinc-700"
              />
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-[15px] tracking-tight text-zinc-100">
                    {userName}
                  </span>
                  <span className="text-[12px] font-medium text-emerald-400">
                    • Chuột Chiến
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-zinc-400">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 stroke-[1.5]" />
                  <span>{selectedGymName}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="font-display font-bold text-[13px] tracking-tight text-emerald-400 block">
                Đi tập đê!
              </span>
              <span className="text-[11px] font-normal text-zinc-400">
                Hồ sơ tập luyện
              </span>
            </div>
          </div>

          {/* Workout Title & PR Highlight */}
          <div className="flex flex-col gap-2.5">
            <h3 className="font-display font-bold text-[20px] tracking-tight text-zinc-100">
              {session.title}
            </h3>
            {topE1RM > 0 && (
              <div className="inline-flex items-center gap-2 text-[12px] font-semibold text-emerald-400">
                <TrendingUp className="w-4 h-4 stroke-[1.5]" />
                <span>
                  Kỷ lục 1RM: {topExerciseName} •{' '}
                  <strong className="font-display tabular-nums">{topE1RM} kg</strong>
                </span>
              </div>
            )}
          </div>

          {/* Attached Photo/Video Preview Inside Card */}
          {attachedMedia.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {attachedMedia.map((media, idx) => (
                <div
                  key={`${media.fileName || 'm'}-${idx}`}
                  className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 aspect-4/3 group"
                >
                  {media.type === 'video' ? (
                    <video
                      src={media.url}
                      controls
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={media.url}
                      alt={media.fileName || 'Ảnh buổi tập'}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(idx)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-zinc-950/80 text-zinc-100 hover:bg-red-500 hover:text-zinc-950 flex items-center justify-center transition-all duration-200 ease-in-out"
                    title="Xóa ảnh/video"
                  >
                    <X className="w-4 h-4 stroke-[1.5]" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Core Metrics & Muscle Heatmap */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-zinc-950/60 p-5 rounded-xl border border-zinc-800/80">
            <div className="sm:col-span-7 grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] font-normal text-zinc-400 block">
                  Tổng tải trọng
                </span>
                <span className="font-display tabular-nums text-[22px] font-bold tracking-tight text-zinc-100">
                  {totalVolume.toLocaleString('vi-VN')}
                </span>
                <span className="text-[12px] text-emerald-400 font-semibold">
                  kilogram (kg)
                </span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] font-normal text-zinc-400 block">
                  Thời lượng
                </span>
                <span className="font-display tabular-nums text-[22px] font-bold tracking-tight text-zinc-100">
                  {formatDurationReadout(session.durationSeconds)}
                </span>
                <span className="text-[12px] text-zinc-400 font-normal">
                  {completedSets} hiệp hoàn tất
                </span>
              </div>

              <div className="col-span-2 pt-3 border-t border-zinc-800/80 flex flex-col gap-1.5">
                <span className="text-[12px] font-normal text-zinc-400 block">
                  Bài tập tiêu biểu
                </span>
                <div className="flex flex-col gap-1.5">
                  {session.exercises.slice(0, 3).map((ex) => {
                    const bestInfo = getSetsBestE1RM(ex.sets);
                    const best = bestInfo ? bestInfo.e1rm : 85;
                    return (
                      <div
                        key={ex.id}
                        className="flex items-center justify-between text-[13px]"
                      >
                        <span className="text-zinc-200 font-medium truncate pr-2">
                          {ex.sets.length}× {ex.name}
                        </span>
                        <span className="font-display tabular-nums text-emerald-400 font-semibold shrink-0">
                          1RM: {best} kg
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="sm:col-span-5 flex justify-center">
              <MuscleHeatmap
                volumeMap={
                  Object.keys(muscleVolumes).length > 0
                    ? muscleVolumes
                    : { chest: 8, front_delts: 5, triceps: 6 }
                }
              />
            </div>
          </div>

          {/* Open Story Flex Generator Modal Trigger */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
            <span className="text-[12px] font-normal text-zinc-400">
              Tạo ảnh dọc 9:16 khoe thành tích lên Story
            </span>

            <button
              type="button"
              onClick={() => setShowStoryModal(true)}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 text-[13px] font-semibold flex items-center gap-2 transition-all duration-200 ease-in-out hover:scale-[1.02] shadow-sm focus:outline-hidden focus:ring-2 focus:ring-zinc-500"
            >
              <Sparkles className="w-4 h-4 stroke-[1.5]" />
              <span>Tạo Story Flex 9:16</span>
            </button>
          </div>
        </div>

        {/* Post Customization Form */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="workout-caption"
              className="text-[13px] font-semibold text-zinc-200 block"
            >
              Cảm nghĩ sau buổi tập
            </label>
            <textarea
              id="workout-caption"
              rows={2}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Hôm nay mức tạ thế nào? Chia sẻ cùng hội anh em..."
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3.5 text-[14px] text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-zinc-500"
            />
          </div>

          {/* Photo & Video Attachment Section */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-zinc-200 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-400 stroke-[1.5]" />
                Hình ảnh / Video buổi tập
              </span>
              <span className="text-[11px] text-zinc-400">
                Đồng bộ lên Bảng tin & nền Story Flex
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <label className="min-h-[44px] px-4 py-2.5 rounded-xl bg-zinc-950/60 hover:bg-zinc-800/60 border border-zinc-800 text-zinc-200 text-[13px] font-semibold flex items-center gap-2 cursor-pointer transition-all duration-200 ease-in-out">
                <ImageIcon className="w-4 h-4 text-emerald-400 stroke-[1.5]" />
                <span>{mediaUploading ? 'Đang xử lý...' : 'Thêm Ảnh / Video'}</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaFileUpload}
                  className="hidden"
                />
              </label>

              {attachedMedia.length > 0 && (
                <span className="text-[12px] text-emerald-400 font-semibold">
                  Đã đính kèm {attachedMedia.length} file
                </span>
              )}
            </div>

            {mediaUploadError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-2 text-[12px] text-red-400">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 stroke-[1.5] shrink-0" />
                  <span>{mediaUploadError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMediaUploadError(null)}
                  className="text-zinc-400 hover:text-zinc-100 p-1"
                  aria-label="Đóng thông báo lỗi"
                >
                  <X className="w-3.5 h-3.5 stroke-[1.5]" />
                </button>
              </div>
            )}

            {attachedMedia.length > 0 && (
              <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pt-1">
                {attachedMedia.map((item, idx) => (
                  <div
                    key={`thumb-${idx}`}
                    className="relative w-20 h-20 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shrink-0"
                  >
                    {item.type === 'video' ? (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                        <Video className="w-6 h-6 text-emerald-400 stroke-[1.5]" />
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={item.fileName || 'thumb'}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-zinc-950/80 text-zinc-100 flex items-center justify-center"
                    >
                      <X className="w-3 h-3 stroke-[1.5]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Searchable Gym Check-in Selector */}
          <div className="flex flex-col gap-2 relative">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-semibold text-zinc-200 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400 stroke-[1.5]" />
                Điểm danh phòng tập (Check-in)
              </label>
              <span className="text-[11px] text-zinc-400">
                {GYM_VENUES.length} cơ sở toàn quốc
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsGymDropdownOpen((prev) => !prev)}
              className="w-full min-h-[48px] rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 px-3.5 py-2.5 text-left flex items-center justify-between gap-2 transition-all duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-zinc-500"
            >
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-emerald-400 stroke-[1.5] shrink-0" />
                <span className="text-[14px] text-zinc-100 font-medium truncate">
                  {selectedGymName}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-zinc-400 stroke-[1.5] shrink-0 transition-transform ${
                  isGymDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isGymDropdownOpen && (
              <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 flex flex-col gap-2.5 shadow-2xl">
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 stroke-[1.5] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={gymSearchQuery}
                    onChange={(e) => setGymSearchQuery(e.target.value)}
                    placeholder="Gõ tên phòng tập, quận hoặc thành phố..."
                    className="w-full min-h-[40px] pl-9 pr-8 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[13px] text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-hidden"
                  />
                  {gymSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setGymSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-100"
                    >
                      <X className="w-3.5 h-3.5 stroke-[1.5]" />
                    </button>
                  )}
                </div>

                <div className="max-h-52 overflow-y-auto flex flex-col gap-1 pr-1">
                  {filteredGyms.map((g) => {
                    const isSelected = g.name === selectedGymName;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          setSelectedGymName(g.name);
                          setIsGymDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ease-in-out flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-emerald-500/15 border border-emerald-500/40 text-zinc-100'
                            : 'hover:bg-zinc-900 text-zinc-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold truncate">
                            {g.name}
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate">
                            {g.city} • {g.address}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-emerald-400 stroke-[1.5] shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}

                  {gymSearchQuery.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGymName(gymSearchQuery.trim());
                        setIsGymDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-emerald-400 text-[12px] font-semibold flex items-center gap-2"
                    >
                      <MapPin className="w-3.5 h-3.5 stroke-[1.5] shrink-0" />
                      <span>Check-in địa điểm tự nhập: "{gymSearchQuery.trim()}"</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <div className="flex flex-col gap-0.5">
              <span className="text-[14px] font-semibold text-zinc-100 block">
                Cho phép sao chép giáo án (Fork)
              </span>
              <span className="text-[12px] text-zinc-400">
                Anh em trong CLB có thể lưu và tập theo lịch của bạn
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={shareToFeed}
              onClick={() => setShareToFeed(!shareToFeed)}
              className={`min-w-[48px] min-h-[28px] w-12 h-7 rounded-full p-1 transition-all duration-200 ease-in-out flex items-center ${
                shareToFeed
                  ? 'bg-emerald-500 justify-end'
                  : 'bg-zinc-800 justify-start'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-zinc-950 block shadow-xs" />
            </button>
          </div>
        </div>

        {/* Publish CTA */}
        <button
          onClick={handlePublish}
          className="w-full min-h-[52px] py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 font-semibold text-[16px] flex items-center justify-center gap-2 transition-all duration-200 ease-in-out hover:scale-[1.01] shadow-sm focus:outline-hidden focus:ring-2 focus:ring-zinc-500"
        >
          <Check className="w-5 h-5 stroke-[1.5]" />
          <span>Đăng lên Bảng Tin CLB</span>
        </button>
      </div>

      {/* 9:16 Social Flex Story Modal */}
      <FlexStoryModal
        isOpen={showStoryModal}
        onClose={() => setShowStoryModal(false)}
        userName={userName}
        userHandle={userHandle}
        gymLocation={`📍 ${selectedGymName}`}
        workoutTitle={session.title}
        totalVolumeKg={totalVolume}
        totalSets={completedSets}
        durationFormatted={formatDurationReadout(session.durationSeconds)}
        prBadgeText={
          topE1RM > 0
            ? `KỶ LỤC MỚI: ${topExerciseName.toUpperCase()} (${topE1RM}KG 1RM)`
            : 'HOÀN THÀNH 100% GIÁO ÁN HÔM NAY'
        }
        muscleSetCounts={muscleSetCounts}
        backgroundMedia={primaryStoryMedia}
        onUpdateBackgroundMedia={handleStoryBackgroundUpdate}
      />
    </div>
  );
};
