import React from 'react';
import { Trophy, Dumbbell, UserPlus, Shield, Flame } from 'lucide-react';

export interface ChallengesEmptyStateProps {
  variant?: 'no_logged_volume' | 'no_joined_challenges' | 'no_club_activity';
  onStartWorkout: () => void;
  onConnectFriends: () => void;
  onExploreChallenges?: () => void;
}

export const ChallengesEmptyState: React.FC<ChallengesEmptyStateProps> = ({
  variant = 'no_logged_volume',
  onStartWorkout,
  onConnectFriends,
  onExploreChallenges,
}) => {
  const copy = {
    no_logged_volume: {
      badge: 'Tiến độ thử thách cá nhân · 0.0 tấn',
      title: 'Chưa có dữ liệu sản lượng tạ của bạn',
      description:
        'Bạn chưa ghi nhận buổi tập nào trong tháng này. Hãy bắt đầu buổi tập để tích lũy từng kg tạ vào thử thách 100 tấn hoặc kết nối bạn bè để đua top câu lạc bộ.',
    },
    no_joined_challenges: {
      badge: 'Thử thách đang tham gia · 0 sự kiện',
      title: 'Bạn chưa tham gia thử thách nào',
      description:
        'Chọn một thử thách bên dưới hoặc bắt đầu buổi tập ngay để hệ thống tự động quy đổi tổng khối lượng tạ (tonnage) thành huy hiệu cá nhân.',
    },
    no_club_activity: {
      badge: 'Đóng góp câu lạc bộ · 0 kg tuần này',
      title: 'Chưa có đóng góp sản lượng cho CLB',
      description:
        'Hoàn thành buổi tập đầu tiên để đóng góp khối lượng tạ cho phòng gym của bạn và kết nối bạn bè cùng đẩy thứ hạng câu lạc bộ.',
    },
  }[variant];

  return (
    <section className="w-full backdrop-blur-md bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-emerald-400 stroke-[1.5]" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-400">
              {copy.badge}
            </span>
            <h3 className="font-display text-lg font-bold tracking-tight text-zinc-100 leading-snug">
              {copy.title}
            </h3>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-zinc-400 leading-relaxed">
        {copy.description}
      </p>

      {/* Zero-State Progress Bar */}
      <div className="bg-zinc-950/60 p-5 rounded-xl border border-zinc-800 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 text-xs">
          <span className="text-zinc-400">Sản lượng đã ghi nhận:</span>
          <span className="font-display tabular-nums font-semibold text-zinc-100">
            0.0 / 100.0 tấn (0%)
          </span>
        </div>

        <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden flex items-center p-0.5 border border-zinc-800">
          <div className="h-1.5 w-2 rounded-full bg-emerald-400" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-400 stroke-[1.5] shrink-0" />
            <span className="font-display tabular-nums">0 buổi tập trong tháng</span>
          </div>
          <div className="flex items-center gap-2 sm:justify-end">
            <Shield className="w-4 h-4 text-zinc-400 stroke-[1.5] shrink-0" />
            <span>Mở khóa huy hiệu Chuột Titan</span>
          </div>
        </div>
      </div>

      {/* Action CTAs */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={onStartWorkout}
          className="w-full sm:flex-1 min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-sm font-semibold shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-zinc-500 flex items-center justify-center gap-2"
        >
          <Dumbbell className="w-4 h-4 stroke-[1.5]" />
          <span>Bắt đầu buổi tập</span>
        </button>

        <button
          type="button"
          onClick={onConnectFriends}
          className="w-full sm:flex-1 min-h-[44px] px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800/60 border border-zinc-800 text-zinc-100 text-sm font-medium transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-zinc-500 flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4 text-zinc-400 stroke-[1.5]" />
          <span>Kết nối bạn bè</span>
        </button>
      </div>

      {variant === 'no_joined_challenges' && onExploreChallenges && (
        <button
          type="button"
          onClick={onExploreChallenges}
          className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800/60 border border-zinc-800 text-zinc-400 hover:text-zinc-100 text-xs font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-500"
        >
          Xem danh sách tất cả thử thách tháng này
        </button>
      )}
    </section>
  );
};
