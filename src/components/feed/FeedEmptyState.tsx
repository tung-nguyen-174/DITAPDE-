import React from 'react';
import { Dumbbell, UserPlus, Activity, Flame, Zap } from 'lucide-react';

export interface FeedEmptyStateProps {
  variant?: 'no_personal_logs' | 'no_friends' | 'empty_feed';
  onStartWorkout: () => void;
  onConnectFriends: () => void;
}

export const FeedEmptyState: React.FC<FeedEmptyStateProps> = ({
  variant = 'no_personal_logs',
  onStartWorkout,
  onConnectFriends,
}) => {
  const copy = {
    no_personal_logs: {
      badge: 'Nhật ký tập luyện cá nhân · 0 buổi tập',
      title: 'Bạn chưa ghi nhận buổi tập nào',
      description:
        'Ghi lại hiệp tập đầu tiên để tự động tính toán E1RM, bản đồ nhiệt cơ bắp và chia sẻ thành tích lên bảng tin cùng anh em phòng tập.',
    },
    no_friends: {
      badge: 'Bảng tin bạn tập · Chưa có dữ liệu',
      title: 'Chưa có hoạt động từ bạn tập',
      description:
        'Kết nối bạn bè cùng phòng gym để thả Dap khích lệ kỷ lục mới, sao chép giáo án hoặc tự mình mở bát buổi tập hôm nay.',
    },
    empty_feed: {
      badge: 'Bảng tin cộng đồng · Chưa có bài đăng',
      title: 'Bảng tin đang chờ buổi tập đầu tiên',
      description:
        'Hãy là người đầu tiên khởi động buổi tập hôm nay hoặc kết nối thêm bạn bè để lấp đầy bảng tin bằng những hiệp tạ chất lượng.',
    },
  }[variant];

  return (
    <section className="w-full backdrop-blur-md bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
            <Dumbbell className="w-5 h-5 text-emerald-400 stroke-[1.5]" />
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

      {/* Zero-Data Telemetry Preview Strip */}
      <div className="bg-zinc-950/60 rounded-xl border border-zinc-800 p-5 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">Tổng tải trọng</span>
            <span className="font-display tabular-nums text-base font-bold text-zinc-100">
              0 kg
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">Ước tính 1RM</span>
            <span className="font-display tabular-nums text-base font-bold text-zinc-100">
              -- kg
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">Cường độ RPE</span>
            <span className="font-display tabular-nums text-base font-bold text-emerald-400">
              Chưa đo
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400 stroke-[1.5] shrink-0" />
            <span>Tự động vẽ bản đồ cơ bắp sau buổi tập</span>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-400 stroke-[1.5] shrink-0" />
            <span>Giữ chuỗi tuần & nhận Dap từ bạn tập</span>
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
          <Zap className="w-4 h-4 stroke-[1.5]" />
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
    </section>
  );
};
