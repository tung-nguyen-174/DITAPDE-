import React from 'react';
import { 
  Flame, 
  Compass, 
  Trophy, 
  User, 
  Dumbbell 
} from 'lucide-react';

interface BottomNavProps {
  activeTab: 'feed' | 'discover' | 'challenges' | 'profile';
  onSelectTab: (tab: 'feed' | 'discover' | 'challenges' | 'profile') => void;
  onOpenLogger: () => void;
  hasActiveSession: boolean;
  isLandscape?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenLogger,
  hasActiveSession,
}) => {
  return (
    <nav
      className="sticky bottom-0 z-30 bg-[#17161A]/90 backdrop-blur-xl border-t border-white/10 w-full select-none shrink-0 shadow-lg shadow-black/30"
      style={{
        paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))',
      }}
    >
      <div className="max-w-3xl mx-auto w-full px-3 sm:px-6 py-2 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Tab 1: Feed (Bảng tin) */}
        <button
          onClick={() => onSelectTab('feed')}
          className={`flex-1 min-w-[48px] min-h-[50px] rounded-2xl flex flex-col items-center justify-center gap-1.5 p-1.5 transition-all duration-200 ease-out active:scale-[0.96] border ${
            activeTab === 'feed'
              ? 'text-white bg-white/15 border-white/10 shadow-xs'
              : 'text-zinc-400 hover:text-zinc-100 bg-white/[0.04] hover:bg-white/[0.08] border-white/5'
          }`}
        >
          <Flame className={`w-5 h-5 stroke-[1.75] ${activeTab === 'feed' ? 'text-[#E4483C] fill-current' : ''}`} />
          <span className="text-[11px] font-medium whitespace-nowrap leading-none">Bảng tin</span>
        </button>

        {/* Tab 2: Discover (Khám phá) */}
        <button
          onClick={() => onSelectTab('discover')}
          className={`flex-1 min-w-[48px] min-h-[50px] rounded-2xl flex flex-col items-center justify-center gap-1.5 p-1.5 transition-all duration-200 ease-out active:scale-[0.96] border ${
            activeTab === 'discover'
              ? 'text-white bg-white/15 border-white/10 shadow-xs'
              : 'text-zinc-400 hover:text-zinc-100 bg-white/[0.04] hover:bg-white/[0.08] border-white/5'
          }`}
        >
          <Compass className={`w-5 h-5 stroke-[1.75] ${activeTab === 'discover' ? 'text-[#E4483C]' : ''}`} />
          <span className="text-[11px] font-medium whitespace-nowrap leading-none">Khám phá</span>
        </button>

        {/* Primary Action Button: FAB Tập Ngay */}
        <button
          onClick={onOpenLogger}
          aria-label="Khởi tạo buổi tập mới - Tập Ngay"
          className="apple-btn-primary relative flex-1 max-w-[108px] min-w-[48px] min-h-[50px] p-1.5 flex flex-col items-center justify-center gap-1 shadow-md shadow-[#E4483C]/30"
        >
          {hasActiveSession && (
            <span
              className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-[#E0B93D] animate-pulse ring-2 ring-[#E4483C]"
              title="Có buổi tập chưa hoàn thành"
            />
          )}
          <Dumbbell className="w-4 h-4 stroke-[2]" />
          <span className="text-[11px] font-semibold whitespace-nowrap leading-none tracking-tight">
            Tập Ngay
          </span>
        </button>

        {/* Tab 3: Challenges (Thử thách) */}
        <button
          onClick={() => onSelectTab('challenges')}
          className={`flex-1 min-w-[48px] min-h-[50px] rounded-2xl flex flex-col items-center justify-center gap-1.5 p-1.5 transition-all duration-200 ease-out active:scale-[0.96] border ${
            activeTab === 'challenges'
              ? 'text-white bg-white/15 border-white/10 shadow-xs'
              : 'text-zinc-400 hover:text-zinc-100 bg-white/[0.04] hover:bg-white/[0.08] border-white/5'
          }`}
        >
          <Trophy className={`w-5 h-5 stroke-[1.75] ${activeTab === 'challenges' ? 'text-[#E4483C]' : ''}`} />
          <span className="text-[11px] font-medium whitespace-nowrap leading-none">Thử thách</span>
        </button>

        {/* Tab 4: Profile (Cá nhân) */}
        <button
          onClick={() => onSelectTab('profile')}
          className={`flex-1 min-w-[48px] min-h-[50px] rounded-2xl flex flex-col items-center justify-center gap-1.5 p-1.5 transition-all duration-200 ease-out active:scale-[0.96] border ${
            activeTab === 'profile'
              ? 'text-white bg-white/15 border-white/10 shadow-xs'
              : 'text-zinc-400 hover:text-zinc-100 bg-white/[0.04] hover:bg-white/[0.08] border-white/5'
          }`}
        >
          <User className={`w-5 h-5 stroke-[1.75] ${activeTab === 'profile' ? 'text-[#E4483C]' : ''}`} />
          <span className="text-[11px] font-medium whitespace-nowrap leading-none">Cá nhân</span>
        </button>
      </div>
    </nav>
  );
};
