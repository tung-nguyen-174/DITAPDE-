import React, { useState } from 'react';
import {
  Trophy,
  Users,
  CheckCircle2,
  Clock,
  Shield,
  Dumbbell,
} from 'lucide-react';
import { Challenge } from '../../types/gym';
import { CHALLENGES } from '../../data/mockData';
import { ChallengesEmptyState } from './ChallengesEmptyState';

export interface ChallengesScreenProps {
  hasUserLoggedWorkout?: boolean;
  userLoggedVolumeTons?: number;
  onStartWorkout?: () => void;
  onConnectFriends?: () => void;
}

export const ChallengesScreen: React.FC<ChallengesScreenProps> = ({
  hasUserLoggedWorkout = false,
  userLoggedVolumeTons = 0,
  onStartWorkout,
  onConnectFriends,
}) => {
  const [challenges, setChallenges] = useState<Challenge[]>(CHALLENGES);
  const [activeTab, setActiveTab] = useState<'challenges' | 'clubs'>('challenges');
  const [challengeFilter, setChallengeFilter] = useState<'all' | 'joined' | 'my_logs'>('all');

  const triggerStartWorkout = onStartWorkout || (() => {});
  const triggerConnectFriends = onConnectFriends || (() => {});

  const handleToggleJoin = (id: string) => {
    setChallenges((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextJoined = !c.joined;
          return {
            ...c,
            joined: nextJoined,
            participantsCount: nextJoined ? c.participantsCount + 1 : c.participantsCount - 1,
          };
        }
        return c;
      })
    );
  };

  const joinedChallenges = challenges.filter((c) => c.joined);
  const displayedChallenges =
    challengeFilter === 'joined'
      ? joinedChallenges
      : challengeFilter === 'my_logs' && !hasUserLoggedWorkout
      ? []
      : challenges;

  const CLUBS_LEADERBOARD = [
    { rank: 1, name: 'California Fitness Thanh Hóa', volume: '1,420,500 kg', members: 142, isHome: true },
    { rank: 2, name: 'Strongman Gym & Fitness Hà Nội', volume: '1,190,000 kg', members: 118, isHome: false },
    { rank: 3, name: 'The New Gym - Hoàng Văn Thụ Sài Gòn', volume: '984,200 kg', members: 165, isHome: false },
    { rank: 4, name: 'Swequity Ultimate Fitness Cầu Giấy', volume: '854,000 kg', members: 92, isHome: false },
    { rank: 5, name: 'Aura Powerbuilding Elite Club', volume: '620,800 kg', members: 45, isHome: false },
  ];

  const personalTons = hasUserLoggedWorkout ? Math.max(46.8, userLoggedVolumeTons) : 0;
  const personalPct = Math.min(100, Number(((personalTons / 100) * 100).toFixed(1)));

  return (
    <div className="flex flex-col p-6 sm:p-8 gap-6 max-w-3xl mx-auto w-full bg-zinc-950 text-zinc-100">
      {/* Switcher: Thử thách vs CLB Gym (Apple Segmented Control) */}
      <div className="apple-segmented-control w-full">
        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex-1 min-h-[42px] py-2 px-4 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 ease-out flex items-center justify-center gap-2 active:scale-[0.98] ${
            activeTab === 'challenges'
              ? 'bg-white/15 text-white shadow-xs border border-white/10'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Trophy className="w-4 h-4 stroke-[1.75]" />
          <span>Thử thách tháng</span>
        </button>
        <button
          onClick={() => setActiveTab('clubs')}
          className={`flex-1 min-h-[42px] py-2 px-4 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 ease-out flex items-center justify-center gap-2 active:scale-[0.98] ${
            activeTab === 'clubs'
              ? 'bg-white/15 text-white shadow-xs border border-white/10'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4 stroke-[1.75]" />
          <span>Bảng xếp hạng câu lạc bộ</span>
        </button>
      </div>

      {activeTab === 'challenges' ? (
        <div className="flex flex-col gap-6">
          {!hasUserLoggedWorkout && challengeFilter !== 'my_logs' && (
            <ChallengesEmptyState
              variant="no_logged_volume"
              onStartWorkout={triggerStartWorkout}
              onConnectFriends={triggerConnectFriends}
            />
          )}

          {/* Main Hero Card for 100-Ton Challenge */}
          <section className="apple-card p-6 sm:p-8 border border-[#E4483C]/40 flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="apple-icon-badge-accent">
                  <Dumbbell className="w-5 h-5 stroke-[1.75]" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-[#E4483C] block">
                    Sự kiện tháng này
                  </span>
                  <h2 className="font-display font-bold tracking-tight text-lg sm:text-xl text-zinc-100 leading-snug">
                    Thử thách 100 tấn tháng này
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400 shrink-0 font-medium">
                <Clock className="w-4 h-4 text-[#E4483C] stroke-[1.75]" />
                <span className="font-display tabular-nums">Còn 12 ngày</span>
              </div>
            </div>

            <p className="text-sm text-zinc-300 font-normal leading-relaxed">
              Nâng tổng sản lượng đạt 100,000 kg tạ tích lũy để mở khóa huy hiệu Chuột Titan và vinh danh bảng vàng.
            </p>

            {/* Progress Bar */}
            <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/[0.06] flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4 text-xs font-medium">
                <span className="text-zinc-400">Tiến độ cá nhân:</span>
                <span className="font-display tabular-nums font-semibold text-[#E4483C]">
                  {personalTons.toFixed(1)} / 100.0 tấn ({personalPct}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#E4483C] to-[#E0B93D] transition-all duration-300"
                  style={{
                    width: `${Math.max(hasUserLoggedWorkout ? personalPct : 3, personalPct)}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-zinc-400 stroke-[1.75]" />
                  <span className="font-display tabular-nums">1,420 người đang tham gia</span>
                </span>
                <span className="text-[#E0B93D] font-medium">Huy hiệu Chuột Titan</span>
              </div>
            </div>
          </section>

          {/* Filter Tabs for Challenges */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap py-0.5">
            <button
              type="button"
              onClick={() => setChallengeFilter('all')}
              className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ease-out shrink-0 active:scale-[0.98] ${
                challengeFilter === 'all'
                  ? 'bg-white text-zinc-950 font-bold shadow-xs'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
              }`}
            >
              Tất cả thử thách ({challenges.length})
            </button>
            <button
              type="button"
              onClick={() => setChallengeFilter('joined')}
              className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ease-out shrink-0 active:scale-[0.98] ${
                challengeFilter === 'joined'
                  ? 'bg-white text-zinc-950 font-bold shadow-xs'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
              }`}
            >
              Đang tham gia ({joinedChallenges.length})
            </button>
            <button
              type="button"
              onClick={() => setChallengeFilter('my_logs')}
              className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ease-out shrink-0 active:scale-[0.98] ${
                challengeFilter === 'my_logs'
                  ? 'bg-white text-zinc-950 font-bold shadow-xs'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
              }`}
            >
              Sản lượng của tôi ({hasUserLoggedWorkout ? '1 buổi' : '0 buổi'})
            </button>
          </div>

          {/* List of Challenges */}
          {displayedChallenges.length === 0 ? (
            <ChallengesEmptyState
              variant={
                challengeFilter === 'joined'
                  ? 'no_joined_challenges'
                  : 'no_logged_volume'
              }
              onStartWorkout={triggerStartWorkout}
              onConnectFriends={triggerConnectFriends}
              onExploreChallenges={() => setChallengeFilter('all')}
            />
          ) : (
            <div className="flex flex-col gap-5">
              {displayedChallenges.map((c) => {
                const progressPct = Math.min(
                  100,
                  Math.round((c.currentVolumeTons / c.targetVolumeTons) * 100)
                );

                return (
                  <div
                    key={c.id}
                    className="apple-card-interactive p-6 sm:p-8 flex flex-col gap-6"
                  >
                    <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/10">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="apple-icon-badge-accent">
                          <Trophy className="w-5 h-5 stroke-[1.75]" />
                        </div>
                        <div className="min-w-0 flex flex-col gap-0.5">
                          <h4 className="font-display font-bold tracking-tight text-base text-zinc-100 truncate">
                            {c.title}
                          </h4>
                          <span className="text-xs text-zinc-400 block truncate">
                            {c.subtitle}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleJoin(c.id)}
                        className={`min-h-[40px] px-4 py-1.5 rounded-2xl text-xs font-semibold transition-all duration-200 ease-out active:scale-[0.98] flex items-center gap-2 shrink-0 ${
                          c.joined
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'apple-btn-accent'
                        }`}
                      >
                        {c.joined ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 stroke-[1.75]" />
                            <span>Đã tham gia</span>
                          </>
                        ) : (
                          <span>Tham gia</span>
                        )}
                      </button>
                    </div>

                    {/* Progress info */}
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between gap-4 text-xs font-medium">
                        <span className="text-zinc-400">Tiến độ:</span>
                        <span className="font-display tabular-nums font-semibold text-[#E4483C]">
                          {c.currentVolumeTons} / {c.targetVolumeTons} ({progressPct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden border border-white/10">
                        <div
                          className="h-full rounded-full bg-[#E4483C] transition-all duration-300"
                          style={{
                            width: `${progressPct}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between gap-4 text-xs text-zinc-400 pt-1">
                        <span className="font-display tabular-nums">
                          {c.participantsCount} người tham gia
                        </span>
                        <span className="text-zinc-200 font-medium">{c.rewardBadge}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Clubs Leaderboard Tab */
        <div className="flex flex-col gap-6">
          {!hasUserLoggedWorkout && (
            <ChallengesEmptyState
              variant="no_club_activity"
              onStartWorkout={triggerStartWorkout}
              onConnectFriends={triggerConnectFriends}
            />
          )}

          <div className="apple-card p-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="apple-icon-badge-accent">
                <Shield className="w-5 h-5 stroke-[1.75]" />
              </div>
              <h3 className="font-display text-lg font-bold tracking-tight text-zinc-100">
                Bảng tổng sản lượng câu lạc bộ
              </h3>
            </div>
            <span className="text-xs font-semibold text-emerald-400">
              Cập nhật trực tiếp
            </span>
          </div>

          <div className="apple-card p-6 sm:p-8 flex flex-col divide-y divide-white/10">
            {CLUBS_LEADERBOARD.map((club) => {
              return (
                <div
                  key={club.rank}
                  className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-display tabular-nums font-bold text-sm shrink-0 border ${
                        club.rank === 1
                          ? 'bg-[#E4483C] text-white border-[#E4483C] shadow-xs'
                          : 'bg-white/[0.04] text-zinc-200 border-white/10'
                      }`}
                    >
                      {club.rank}
                    </div>
                    <div className="min-w-0 flex flex-col gap-0.5">
                      <h5 className="font-display font-bold tracking-tight text-base text-zinc-100 truncate">
                        {club.name}
                      </h5>
                      <span className="text-xs text-zinc-400 block">
                        <strong className="font-display tabular-nums text-zinc-200">
                          {club.members}
                        </strong>{' '}
                        thành viên tích cực{' '}
                        {club.isHome ? '· Phòng tập của bạn' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col gap-0.5">
                    <span className="font-display tabular-nums text-sm font-bold text-[#E4483C] block">
                      {club.volume}
                    </span>
                    <span className="text-xs text-zinc-400 block font-medium">Tổng tải</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
