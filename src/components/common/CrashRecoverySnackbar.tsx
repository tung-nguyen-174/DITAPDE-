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
      <div className="max-w-3xl mx-auto w-full rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-amber-500/30 p-4 shadow-xl shadow-black/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Warning Text & Draft Metadata */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 stroke-[1.75]" />
          </div>

          <div className="min-w-0 flex flex-col gap-1">
            <p className="font-display font-semibold text-sm sm:text-base text-zinc-100 tracking-tight leading-snug">
              Bạn có buổi tập chưa hoàn thành
            </p>
            <div className="flex items-center flex-wrap gap-1.5 text-xs text-zinc-400">
              <span className="text-amber-400 font-medium truncate max-w-[200px] sm:max-w-[260px]">
                {draftSession.title}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-display tabular-nums inline-flex items-center gap-1 text-zinc-200">
                <Clock className="w-3.5 h-3.5 text-[#E4483C] stroke-[1.75]" />
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
            className="apple-btn-primary flex-1 sm:flex-initial min-h-[40px] px-4 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current shrink-0" />
            <span>Tiếp tục</span>
          </button>

          <button
            type="button"
            onClick={onDiscard}
            className="apple-btn-secondary flex-1 sm:flex-initial min-h-[40px] px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-[#E4483C] flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5 stroke-[1.75] shrink-0" />
            <span>Hủy bỏ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
