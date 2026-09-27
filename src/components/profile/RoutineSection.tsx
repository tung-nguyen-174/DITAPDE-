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
  lats: 'Xô',
  upper_back: 'Lưng trên',
  lower_back: 'Lưng dưới',
  abs: 'Bụng',
  quads: 'Đùi trước',
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
        ? mapStringToMuscleGroup(item.primaryMuscles[0])
        : 'chest';

      if (selectedMuscleCategory !== 'Tất cả') {
        if (selectedMuscleCategory === 'Ngực' && primaryGroup !== 'chest') return false;
        if (
          selectedMuscleCategory === 'Lưng' &&
          !['lats', 'upper_back', 'lower_back'].includes(primaryGroup)
        )
          return false;
        if (
          selectedMuscleCategory === 'Vai' &&
          !['front_delts', 'side_delts', 'rear_delts'].includes(primaryGroup)
        )
          return false;
        if (
          selectedMuscleCategory === 'Tay' &&
          !['biceps', 'triceps'].includes(primaryGroup)
        )
          return false;
        if (
          selectedMuscleCategory === 'Chân' &&
          !['quads', 'glutes', 'calves', 'hamstrings'].includes(primaryGroup)
        )
          return false;
        if (selectedMuscleCategory === 'Bụng' && primaryGroup !== 'abs') return false;
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
      ? mapStringToMuscleGroup(item.primaryMuscles[0])
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
    <section className="backdrop-blur-md bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
      {/* 1. Section Header & Primary CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-emerald-400 shrink-0">
            <BookOpen className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
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
          className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs sm:text-sm font-semibold shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-zinc-500 flex items-center gap-2 shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[1.5] shrink-0" />
          <span>Tạo lịch Custom</span>
        </button>
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex items-center gap-2 bg-zinc-950/70 p-1.5 rounded-xl border border-zinc-800 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setFilterTab('all')}
          className={`flex-1 min-h-[40px] py-2 px-4 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-zinc-500 ${
            filterTab === 'all'
              ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          <span>Tất cả ({routines.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('forked')}
          className={`flex-1 min-h-[40px] py-2 px-4 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-zinc-500 ${
            filterTab === 'forked'
              ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          <GitFork className="w-4 h-4 stroke-[1.5] shrink-0" />
          <span>Đã xin lịch ({forkedCount})</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterTab('custom')}
          className={`flex-1 min-h-[40px] py-2 px-4 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-zinc-500 ${
            filterTab === 'custom'
              ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-100'
          }`}
        >
          <Dumbbell className="w-4 h-4 stroke-[1.5] shrink-0" />
          <span>Tự tạo ({customCount})</span>
        </button>
      </div>

      {/* 3. Saved & Custom Routines List */}
      <div className="flex flex-col gap-5">
        {filteredRoutines.length === 0 ? (
          <div className="p-6 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col items-center text-center gap-4">
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
            <div className="flex flex-wrap items-center justify-center gap-2">
              {filterTab === 'forked' && onGoToFeed ? (
                <button
                  type="button"
                  onClick={onGoToFeed}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800/60 text-zinc-100 text-xs font-medium border border-zinc-800 transition-all duration-200 flex items-center gap-2"
                >
                  <GitFork className="w-4 h-4 text-emerald-400 stroke-[1.5]" />
                  <span>Qua Bảng tin Xin lịch</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(true)}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold transition-all duration-200 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 stroke-[1.5]" />
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
                className="p-6 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col gap-5"
              >
                {/* Top Unboxed Metadata Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-emerald-400 font-medium">
                      {isCustom ? 'Lịch tập Custom' : 'Đã lưu từ Xin lịch'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Nguồn: {routine.creatorName}</span>
                  </div>
                  <div className="flex items-center gap-2 font-display tabular-nums">
                    <span className="text-zinc-100 font-medium">
                      {routine.exercises.length} bài tập
                    </span>
                    <span aria-hidden="true">·</span>
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
                    className="min-w-[40px] min-h-[40px] px-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-all duration-200 flex items-center justify-center shrink-0"
                    aria-label={isExpanded ? 'Thu gọn chi tiết bài tập' : 'Xem chi tiết bài tập'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 stroke-[1.5]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 stroke-[1.5]" />
                    )}
                  </button>
                </div>

                {/* Exercises List inside Routine */}
                {isExpanded && (
                  <div className="flex flex-col divide-y divide-zinc-800/80 border-y border-zinc-800/80">
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
                            <span className="font-display font-semibold text-sm text-zinc-100 truncate">
                              {idx + 1}. {ex.name}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                              {ex.vietnameseName && ex.vietnameseName !== ex.name && (
                                <>
                                  <span className="truncate">{ex.vietnameseName}</span>
                                  <span aria-hidden="true">·</span>
                                </>
                              )}
                              <span className="text-emerald-400">{muscleLabel}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-display tabular-nums shrink-0">
                            <span className="text-zinc-100 font-semibold">
                              {ex.targetSets} hiệp × {ex.targetReps} lần
                            </span>
                            <span className="text-zinc-600" aria-hidden="true">·</span>
                            <span className="text-emerald-400">RPE {ex.targetRpe}</span>
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
                    className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs sm:text-sm font-semibold shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.01] active:scale-95 focus:outline-none focus:ring-2 focus:ring-zinc-500 flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <Play className="w-4 h-4 stroke-[1.5] shrink-0" />
                    <span>Tập theo lịch này</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteRoutine(routine.id)}
                    className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-zinc-900 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-zinc-800 transition-all duration-200 flex items-center justify-center shrink-0 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    title="Xóa lịch tập"
                    aria-label={`Xóa lịch tập ${routine.title}`}
                  >
                    <Trash2 className="w-4 h-4 stroke-[1.5]" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Custom Routine Builder Modal */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="w-full max-w-2xl backdrop-blur-md bg-zinc-900/95 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-2xl max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <Dumbbell className="w-5 h-5 text-emerald-400 stroke-[1.5] shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-display font-bold tracking-tight text-lg text-zinc-100 truncate">
                    Tạo lịch tập Custom
                  </h4>
                  <p className="text-xs text-zinc-400 font-display tabular-nums">
                    Chọn bài tập từ kho {ALL_RAW_EXERCISES.length} bài tập chuẩn trong App
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBuilderOpen(false)}
                className="min-w-[40px] min-h-[40px] w-10 h-10 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 flex items-center justify-center transition-all duration-200 shrink-0 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                aria-label="Đóng trình tạo lịch tập"
              >
                <X className="w-5 h-5 stroke-[1.5]" />
              </button>
            </div>

            {/* Scrollable Body */}
            <form
              onSubmit={handleSaveCustomRoutine}
              className="flex-1 min-h-0 overflow-y-auto p-6 flex flex-col gap-6"
            >
              {/* Step 1: Routine Name */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-100">
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
                  className="w-full min-h-[44px] bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 transition-all duration-200"
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
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800/60 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-100 transition-all duration-200 whitespace-nowrap shrink-0"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Currently Selected Exercises */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-zinc-100">
                    02. Danh sách bài tập đã chọn ({selectedExercises.length})
                  </span>
                  <span className="text-xs text-zinc-400">
                    Chỉnh số hiệp, số lần lặp & RPE mục tiêu
                  </span>
                </div>

                {selectedExercises.length === 0 ? (
                  <div className="p-5 rounded-xl bg-zinc-950/60 border border-zinc-800 text-center text-xs text-zinc-400">
                    Chưa có bài tập nào. Hãy bấm chọn từ Kho bài tập bên dưới!
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {selectedExercises.map((ex, idx) => (
                      <div
                        key={`${ex.name}-${idx}`}
                        className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col gap-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="font-display font-bold tracking-tight text-sm text-zinc-100 block truncate">
                              {idx + 1}. {ex.name}
                            </span>
                            {ex.vietnameseName && ex.vietnameseName !== ex.name && (
                              <span className="text-xs text-zinc-400 block truncate">
                                {ex.vietnameseName}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSelectedExercise(idx)}
                            className="min-w-[36px] min-h-[36px] rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-all duration-200 shrink-0"
                            aria-label={`Xóa ${ex.name}`}
                          >
                            <Trash2 className="w-4 h-4 stroke-[1.5]" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-zinc-400">Số hiệp (Sets)</label>
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
                              className="w-full min-h-[40px] bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm font-display tabular-nums text-center text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-zinc-400">Số lần (Reps)</label>
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
                              className="w-full min-h-[40px] bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm font-display tabular-nums text-center text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-zinc-400">Mức RPE</label>
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
                              className="w-full min-h-[40px] bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm font-display tabular-nums text-center text-emerald-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 3: Pull Exercises from App Catalog */}
              <div className="flex flex-col gap-3 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-zinc-100">
                    03. Kho bài tập trong App ({ALL_RAW_EXERCISES.length} bài tập)
                  </span>
                  <span className="text-xs text-zinc-400">
                    Chạm để thêm hoặc bỏ chọn
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-400 stroke-[1.5] absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    placeholder="Tìm tên bài tập tiếng Việt / tiếng Anh (vd: Đẩy ngực, Squat, Deadlift)..."
                    className="w-full min-h-[44px] bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-10 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 transition-all duration-200"
                  />
                  {exerciseSearch && (
                    <button
                      type="button"
                      onClick={() => setExerciseSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-zinc-100"
                    >
                      <X className="w-4 h-4 stroke-[1.5]" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {MUSCLE_FILTER_CHIPS.map((cat) => {
                    const isSelected = selectedMuscleCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedMuscleCategory(cat)}
                        className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                          isSelected
                            ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                            : 'bg-zinc-950 text-zinc-400 hover:text-zinc-100 border border-zinc-800'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>

                <div className="max-h-64 overflow-y-auto flex flex-col gap-2 pr-1">
                  {catalogExercises.length === 0 ? (
                    <div className="py-8 text-center text-xs text-zinc-400">
                      Không tìm thấy bài tập phù hợp với từ khóa "{exerciseSearch}".
                    </div>
                  ) : (
                    catalogExercises.map((item, idx) => {
                      const primaryGroup = item.primaryMuscles?.[0]
                        ? mapStringToMuscleGroup(item.primaryMuscles[0])
                        : 'chest';
                      const muscleVn = MUSCLE_VN_LABELS[primaryGroup] || primaryGroup;
                      const eq = item.equipment || 'bodyweight';
                      const isAdded = selectedExercises.some(
                        (ex) => ex.name.toLowerCase() === item.name.toLowerCase()
                      );

                      return (
                        <button
                          key={`${item.name}-${idx}`}
                          type="button"
                          onClick={() => handleAddExerciseFromCatalog(item)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                            isAdded
                              ? 'bg-emerald-500/10 border-emerald-500/40'
                              : 'bg-zinc-950/60 hover:bg-zinc-800/60 border-zinc-800'
                          }`}
                        >
                          <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                            <span className="font-display font-semibold text-sm text-zinc-100 truncate">
                              {item.name}
                            </span>
                            {item.nameVn && item.nameVn !== item.name && (
                              <span className="text-xs text-zinc-400 truncate">
                                {item.nameVn}
                              </span>
                            )}
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                              <span className="text-emerald-400">{muscleVn}</span>
                              <span aria-hidden="true">·</span>
                              <span>{eq}</span>
                            </div>
                          </div>

                          <div
                            className={`min-h-[38px] px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold shrink-0 transition-all duration-200 ${
                              isAdded
                                ? 'bg-emerald-500 text-zinc-950'
                                : 'bg-zinc-900 text-zinc-100 border border-zinc-800'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-4 h-4 stroke-[1.5]" />
                                <span>Đã chọn</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 stroke-[1.5]" />
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

              {builderError && (
                <div className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                  {builderError}
                </div>
              )}

              {/* Modal Sticky Footer */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-100 text-xs font-medium border border-zinc-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold shadow-sm transition-all duration-200 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                  <Save className="w-4 h-4 stroke-[1.5]" />
                  <span>Lưu Lịch Tập Custom ({selectedExercises.length} bài)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
