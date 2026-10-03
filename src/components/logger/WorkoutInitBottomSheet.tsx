import React from 'react';
import {
  Dumbbell,
  Plus,
  X,
  Play,
  BookmarkCheck,
  Clock,
  Sparkles,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { RoutineModel } from '../../services/routineForkService';
import { WorkoutSession } from '../../types/gym';

interface WorkoutInitBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  savedRoutines: RoutineModel[];
  onSelectRoutine: (routine: RoutineModel) => void;
  onSelectBlankSession: () => void;
  draftSession?: WorkoutSession | null;
  onResumeDraftSession?: () => void;
}

export const WorkoutInitBottomSheet: React.FC<WorkoutInitBottomSheetProps> = ({
  isOpen,
  onClose,
  savedRoutines,
  onSelectRoutine,
  onSelectBlankSession,
  draftSession,
  onResumeDraftSession,
}) => {
  if (!isOpen) return null;

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="workout-init-sheet-title"
    >
      <div
        className="w-full max-w-3xl mx-auto bg-zinc-950/95 backdrop-blur-2xl border-t border-x border-white/10 rounded-t-3xl max-h-[86dvh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle Affordance */}
        <div className="w-10 h-1.5 bg-white/20 rounded-full mx-auto mt-3 mb-1 shrink-0" />

        {/* Sheet Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="apple-icon-badge-accent shrink-0">
              <Dumbbell className="w-5 h-5 stroke-[1.75]" />
            </div>
            <div className="min-w-0">
              <h3
                id="workout-init-sheet-title"
                className="font-display font-bold text-lg text-zinc-100 leading-tight tracking-tight truncate"
              >
                Khởi tạo buổi tập mới
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">
                Chọn mẫu bài tập đã lưu hoặc tạo buổi tập trống · Lưu tự động Isar Cache
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ khởi tạo buổi tập"
            className="w-10 h-10 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-all duration-200 ease-out active:scale-[0.96] shrink-0"
          >
            <X className="w-5 h-5 stroke-[1.75]" />
          </button>
        </div>

        {/* Scrollable Sheet Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-6 flex-1">
          {/* Optional Resume Draft Quick Card if a draft exists */}
          {draftSession && onResumeDraftSession && (
            <div className="apple-card p-4 border border-amber-500/40 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <RotateCcw className="w-5 h-5 stroke-[1.75]" />
                </div>
                <div className="min-w-0 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
                    <span>Phát hiện tệp nháp (Draft Session)</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-display tabular-nums">
                      {formatTimer(draftSession.durationSeconds)}
                    </span>
                  </div>
                  <p className="font-display font-bold text-sm sm:text-base text-zinc-100 truncate">
                    {draftSession.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onResumeDraftSession();
                }}
                className="apple-btn-primary min-h-[40px] px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shrink-0 whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Tiếp tục bản nháp</span>
              </button>
            </div>
          )}

          {/* Scenario 2: Blank Session ("Tạo buổi tập trống") */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
              <span>Khởi tạo nhanh (Blank Slate)</span>
              <span>Bắt đầu từ 00:00:00</span>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectBlankSession();
              }}
              className="apple-card w-full min-h-[68px] p-4 flex items-center justify-between gap-4 text-left group hover:border-[#E4483C]/60"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="apple-icon-badge-accent w-11 h-11 group-hover:scale-105 transition-transform shrink-0">
                  <Plus className="w-5 h-5 stroke-[2]" />
                </div>
                <div className="min-w-0 flex flex-col gap-0.5">
                  <span className="font-display font-bold text-base text-zinc-100 group-hover:text-[#E4483C] transition-colors truncate">
                    Tạo buổi tập trống
                  </span>
                  <span className="text-xs text-zinc-400 truncate">
                    Blank Session · Mở màn hình &ldquo;Đang Tập&rdquo; với danh sách bài tập rỗng
                  </span>
                </div>
              </div>

              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 group-hover:bg-[#E4483C] text-zinc-400 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                <ChevronRight className="w-4 h-4 stroke-[1.75]" />
              </div>
            </button>
          </div>

          {/* Scenario 1: Saved / Forked Routines ("Khởi tạo buổi tập từ một mẫu bài tập có sẵn") */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <BookmarkCheck className="w-4 h-4 text-[#E4483C] stroke-[1.75]" />
                <span>Mẫu bài tập đã lưu (Saved / Forked Routines)</span>
              </div>
              <span className="text-xs text-zinc-400 font-display tabular-nums">
                {savedRoutines.length} lịch tập
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {savedRoutines.map((routine) => {
                const totalSetsCount = routine.exercises.reduce(
                  (sum, ex) => sum + (ex.targetSets || 3),
                  0
                );
                const isPushDayFeatured = routine.title
                  .toLowerCase()
                  .includes('push day - ngực vai tay sau');

                return (
                  <button
                    key={routine.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectRoutine(routine);
                    }}
                    className={`apple-card w-full p-4 sm:p-5 text-left flex flex-col gap-3.5 group ${
                      isPushDayFeatured
                        ? 'border-[#E4483C]/40 hover:border-[#E4483C]'
                        : 'hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 w-full">
                      <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                        <div className="flex items-center flex-wrap gap-2 text-xs text-zinc-400">
                          <span className="text-emerald-400 font-medium">
                            Đã lưu trong bộ nhớ
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>Tác giả: {routine.creatorName}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-display tabular-nums text-zinc-300">
                            {routine.exercises.length} bài tập ({totalSetsCount} Sets)
                          </span>
                        </div>

                        <h4 className="font-display font-bold text-base text-zinc-100 group-hover:text-[#E4483C] transition-colors leading-snug">
                          {routine.title}
                        </h4>
                      </div>

                      <div className="apple-btn-primary min-h-[40px] px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 shrink-0">
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Tập ngay</span>
                      </div>
                    </div>

                    {/* Exercise Preview List */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400 pt-2.5 border-t border-white/5">
                      {routine.exercises.map((ex, idx) => (
                        <React.Fragment key={`${routine.id}-ex-${idx}`}>
                          {idx > 0 && <span aria-hidden="true" className="text-zinc-600">·</span>}
                          <span className="text-zinc-300">
                            {ex.name}{' '}
                            <strong className="font-display tabular-nums text-zinc-500 font-normal">
                              ({ex.targetSets}×{ex.targetReps})
                            </strong>
                          </span>
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Pre-filled Previous Stats Notice */}
                    <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1.5 text-[#3E8EDE]">
                        <Sparkles className="w-3.5 h-3.5 stroke-[1.75] shrink-0" />
                        <span>Tự động điền sẵn số Set, mức tạ (Kg) &amp; Reps của buổi tập trước</span>
                      </span>
                      <span className="font-display tabular-nums flex items-center gap-1 text-[#E4483C] shrink-0">
                        <Clock className="w-3 h-3 stroke-[1.75]" />
                        <span>00:00:00</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
