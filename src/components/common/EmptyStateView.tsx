import React from 'react';
import { Dumbbell, Users, Trophy, Sparkles, Plus, UserPlus } from 'lucide-react';

export interface EmptyStateViewProps {
  type: 'friends' | 'workouts' | 'challenges' | 'general';
  title: string;
  description: string;
  ctaText: string;
  onCtaClick: () => void;
  secondaryCtaText?: string;
  onSecondaryCtaClick?: () => void;
  metricsPreview?: { label: string; value: string; color?: string }[];
}

export const EmptyStateView: React.FC<EmptyStateViewProps> = ({
  type,
  title,
  description,
  ctaText,
  onCtaClick,
  secondaryCtaText,
  onSecondaryCtaClick,
  metricsPreview,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'friends':
        return <Users className="w-5 h-5 text-emerald-400 stroke-[1.5]" />;
      case 'workouts':
        return <Dumbbell className="w-5 h-5 text-emerald-400 stroke-[1.5]" />;
      case 'challenges':
        return <Trophy className="w-5 h-5 text-emerald-400 stroke-[1.5]" />;
      default:
        return <Sparkles className="w-5 h-5 text-emerald-400 stroke-[1.5]" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center backdrop-blur-md bg-zinc-900/50 rounded-2xl border border-zinc-800 shadow-sm gap-6 w-full">
      <div className="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 shrink-0 shadow-sm">
        {getIcon()}
      </div>

      <div className="flex flex-col items-center gap-2 max-w-md">
        <h3 className="font-display text-lg font-bold tracking-tight text-zinc-100 leading-snug">
          {title}
        </h3>
        <p className="text-sm font-normal text-zinc-400 leading-relaxed">
          {description}
        </p>
      </div>

      {metricsPreview && metricsPreview.length > 0 && (
        <div className="grid grid-cols-3 gap-4 w-full max-w-md bg-zinc-950/80 p-4 rounded-xl border border-zinc-800">
          {metricsPreview.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1">
              <span className="text-xs text-zinc-400">{item.label}</span>
              <span className="font-display tabular-nums text-sm font-bold text-zinc-100">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
        <button
          type="button"
          onClick={onCtaClick}
          className="w-full sm:flex-1 min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-sm font-semibold shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-zinc-500 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[1.5]" />
          <span>{ctaText}</span>
        </button>

        {secondaryCtaText && onSecondaryCtaClick && (
          <button
            type="button"
            onClick={onSecondaryCtaClick}
            className="w-full sm:flex-1 min-h-[44px] px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800/60 border border-zinc-800 text-zinc-100 text-sm font-medium transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-zinc-500 flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4 text-zinc-400 stroke-[1.5]" />
            <span>{secondaryCtaText}</span>
          </button>
        )}
      </div>
    </div>
  );
};
