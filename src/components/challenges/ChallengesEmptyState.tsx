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
    <section className="apple-card w-full p-6 sm:p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="apple-icon-badge-accent">
            <Trophy className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-[#E4483C]">
              {copy.badge}
            </span>
            <h3 className="font-display text-lg font-bold tracking-tight text-zinc-100 leading-snug">
              {copy.title}
            </h3>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-zinc-300 font-normal leading-relaxed">
        {copy.description}
      </p>

      {/* Zero-State Progress Bar */}
      <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/[0.06] flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 text-xs font-medium">
          <span className="text-zinc-400">Sản lượng đã ghi nhận:</span>
          <span className="font-display tabular-nums font-semibold text-zinc-100">
            0.0 / 100.0 tấn (0%)
          </span>
        </div>

        <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden flex items-center p-0.5 border border-white/10">
          <div className="h-1.5 w-2 rounded-full bg-[#E4483C]" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#E4483C] stroke-[1.75] shrink-0" />
            <span className="font-display tabular-nums">0 buổi tập trong tháng</span>
          </div>
          <div className="flex items-center gap-2 sm:justify-end">
            <Shield className="w-4 h-4 text-zinc-400 stroke-[1.75] shrink-0" />
            <span className="text-[#E0B93D] font-medium">Mở khóa huy hiệu Chuột Titan</span>
          </div>
        </div>
      </div>

      {/* Action CTAs */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={onStartWorkout}
          className="apple-btn-primary w-full sm:flex-1 min-h-[44px] px-5 py-2.5 text-xs sm:text-sm font-semibold gap-2"
        >
          <Dumbbell className="w-4 h-4 stroke-[1.75]" />
          <span>Bắt đầu buổi tập</span>
        </button>

        <button
          type="button"
          onClick={onConnectFriends}
          className="apple-btn-secondary w-full sm:flex-1 min-h-[44px] px-5 py-2.5 text-xs sm:text-sm font-medium gap-2"
        >
          <UserPlus className="w-4 h-4 text-[#E4483C] stroke-[1.75]" />
          <span>Kết nối bạn bè</span>
        </button>
      </div>

      {variant === 'no_joined_challenges' && onExploreChallenges && (
        <button
          type="button"
          onClick={onExploreChallenges}
          className="apple-btn-secondary w-full min-h-[44px] px-4 py-2 text-xs font-medium"
        >
          Xem danh sách tất cả thử thách tháng này
        </button>
      )}
    </section>
  );
};
