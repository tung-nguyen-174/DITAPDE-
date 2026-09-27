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
    <div className="w-full bg-zinc-900/90 backdrop-blur-md border border-emerald-500/40 rounded-xl p-4 flex items-center justify-between gap-4 z-40 shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
          <Timer className="w-5 h-5 stroke-[1.5]" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px] font-normal text-zinc-400 block">
            Nghỉ giữa hiệp
          </span>
          <span className="font-display tabular-nums text-[20px] font-bold tracking-tight text-emerald-400 block leading-none">
            {formatTime(secondsRemaining)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onAdd30s}
          className="min-h-[44px] min-w-[48px] px-3.5 py-2.5 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-100 text-[13px] font-semibold border border-zinc-800 transition-all duration-200 ease-in-out hover:scale-[1.02] flex items-center gap-1.5 focus:outline-hidden focus:ring-2 focus:ring-zinc-500"
        >
          <Plus className="w-4 h-4 text-emerald-400 stroke-[1.5]" />
          <span className="font-display tabular-nums">30s</span>
        </button>

        <button
          onClick={onSkip}
          className="min-h-[48px] min-w-[48px] px-4 py-2.5 rounded-[14px] bg-[#E4483C] hover:bg-[#C23629] active:scale-95 text-white text-[13px] font-semibold transition-all duration-200 ease-in-out hover:scale-[1.02] flex items-center gap-1.5 shadow-sm focus:outline-hidden focus:ring-2 focus:ring-zinc-500"
        >
          <FastForward className="w-4 h-4 stroke-[1.5]" />
          <span>Bỏ qua</span>
        </button>
      </div>
    </div>
  );
};
