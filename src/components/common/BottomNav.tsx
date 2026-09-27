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
    <nav className="sticky bottom-0 z-30 bg-[#1F1E24] border-t border-[#35343C] w-full pb-safe select-none shrink-0">
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-2 flex items-center justify-between gap-2 sm:gap-4">
        {/* Tab 1: Feed (Bảng tin) */}
        <button
          onClick={() => onSelectTab('feed')}
          className={`flex-1 min-w-[48px] min-h-[48px] rounded-[14px] flex flex-col items-center justify-center gap-2 p-2 transition-all active:scale-95 ${
            activeTab === 'feed'
              ? 'text-[#E4483C] bg-[#28272E]'
              : 'text-[#9C9AA3] hover:text-[#F2F1ED]'
          }`}
        >
          <Flame className="w-5 h-5" />
          <span className="text-[12px] font-medium whitespace-nowrap leading-none">Bảng tin</span>
        </button>

        {/* Tab 2: Discover (Khám phá) */}
        <button
          onClick={() => onSelectTab('discover')}
          className={`flex-1 min-w-[48px] min-h-[48px] rounded-[14px] flex flex-col items-center justify-center gap-2 p-2 transition-all active:scale-95 ${
            activeTab === 'discover'
              ? 'text-[#E4483C] bg-[#28272E]'
              : 'text-[#9C9AA3] hover:text-[#F2F1ED]'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[12px] font-medium whitespace-nowrap leading-none">Khám phá</span>
        </button>

        {/* Primary Action Button: FAB Tập Ngay */}
        <button
          onClick={onOpenLogger}
          aria-label="Khởi tạo buổi tập mới - Tập Ngay"
          className="relative flex-1 max-w-[104px] min-w-[48px] min-h-[48px] p-2 rounded-[14px] flex flex-col items-center justify-center gap-1.5 text-[#F2F1ED] bg-[#E4483C] hover:bg-[#C23629] active:bg-[#C23629] transition-all active:scale-95 shadow-lg shadow-[#E4483C]/20"
        >
          {hasActiveSession && (
            <span
              className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-[#E0B93D] animate-pulse"
              title="Có buổi tập chưa hoàn thành"
            />
          )}
          <Dumbbell className="w-4 h-4 stroke-[2.2]" />
          <span className="text-[11px] font-semibold whitespace-nowrap leading-none">
            Tập Ngay
          </span>
        </button>

        {/* Tab 3: Challenges (Thử thách) */}
        <button
          onClick={() => onSelectTab('challenges')}
          className={`flex-1 min-w-[48px] min-h-[48px] rounded-[14px] flex flex-col items-center justify-center gap-2 p-2 transition-all active:scale-95 ${
            activeTab === 'challenges'
              ? 'text-[#E4483C] bg-[#28272E]'
              : 'text-[#9C9AA3] hover:text-[#F2F1ED]'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[12px] font-medium whitespace-nowrap leading-none">Thử thách</span>
        </button>

        {/* Tab 4: Profile (Cá nhân) */}
        <button
          onClick={() => onSelectTab('profile')}
          className={`flex-1 min-w-[48px] min-h-[48px] rounded-[14px] flex flex-col items-center justify-center gap-2 p-2 transition-all active:scale-95 ${
            activeTab === 'profile'
              ? 'text-[#E4483C] bg-[#28272E]'
              : 'text-[#9C9AA3] hover:text-[#F2F1ED]'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[12px] font-medium whitespace-nowrap leading-none">Cá nhân</span>
        </button>
      </div>
    </nav>
  );
};
