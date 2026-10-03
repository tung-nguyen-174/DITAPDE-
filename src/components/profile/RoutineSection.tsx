import React, { useState, useMemo } from 'react';
import {
  Dumbbell,
  GitFork,
  Plus,
  Play,
  Trash2,
  Search,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Save,
  BookOpen,
} from 'lucide-react';
import {
  RoutineModel,
  RoutineExerciseModel,
} from '../../services/routineForkService';
import {
  ALL_RAW_EXERCISES,
  mapStringToMuscleGroup,
  matchesMuscleCategoryFilter,
  RawExerciseItem,
} from '../../services/exerciseImporter';
import { MuscleGroup } from '../../types/gym';

interface RoutineSectionProps {
  routines: RoutineModel[];
  currentUserName: string;
  onCreateCustomRoutine: (title: string, exercises: RoutineExerciseModel[]) => void;
  onDeleteRoutine: (routineId: string) => void;
  onStartWorkoutWithRoutine: (routine: RoutineModel) => void;
  onGoToFeed?: () => void;
}

const MUSCLE_FILTER_CHIPS = [
  'Tất cả',
  'Ngực',
  'Lưng',
  'Vai',
  'Tay',
  'Chân',
  'Bụng',
] as const;

const MUSCLE_VN_LABELS: Record<MuscleGroup, string> = {
  chest: 'Ngực',
  front_delts: 'Vai trước',
  side_delts: 'Vai giữa',
  rear_delts: 'Vai sau',
  triceps: 'Tay sau',
  biceps: 'Tay trước',
  forearms: 'Cẳng tay',
  lats: 'Xô',
  traps: 'Cầu vai',
  upper_back: 'Lưng trên',
  lower_back: 'Lưng dưới',
  neck: 'Cổ',
  abs: 'Bụng',
  quads: 'Đùi trước',
  adductors: 'Đùi trong',
  abductors: 'Đùi trong & Hông',
  hamstrings: 'Đùi sau',
  glutes: 'Mông',
  calves: 'Bắp chân',
};

const QUICK_ROUTINE_NAME_SUGGESTIONS = [
  'Push Day - Ngực Vai Tay Sau',
  'Pull Day - Lưng Xô Tay Trước',
  'Leg Day - Chân Mông Toàn Diện',
  'Upper Body Hypertrophy',
];

export const RoutineSection: React.FC<RoutineSectionProps> = ({
  routines,
  onCreateCustomRoutine,
  onDeleteRoutine,
  onStartWorkoutWithRoutine,
  onGoToFeed,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'forked' | 'custom'>('all');
  const [expandedRoutineIds, setExpandedRoutineIds] = useState<Record<string, boolean>>({});
  const [isBuilderOpen, setIsBuilderOpen] = useState<boolean>(false);

  const [customTitle, setCustomTitle] = useState<string>('');
  const [selectedExercises, setSelectedExercises] = useState<RoutineExerciseModel[]>([
    {
      name: 'Barbell Bench Press',
      vietnameseName: 'Đẩy ngực ngang đòn tạ',
      primaryMuscle: 'chest',
      equipment: 'barbell',
      targetSets: 4,
      targetReps: 8,
      targetRpe: 8.5,
    },
  ]);
  const [exerciseSearch, setExerciseSearch] = useState<string>('');
  const [selectedMuscleCategory, setSelectedMuscleCategory] = useState<string>('Tất cả');
  const [builderError, setBuilderError] = useState<string | null>(null);

  const forkedCount = useMemo(
    () => routines.filter((r) => !r.isCustom && r.id.startsWith('fork_')).length,
    [routines]
  );
  const customCount = useMemo(
    () => routines.filter((r) => r.isCustom || r.id.startsWith('custom_')).length,
    [routines]
  );

  const filteredRoutines = useMemo(() => {
    if (filterTab === 'forked') {
      return routines.filter((r) => !r.isCustom && r.id.startsWith('fork_'));
    }
    if (filterTab === 'custom') {
      return routines.filter((r) => r.isCustom || r.id.startsWith('custom_'));
    }
    return routines;
  }, [routines, filterTab]);

  const catalogExercises = useMemo(() => {
    return ALL_RAW_EXERCISES.filter((item) => {
      const primaryGroup = item.primaryMuscles?.[0]
        ? mapStringToMuscleGroup(item.primaryMuscles[0], item.name)
        : 'chest';

      if (!matchesMuscleCategoryFilter(primaryGroup, selectedMuscleCategory)) {
        return false;
      }

      if (exerciseSearch.trim()) {
        const q = exerciseSearch.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchVn = item.nameVn && item.nameVn.toLowerCase().includes(q);
        const matchEq = item.equipment && item.equipment.toLowerCase().includes(q);
        if (!matchName && !matchVn && !matchEq) return false;
      }

      return true;
    }).slice(0, 60);
  }, [exerciseSearch, selectedMuscleCategory]);

  const toggleExpandRoutine = (id: string) => {
    setExpandedRoutineIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleAddExerciseFromCatalog = (item: RawExerciseItem) => {
    const primaryMuscle = item.primaryMuscles?.[0]
      ? mapStringToMuscleGroup(item.primaryMuscles[0], item.name)
      : 'chest';

    const alreadyExists = selectedExercises.some(
      (ex) => ex.name.toLowerCase() === item.name.toLowerCase()
    );
    if (alreadyExists) {
      setSelectedExercises((prev) =>
        prev.filter((ex) => ex.name.toLowerCase() !== item.name.toLowerCase())
      );
      return;
    }

    const newExercise: RoutineExerciseModel = {
      name: item.name,
      vietnameseName: item.nameVn || item.name,
      primaryMuscle,
      equipment: item.equipment || 'barbell',
      targetSets: 3,
      targetReps: 10,
      targetRpe: 8,
    };

    setSelectedExercises((prev) => [...prev, newExercise]);
    setBuilderError(null);
  };

  const handleUpdateExerciseMetric = (
    idx: number,
    field: 'targetSets' | 'targetReps' | 'targetRpe',
    value: number
  ) => {
    setSelectedExercises((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        if (field === 'targetSets') {
          return { ...item, targetSets: Math.max(1, Math.min(12, value)) };
        }
        if (field === 'targetReps') {
          return { ...item, targetReps: Math.max(1, Math.min(50, value)) };
        }
        return {
          ...item,
          targetRpe: Math.max(5, Math.min(10, Number(value.toFixed(1)))),
        };
      })
    );
  };

  const handleRemoveSelectedExercise = (idx: number) => {
    setSelectedExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveCustomRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = customTitle.trim();
    if (!trimmedTitle) {
      setBuilderError('Vui lòng nhập tên cho Lịch tập Custom của bạn.');
      return;
    }
    if (selectedExercises.length === 0) {
      setBuilderError('Vui lòng chọn ít nhất 1 bài tập từ kho bài tập.');
      return;
    }

    onCreateCustomRoutine(trimmedTitle, selectedExercises);
    setCustomTitle('');
    setBuilderError(null);
    setIsBuilderOpen(false);
    setFilterTab('all');
  };

  return (
    <section className="apple-card p-6 flex flex-col gap-6">
      {/* 1. Section Header & Primary CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="apple-icon-badge-accent">
            <BookOpen className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <h3 className="font-display font-bold tracking-tight text-lg text-zinc-100">
              Lịch tập ({routines.length})
            </h3>
            <p className="text-xs text-zinc-400">
              Lịch tập đã lưu từ "Xin lịch" và giáo án tự tạo từ kho {ALL_RAW_EXERCISES.length} bài tập
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setBuilderError(null);
            setIsBuilderOpen(true);
          }}
          className="apple-btn-accent min-h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold gap-2 shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[1.75] shrink-0" />
          <span>Tạo lịch Custom</span>
        </button>
      </div>

      {/* 2. Filter Tabs (Apple Segmented Control) */}
      <div className="apple-segmented-control w-full overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setFilterTab('all')}
          className={`flex-1 min-h-[38px] py-1.5 px-4 rounded-xl text-xs font-semibold transition-all duration-200 ease-out flex items-center justify-center gap-2 whitespace-nowrap active:scale-[0.98] ${
            filterTab === 'all'
              ? 'bg-white/15 text-white shadow-xs border border-white/10'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <span>Tất cả ({routines.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('forked')}
          className={`flex-1 min-h-[38px] py-1.5 px-4 rounded-xl text-xs font-semibold transition-all duration-200 ease-out flex items-center justify-center gap-2 whitespace-nowrap active:scale-[0.98] ${
            filterTab === 'forked'
              ? 'bg-white/15 text-white shadow-xs border border-white/10'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <GitFork className="w-3.5 h-3.5 stroke-[1.75] shrink-0" />
          <span>Đã xin lịch ({forkedCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('custom')}
          className={`flex-1 min-h-[38px] py-1.5 px-4 rounded-xl text-xs font-semibold transition-all duration-200 ease-out flex items-center justify-center gap-2 whitespace-nowrap active:scale-[0.98] ${
            filterTab === 'custom'
              ? 'bg-white/15 text-white shadow-xs border border-white/10'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5 stroke-[1.75] shrink-0" />
          <span>Tự tạo ({customCount})</span>
        </button>
      </div>

      {/* 3. Saved & Custom Routines List */}
      <div className="flex flex-col gap-4">
        {filteredRoutines.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col items-center text-center gap-3">
            <p className="font-display font-bold tracking-tight text-sm text-zinc-100">
              {filterTab === 'forked'
                ? 'Chưa có lịch tập nào được lưu từ "Xin lịch"'
                : filterTab === 'custom'
                ? 'Bạn chưa tạo lịch tập Custom nào'
                : 'Chưa có lịch tập nào trong danh sách'}
            </p>
            <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
              {filterTab === 'forked'
                ? 'Hãy bấm nút "Xin lịch" trên các bài đăng ở Bảng tin hoặc mục Khám phá để sao chép giáo án về máy chỉ với 1 chạm.'
                : 'Tự thiết kế lịch tập riêng bằng cách chọn bài tập từ kho dữ liệu chuẩn của ứng dụng.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {filterTab === 'forked' && onGoToFeed ? (
                <button
                  type="button"
                  onClick={onGoToFeed}
                  className="apple-btn-secondary min-h-[42px] px-4 py-2 text-xs font-semibold gap-2"
                >
                  <GitFork className="w-4 h-4 text-[#E4483C] stroke-[1.75]" />
                  <span>Qua Bảng tin Xin lịch</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(true)}
                  className="apple-btn-accent min-h-[42px] px-4 py-2 text-xs font-semibold gap-2"
                >
                  <Plus className="w-4 h-4 stroke-[1.75]" />
                  <span>Tạo lịch tập Custom ngay</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredRoutines.map((routine) => {
            const isCustom = Boolean(routine.isCustom || routine.id.startsWith('custom_'));
            const totalSets = routine.exercises.reduce((sum, ex) => sum + (ex.targetSets || 3), 0);
            const isExpanded = expandedRoutineIds[routine.id] ?? true;

            return (
              <div
                key={routine.id}
                className="p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-4 hover:border-white/15 transition-all duration-200"
              >
                {/* Top Unboxed Metadata Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 font-medium">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#E4483C] font-semibold">
                      {isCustom ? 'Lịch tập Custom' : 'Đã lưu từ Xin lịch'}
                    </span>
                    <span aria-hidden="true" className="text-zinc-600">·</span>
                    <span>Nguồn: {routine.creatorName}</span>
                  </div>
                  <div className="flex items-center gap-2 font-display tabular-nums">
                    <span className="text-zinc-200">
                      {routine.exercises.length} bài tập
                    </span>
                    <span aria-hidden="true" className="text-zinc-600">·</span>
                    <span>{totalSets} hiệp</span>
                  </div>
                </div>

                {/* Routine Title & Expand Toggle */}
                <div className="flex items-start justify-between gap-4">
                  <h4 className="font-display font-bold tracking-tight text-base text-zinc-100 leading-snug">
                    {routine.title}
                  </h4>
                  <button
                    type="button"
                    onClick={() => toggleExpandRoutine(routine.id)}
                    className="w-9 h-9 rounded-xl text-zinc-400 hover:text-zinc-100 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all duration-200 flex items-center justify-center shrink-0 active:scale-[0.96]"
                    aria-label={isExpanded ? 'Thu gọn chi tiết bài tập' : 'Xem chi tiết bài tập'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 stroke-[1.75]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 stroke-[1.75]" />
                    )}
                  </button>
                </div>

                {/* Exercises List inside Routine */}
                {isExpanded && (
                  <div className="flex flex-col divide-y divide-white/[0.06] border-y border-white/[0.06]">
                    {routine.exercises.map((ex, idx) => {
                      const muscleLabel = ex.primaryMuscle
                        ? MUSCLE_VN_LABELS[ex.primaryMuscle] || ex.primaryMuscle
                        : 'Toàn thân';
                      return (
                        <div
                          key={`${routine.id}-ex-${idx}`}
                          className="py-3 flex flex-wrap items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                            <span className="font-display font-semibold text-sm text-zinc-100 truncate tracking-tight">
                              {idx + 1}. {ex.name}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                              {ex.vietnameseName && ex.vietnameseName !== ex.name && (
                                <>
                                  <span className="truncate">{ex.vietnameseName}</span>
                                  <span aria-hidden="true" className="text-zinc-600">·</span>
                                </>
                              )}
                              <span className="text-[#E4483C]">{muscleLabel}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-display tabular-nums shrink-0">
                            <span className="text-zinc-200 font-semibold">
                              {ex.targetSets} hiệp × {ex.targetReps} lần
                            </span>
                            <span className="text-zinc-600" aria-hidden="true">·</span>
                            <span className="text-[#E0B93D]">RPE {ex.targetRpe}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => onStartWorkoutWithRoutine(routine)}
                    className="flex-1 apple-btn-accent min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold gap-2 whitespace-nowrap"
                  >
                    <Play className="w-4 h-4 stroke-[1.75] shrink-0 fill-current" />
                    <span>Tập theo lịch này</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteRoutine(routine.id)}
                    className="w-11 h-11 rounded-2xl bg-white/[0.04] hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-white/10 transition-all duration-200 flex items-center justify-center shrink-0 active:scale-[0.96]"
                    title="Xóa lịch tập"
                    aria-label={`Xóa lịch tập ${routine.title}`}
                  >
                    <Trash2 className="w-4 h-4 stroke-[1.75]" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Custom Routine Builder Modal */}
      {isBuilderOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={() => setIsBuilderOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[88dvh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3 shrink-0 bg-white/[0.02]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="apple-icon-badge-accent">
                  <Dumbbell className="w-4 h-4 stroke-[1.75]" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-display font-bold tracking-tight text-base sm:text-lg text-zinc-100 truncate">
                    Tạo lịch tập Custom
                  </h4>
                  <p className="text-[11px] sm:text-xs text-zinc-400 font-display tabular-nums truncate">
                    Kho {ALL_RAW_EXERCISES.length} bài tập chuẩn · Đã chọn {selectedExercises.length} bài
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBuilderOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-all duration-200 active:scale-[0.96] shrink-0"
                aria-label="Đóng trình tạo lịch tập"
              >
                <X className="w-4 h-4 stroke-[1.75]" />
              </button>
            </div>

            {/* Form with Scrollable Content + Pinned Bottom Submit Bar */}
            <form
              onSubmit={handleSaveCustomRoutine}
              className="flex-1 min-h-0 flex flex-col overflow-hidden"
            >
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 flex flex-col gap-5">
                {/* Step 1: Routine Name */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-zinc-200">
                    01. Tên lịch tập Custom
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => {
                      setCustomTitle(e.target.value);
                      if (builderError) setBuilderError(null);
                    }}
                    placeholder="Ví dụ: Lịch Push Ngực & Vai Cường Độ Cao..."
                    className="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-2xl px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#E4483C] transition-colors"
                  />
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                    {QUICK_ROUTINE_NAME_SUGGESTIONS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setCustomTitle(preset);
                          setBuilderError(null);
                        }}
                        className="min-h-[34px] px-3.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-zinc-400 hover:text-zinc-200 transition-all duration-200 whitespace-nowrap shrink-0 active:scale-[0.98]"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Currently Selected Exercises */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-zinc-200">
                      02. Bài tập đã chọn ({selectedExercises.length})
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Chỉnh Sets · Reps · RPE
                    </span>
                  </div>

                  {selectedExercises.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center text-xs text-zinc-400">
                      Chưa có bài tập nào. Hãy chạm vào bài tập bên dưới để thêm!
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {selectedExercises.map((ex, idx) => (
                        <div
                          key={`${ex.name}-${idx}`}
                          className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-display font-bold tracking-tight text-xs sm:text-sm text-zinc-100 block truncate">
                                {idx + 1}. {ex.name}
                              </span>
                              {ex.vietnameseName && ex.vietnameseName !== ex.name && (
                                <span className="text-[11px] text-zinc-400 block truncate">
                                  {ex.vietnameseName}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSelectedExercise(idx)}
                              className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-white/10 flex items-center justify-center transition-all duration-200 active:scale-[0.96] shrink-0"
                              aria-label={`Xóa ${ex.name}`}
                            >
                              <Trash2 className="w-4 h-4 stroke-[1.75]" />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[11px] text-zinc-400 truncate">Hiệp (Sets)</label>
                              <input
                                type="number"
                                min={1}
                                max={12}
                                value={ex.targetSets}
                                onChange={(e) =>
                                  handleUpdateExerciseMetric(
                                    idx,
                                    'targetSets',
                                    parseInt(e.target.value, 10) || 1
                                  )
                                }
                                className="w-full min-h-[38px] bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-xs sm:text-sm font-display tabular-nums text-center text-zinc-100 focus:outline-none focus:border-[#E4483C]"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[11px] text-zinc-400 truncate">Lần (Reps)</label>
                              <input
                                type="number"
                                min={1}
                                max={50}
                                value={ex.targetReps}
                                onChange={(e) =>
                                  handleUpdateExerciseMetric(
                                    idx,
                                    'targetReps',
                                    parseInt(e.target.value, 10) || 1
                                  )
                                }
                                className="w-full min-h-[38px] bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-xs sm:text-sm font-display tabular-nums text-center text-zinc-100 focus:outline-none focus:border-[#E4483C]"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[11px] text-zinc-400 truncate">Mức RPE</label>
                              <input
                                type="number"
                                step="0.5"
                                min={5}
                                max={10}
                                value={ex.targetRpe}
                                onChange={(e) =>
                                  handleUpdateExerciseMetric(
                                    idx,
                                    'targetRpe',
                                    parseFloat(e.target.value) || 8
                                  )
                                }
                                className="w-full min-h-[38px] bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-xs sm:text-sm font-display tabular-nums text-center text-[#E0B93D] focus:outline-none focus:border-[#E4483C]"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Step 3: Pull Exercises from App Catalog */}
                <div className="flex flex-col gap-2.5 pt-3 border-t border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-zinc-200">
                      03. Chọn thêm từ Kho bài tập ({ALL_RAW_EXERCISES.length} bài)
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Chạm để thêm / bỏ chọn
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-400 stroke-[1.75] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={exerciseSearch}
                      onChange={(e) => setExerciseSearch(e.target.value)}
                      placeholder="Tìm bài tập (vd: Đẩy ngực, Squat, Deadlift)..."
                      className="w-full min-h-[44px] bg-black/40 border border-white/10 rounded-2xl pl-10 pr-9 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#E4483C] transition-colors"
                    />
                    {exerciseSearch && (
                      <button
                        type="button"
                        onClick={() => setExerciseSearch('')}
                        className="w-7 h-7 rounded-lg bg-white/10 border border-white/10 absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-all duration-200 active:scale-[0.96]"
                        title="Xóa tìm kiếm"
                      >
                        <X className="w-3.5 h-3.5 stroke-[1.75]" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {MUSCLE_FILTER_CHIPS.map((cat) => {
                      const isSelected = selectedMuscleCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedMuscleCategory(cat)}
                          className={`min-h-[34px] px-3.5 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 shrink-0 active:scale-[0.98] ${
                            isSelected
                              ? 'bg-white text-zinc-950 font-semibold shadow-xs'
                              : 'bg-white/[0.04] text-zinc-400 hover:text-zinc-200 border border-white/10'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>

                  <div className="max-h-52 sm:max-h-60 overflow-y-auto overscroll-contain flex flex-col gap-2 pr-1">
                    {catalogExercises.length === 0 ? (
                      <div className="py-6 text-center text-xs text-zinc-400">
                        Không tìm thấy bài tập phù hợp với từ khóa "{exerciseSearch}".
                      </div>
                    ) : (
                      catalogExercises.map((item, idx) => {
                        const rawPrimary = item.primaryMuscles?.[0];
                        const primaryGroup = rawPrimary
                          ? mapStringToMuscleGroup(rawPrimary, item.name)
                          : 'chest';
                        const muscleVn =
                          rawPrimary && rawPrimary.toLowerCase().trim() === 'middle chest'
                            ? 'Ngực giữa (Middle Chest)'
                            : MUSCLE_VN_LABELS[primaryGroup] || primaryGroup;
                        const eq = item.equipment || 'bodyweight';
                        const isAdded = selectedExercises.some(
                          (ex) => ex.name.toLowerCase() === item.name.toLowerCase()
                        );

                        return (
                          <button
                            key={`${item.name}-${idx}`}
                            type="button"
                            onClick={() => handleAddExerciseFromCatalog(item)}
                            className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 active:scale-[0.99] ${
                              isAdded
                                ? 'bg-[#E4483C]/10 border-[#E4483C]/40'
                                : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.06]'
                            }`}
                          >
                            <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                              <span className="font-display font-semibold text-xs sm:text-sm text-zinc-100 truncate tracking-tight">
                                {item.name}
                              </span>
                              {item.nameVn && item.nameVn !== item.name && (
                                <span className="text-[11px] text-zinc-400 truncate">
                                  {item.nameVn}
                                </span>
                              )}
                              <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                                <span className="text-[#E4483C]">{muscleVn}</span>
                                <span aria-hidden="true">·</span>
                                <span className="truncate">{eq}</span>
                              </div>
                            </div>

                            <div
                              className={`min-h-[34px] px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold shrink-0 transition-all duration-200 ${
                                isAdded
                                  ? 'bg-[#E4483C] text-white shadow-xs'
                                  : 'bg-white/10 text-zinc-200 border border-white/10'
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[1.75]" />
                                  <span>Đã chọn</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5 stroke-[1.75]" />
                                  <span>Thêm</span>
                                </>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Error Banner + Pinned Bottom Submit Bar (Always visible on mobile & desktop) */}
              <div className="p-4 sm:px-6 sm:py-4 border-t border-white/10 bg-zinc-950/95 backdrop-blur-md flex flex-col gap-2.5 shrink-0">
                {builderError && (
                  <div className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                    {builderError}
                  </div>
                )}
                <div className="flex items-center justify-between sm:justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsBuilderOpen(false)}
                    className="apple-btn-secondary min-h-[44px] px-4 py-2 text-xs sm:text-sm font-medium shrink-0"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-initial apple-btn-accent min-h-[44px] px-5 py-2.5 text-xs sm:text-sm font-semibold gap-2"
                  >
                    <Save className="w-4 h-4 stroke-[1.75] shrink-0" />
                    <span className="truncate">
                      Lưu Lịch Tập Custom ({selectedExercises.length} bài)
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
