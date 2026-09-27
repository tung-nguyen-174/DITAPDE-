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
      {/* Switcher: Thử thách vs CLB Gym */}
      <div className="flex backdrop-blur-md bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800 gap-2 shadow-sm">
        <button
          onClick={() => setActiveTab('challenges')}
          className={`flex-1 min-h-[44px] py-2 px-4 text-sm font-medium rounded-xl transition-all duration-200 ease-in-out flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-zinc-500 ${
            activeTab === 'challenges'
              ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
          }`}
        >
          <Trophy className="w-4 h-4 stroke-[1.5]" />
          <span>Thử thách tháng</span>
        </button>
        <button
          onClick={() => setActiveTab('clubs')}
          className={`flex-1 min-h-[44px] py-2 px-4 text-sm font-medium rounded-xl transition-all duration-200 ease-in-out flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-zinc-500 ${
            activeTab === 'clubs'
              ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-sm'
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
          }`}
        >
          <Shield className="w-4 h-4 stroke-[1.5]" />
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
          <section className="p-6 sm:p-8 rounded-2xl backdrop-blur-md bg-zinc-900/50 border border-emerald-500/40 shadow-sm flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-emerald-400 shrink-0">
                  <Dumbbell className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-emerald-400 block">
                    Sự kiện tháng này
                  </span>
                  <h2 className="font-display font-bold tracking-tight text-lg sm:text-xl text-zinc-100 leading-snug">
                    Thử thách 100 tấn tháng này
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400 shrink-0">
                <Clock className="w-4 h-4 text-emerald-400 stroke-[1.5]" />
                <span className="font-display tabular-nums">Còn 12 ngày</span>
              </div>
            </div>

            <p className="text-sm text-zinc-400 font-normal leading-relaxed">
              Nâng tổng sản lượng đạt 100,000 kg tạ tích lũy để mở khóa huy hiệu Chuột Titan và vinh danh bảng vàng.
            </p>

            {/* Progress Bar */}
            <div className="bg-zinc-950/70 p-5 rounded-xl border border-zinc-800 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="text-zinc-400">Tiến độ cá nhân:</span>
                <span className="font-display tabular-nums font-semibold text-emerald-400">
                  {personalTons.toFixed(1)} / 100.0 tấn ({personalPct}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                  style={{
                    width: `${Math.max(hasUserLoggedWorkout ? personalPct : 3, personalPct)}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-zinc-400 stroke-[1.5]" />
                  <span className="font-display tabular-nums">1,420 người đang tham gia</span>
                </span>
                <span className="text-emerald-400 font-medium">Huy hiệu Chuột Titan</span>
              </div>
            </div>
          </section>

          {/* Filter Tabs for Challenges */}
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar whitespace-nowrap">
            <button
              type="button"
              onClick={() => setChallengeFilter('all')}
              className={`min-h-[44px] px-5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ease-in-out shrink-0 focus:outline-none focus:ring-2 focus:ring-zinc-500 ${
                challengeFilter === 'all'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                  : 'backdrop-blur-md bg-zinc-900/50 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-zinc-800'
              }`}
            >
              Tất cả thử thách ({challenges.length})
            </button>
            <button
              type="button"
              onClick={() => setChallengeFilter('joined')}
              className={`min-h-[44px] px-5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ease-in-out shrink-0 focus:outline-none focus:ring-2 focus:ring-zinc-500 ${
                challengeFilter === 'joined'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                  : 'backdrop-blur-md bg-zinc-900/50 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-zinc-800'
              }`}
            >
              Đang tham gia ({joinedChallenges.length})
            </button>
            <button
              type="button"
              onClick={() => setChallengeFilter('my_logs')}
              className={`min-h-[44px] px-5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ease-in-out shrink-0 focus:outline-none focus:ring-2 focus:ring-zinc-500 ${
                challengeFilter === 'my_logs'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                  : 'backdrop-blur-md bg-zinc-900/50 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-zinc-800'
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
            <div className="flex flex-col gap-6">
              {displayedChallenges.map((c) => {
                const progressPct = Math.min(
                  100,
                  Math.round((c.currentVolumeTons / c.targetVolumeTons) * 100)
                );

                return (
                  <div
                    key={c.id}
                    className="backdrop-blur-md bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all duration-200 ease-in-out p-6 sm:p-8 flex flex-col gap-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4 pb-5 border-b border-zinc-800">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-emerald-400 shrink-0">
                          <Trophy className="w-5 h-5 stroke-[1.5]" />
                        </div>
                        <div className="min-w-0 flex flex-col gap-1">
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
                        className={`min-h-[44px] px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-zinc-500 flex items-center gap-2 shrink-0 shadow-sm ${
                          c.joined
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
                        }`}
                      >
                        {c.joined ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 stroke-[1.5]" />
                            <span>Đã tham gia</span>
                          </>
                        ) : (
                          <span>Tham gia</span>
                        )}
                      </button>
                    </div>

                    {/* Progress info */}
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between gap-4 text-xs">
                        <span className="text-zinc-400">Tiến độ:</span>
                        <span className="font-display tabular-nums font-semibold text-emerald-400">
                          {c.currentVolumeTons} / {c.targetVolumeTons} ({progressPct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                        <div
                          className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                          style={{
                            width: `${progressPct}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between gap-4 text-xs text-zinc-400 pt-1">
                        <span className="font-display tabular-nums">
                          {c.participantsCount} người tham gia
                        </span>
                        <span className="text-zinc-100 font-medium">{c.rewardBadge}</span>
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

          <div className="p-6 backdrop-blur-md bg-zinc-900/50 rounded-2xl border border-zinc-800 flex items-center justify-between gap-4 shadow-sm">
            <h3 className="font-display text-lg font-bold tracking-tight text-zinc-100">
              Bảng tổng sản lượng câu lạc bộ
            </h3>
            <span className="text-xs font-medium text-emerald-400">
              Cập nhật trực tiếp
            </span>
          </div>

          <div className="backdrop-blur-md bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 sm:p-8 flex flex-col divide-y divide-zinc-800 shadow-sm">
            {CLUBS_LEADERBOARD.map((club) => {
              return (
                <div
                  key={club.rank}
                  className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-display tabular-nums font-bold text-sm shrink-0 border ${
                        club.rank === 1
                          ? 'bg-emerald-500 text-zinc-950 border-emerald-500'
                          : 'bg-zinc-950 text-zinc-100 border-zinc-800'
                      }`}
                    >
                      {club.rank}
                    </div>
                    <div className="min-w-0 flex flex-col gap-1">
                      <h5 className="font-display font-bold tracking-tight text-base text-zinc-100 truncate">
                        {club.name}
                      </h5>
                      <span className="text-xs text-zinc-400 block">
                        <strong className="font-display tabular-nums text-zinc-100">
                          {club.members}
                        </strong>{' '}
                        thành viên tích cực{' '}
                        {club.isHome ? '· Phòng tập của bạn' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col gap-1">
                    <span className="font-display tabular-nums text-sm font-bold text-emerald-400 block">
                      {club.volume}
                    </span>
                    <span className="text-xs text-zinc-400 block">Tổng tải</span>
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
