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
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="workout-init-sheet-title"
    >
      <div
        className="w-full max-w-3xl mx-auto bg-[#1F1E24] border-t border-x border-[#35343C] rounded-t-[28px] max-h-[86dvh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle Affordance */}
        <div className="w-10 h-1.5 bg-[#35343C] rounded-full mx-auto mt-3 mb-1 shrink-0" />

        {/* Sheet Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-[#35343C] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-[14px] bg-[#E4483C]/15 border border-[#E4483C]/30 flex items-center justify-center text-[#E4483C] shrink-0">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3
                id="workout-init-sheet-title"
                className="font-display font-bold text-[18px] text-[#F2F1ED] leading-tight truncate"
              >
                Khởi tạo buổi tập mới
              </h3>
              <p className="text-[12px] text-[#9C9AA3] mt-0.5 truncate">
                Chọn mẫu bài tập đã lưu hoặc tạo buổi tập trống · Lưu tự động Isar Cache
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ khởi tạo buổi tập"
            className="min-w-[48px] min-h-[48px] w-12 h-12 rounded-[14px] bg-[#28272E] hover:bg-[#35343C] border border-[#35343C] text-[#9C9AA3] hover:text-[#F2F1ED] flex items-center justify-center transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Sheet Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-6 flex-1">
          {/* Optional Resume Draft Quick Card if a draft exists */}
          {draftSession && onResumeDraftSession && (
            <div className="p-4 rounded-[20px] bg-[#28272E] border border-[#E0B93D]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-[12px] bg-[#E0B93D]/15 text-[#E0B93D] flex items-center justify-center shrink-0 mt-0.5">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[12px] text-[#E0B93D] font-semibold">
                    <span>Phát hiện tệp nháp (Draft Session)</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-display tabular-nums">
                      {formatTimer(draftSession.durationSeconds)}
                    </span>
                  </div>
                  <p className="font-display font-bold text-[15px] text-[#F2F1ED] truncate">
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
                className="min-h-[48px] px-4 py-2.5 rounded-[14px] bg-[#E0B93D] hover:bg-[#d1ab31] text-[#17161A] font-semibold text-[13px] flex items-center justify-center gap-2 transition shrink-0 active:scale-95 whitespace-nowrap"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Tiếp tục bản nháp</span>
              </button>
            </div>
          )}

          {/* Scenario 2: Blank Session ("Tạo buổi tập trống") */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-[13px] font-semibold text-[#9C9AA3]">
              <span>Khởi tạo nhanh (Blank Slate)</span>
              <span>Bắt đầu từ 00:00:00</span>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectBlankSession();
              }}
              className="w-full min-h-[68px] p-4 rounded-[20px] bg-[#17161A] hover:bg-[#28272E] border border-[#35343C] hover:border-[#E4483C] transition flex items-center justify-between gap-4 text-left group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-[14px] bg-[#E4483C]/15 border border-[#E4483C]/40 flex items-center justify-center text-[#E4483C] group-hover:bg-[#E4483C] group-hover:text-[#F2F1ED] transition shrink-0">
                  <Plus className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div className="min-w-0 flex flex-col gap-1">
                  <span className="font-display font-bold text-[16px] text-[#F2F1ED] group-hover:text-[#E4483C] transition truncate">
                    Tạo buổi tập trống
                  </span>
                  <span className="text-[12px] text-[#9C9AA3] truncate">
                    Blank Session · Mở màn hình &ldquo;Đang Tập&rdquo; với danh sách bài tập rỗng
                  </span>
                </div>
              </div>

              <div className="min-w-[44px] min-h-[44px] rounded-[12px] bg-[#28272E] group-hover:bg-[#E4483C] text-[#9C9AA3] group-hover:text-[#F2F1ED] flex items-center justify-center transition shrink-0">
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>
          </div>

          {/* Scenario 1: Saved / Forked Routines ("Khởi tạo buổi tập từ một mẫu bài tập có sẵn") */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[#F2F1ED]">
                <BookmarkCheck className="w-4 h-4 text-[#E4483C]" />
                <span>Mẫu bài tập đã lưu (Saved / Forked Routines)</span>
              </div>
              <span className="text-[12px] text-[#9C9AA3] font-display tabular-nums">
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
                    className={`w-full p-4 sm:p-5 rounded-[20px] border transition text-left flex flex-col gap-3.5 group active:scale-[0.99] ${
                      isPushDayFeatured
                        ? 'bg-[#17161A] border-[#E4483C]/60 hover:border-[#E4483C] hover:bg-[#222128]'
                        : 'bg-[#17161A] border-[#35343C] hover:border-[#E4483C] hover:bg-[#222128]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 w-full">
                      <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                        <div className="flex items-center flex-wrap gap-2 text-[12px] text-[#9C9AA3]">
                          <span className="text-[#4CAF6D] font-semibold">
                            Đã lưu trong bộ nhớ
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>Tác giả: {routine.creatorName}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-display tabular-nums text-[#F2F1ED]">
                            {routine.exercises.length} bài tập ({totalSetsCount} Sets)
                          </span>
                        </div>

                        <h4 className="font-display font-bold text-[17px] text-[#F2F1ED] group-hover:text-[#E4483C] transition leading-snug">
                          {routine.title}
                        </h4>
                      </div>

                      <div className="min-h-[44px] px-3.5 py-2 rounded-[12px] bg-[#E4483C] group-hover:bg-[#C23629] text-[#F2F1ED] text-[13px] font-semibold flex items-center gap-1.5 shrink-0 transition">
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Tập ngay</span>
                      </div>
                    </div>

                    {/* Exercise Preview List */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[#9C9AA3] pt-2 border-t border-[#28272E]">
                      {routine.exercises.map((ex, idx) => (
                        <React.Fragment key={`${routine.id}-ex-${idx}`}>
                          {idx > 0 && <span aria-hidden="true" className="text-[#656470]">·</span>}
                          <span className="text-[#F2F1ED]/90">
                            {ex.name}{' '}
                            <strong className="font-display tabular-nums text-[#9C9AA3] font-normal">
                              ({ex.targetSets}×{ex.targetReps})
                            </strong>
                          </span>
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Pre-filled Previous Stats Notice */}
                    <div className="flex items-center justify-between gap-2 text-[11px] text-[#9C9AA3]">
                      <span className="flex items-center gap-1.5 text-[#3E8EDE]">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span>Tự động điền sẵn số Set, mức tạ (Kg) &amp; Reps của buổi tập trước</span>
                      </span>
                      <span className="font-display tabular-nums flex items-center gap-1 text-[#E4483C] shrink-0">
                        <Clock className="w-3 h-3" />
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
