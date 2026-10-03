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
        return <Users className="w-5 h-5 text-[#E4483C] stroke-[1.75]" />;
      case 'workouts':
        return <Dumbbell className="w-5 h-5 text-[#E4483C] stroke-[1.75]" />;
      case 'challenges':
        return <Trophy className="w-5 h-5 text-[#E4483C] stroke-[1.75]" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#E4483C] stroke-[1.75]" />;
    }
  };

  return (
    <div className="apple-card flex flex-col items-center justify-center p-6 sm:p-8 text-center gap-6 w-full">
      <div className="apple-icon-badge-accent shrink-0">
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
        <div className="grid grid-cols-3 gap-4 w-full max-w-md bg-zinc-950/60 p-4 rounded-2xl border border-white/10">
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
          className="apple-btn-primary w-full sm:flex-1 min-h-[44px] px-5 py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[1.75]" />
          <span>{ctaText}</span>
        </button>

        {secondaryCtaText && onSecondaryCtaClick && (
          <button
            type="button"
            onClick={onSecondaryCtaClick}
            className="apple-btn-secondary w-full sm:flex-1 min-h-[44px] px-5 py-2.5 text-sm font-medium flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
            <span>{secondaryCtaText}</span>
          </button>
        )}
      </div>
    </div>
  );
};
