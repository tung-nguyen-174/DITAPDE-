import React from 'react';
import { Timer, Plus, FastForward } from 'lucide-react';

interface RestTimerDrawerProps {
  secondsRemaining: number;
  onAdd30s: () => void;
  onSkip: () => void;
}

export const RestTimerDrawer: React.FC<RestTimerDrawerProps> = ({
  secondsRemaining,
  onAdd30s,
  onSkip,
}) => {
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4 z-40 shadow-xl shadow-black/30">
      <div className="flex items-center gap-3">
        <div className="apple-icon-badge-accent shrink-0">
          <Timer className="w-5 h-5 stroke-[1.75]" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-zinc-400 block">
            Nghỉ giữa hiệp
          </span>
          <span className="font-display tabular-nums text-xl font-bold tracking-tight text-[#E4483C] block leading-none">
            {formatTime(secondsRemaining)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onAdd30s}
          className="apple-btn-secondary min-h-[40px] px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 text-[#E4483C] stroke-[1.75]" />
          <span className="font-display tabular-nums">+30s</span>
        </button>

        <button
          onClick={onSkip}
          className="apple-btn-primary min-h-[40px] px-4 py-2 text-xs font-semibold flex items-center gap-1.5"
        >
          <FastForward className="w-4 h-4 stroke-[1.75]" />
          <span>Bỏ qua</span>
        </button>
      </div>
    </div>
  );
};
