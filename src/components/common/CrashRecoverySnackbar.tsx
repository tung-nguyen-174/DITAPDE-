import React from 'react';
import { AlertTriangle, Play, Trash2, Clock } from 'lucide-react';
import { WorkoutSession } from '../../types/gym';

interface CrashRecoverySnackbarProps {
  draftSession: WorkoutSession | null;
  onContinue: (draft: WorkoutSession) => void;
  onDiscard: () => void;
}

export const CrashRecoverySnackbar: React.FC<CrashRecoverySnackbarProps> = ({
  draftSession,
  onContinue,
  onDiscard,
}) => {
  if (!draftSession) return null;

  const formatTimer = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const completedSets = draftSession.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0
  );
  const totalSets = draftSession.exercises.reduce(
    (sum, ex) => sum + ex.sets.length,
    0
  );

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full px-4 sm:px-6 pb-3 pt-1 z-30 shrink-0 animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div className="max-w-3xl mx-auto w-full rounded-[18px] bg-[#1F1E24] border border-[#E0B93D]/60 p-3.5 sm:p-4 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Warning Text & Draft Metadata */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-[12px] bg-[#E0B93D]/15 border border-[#E0B93D]/40 flex items-center justify-center text-[#E0B93D] shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex flex-col gap-1">
            <p className="font-display font-bold text-[14px] sm:text-[15px] text-[#F2F1ED] leading-snug">
              Bạn có buổi tập chưa hoàn thành
            </p>
            <div className="flex items-center flex-wrap gap-1.5 text-[12px] text-[#9C9AA3]">
              <span className="text-[#E0B93D] font-medium truncate max-w-[200px] sm:max-w-[260px]">
                {draftSession.title}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-display tabular-nums inline-flex items-center gap-1 text-[#F2F1ED]">
                <Clock className="w-3 h-3 text-[#E4483C]" />
                {formatTimer(draftSession.durationSeconds)}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-display tabular-nums">
                {draftSession.exercises.length === 0
                  ? 'Buổi tập trống'
                  : `${completedSets}/${totalSets} Sets`}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: [Tiếp tục] - [Hủy bỏ] */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onContinue(draftSession)}
            className="flex-1 sm:flex-initial min-h-[44px] min-w-[44px] px-4 py-2 rounded-[12px] bg-[#E4483C] hover:bg-[#C23629] text-[#F2F1ED] font-semibold text-[13px] flex items-center justify-center gap-1.5 transition active:scale-95 whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current shrink-0" />
            <span>Tiếp tục</span>
          </button>

          <button
            type="button"
            onClick={onDiscard}
            className="flex-1 sm:flex-initial min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-[12px] bg-[#28272E] hover:bg-[#35343C] border border-[#35343C] text-[#9C9AA3] hover:text-[#E4483C] font-semibold text-[13px] flex items-center justify-center gap-1.5 transition active:scale-95 whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span>Hủy bỏ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
