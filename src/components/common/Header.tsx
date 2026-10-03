import React, { useState } from 'react';
import {
  Flame,
  Bell,
  Zap,
  UserPlus,
  MessageSquare,
  ShieldAlert,
  Check,
  X,
  Send,
  CheckCheck,
  Dumbbell,
} from 'lucide-react';
import { GymChuotLogo } from './GymChuotLogo';
import { DeviceOrientation, DeviceType } from '../../hooks/useDeviceOrientation';
import { AppNotification, NotificationCategory } from '../../types/gym';

interface HeaderProps {
  currentGym: string;
  streakWeeks: number;
  isPhoneFrame: boolean;
  onTogglePhoneFrame: () => void;
  orientation?: DeviceOrientation;
  deviceType?: DeviceType;
  onToggleRotate?: () => void;
  onShowNotification?: (msg: string) => void;
  notifications?: AppNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  onAcceptFriendRequest?: (notification: AppNotification) => void;
  onDeclineFriendRequest?: (notification: AppNotification) => void;
  onReplyDirectMessage?: (notification: AppNotification, replyText: string) => void;
  onNudgeBack?: (notification: AppNotification) => void;
  onStartWorkout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  streakWeeks,
  notifications = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onAcceptFriendRequest,
  onDeclineFriendRequest,
  onReplyDirectMessage,
  onNudgeBack,
  onStartWorkout,
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | NotificationCategory>('all');
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState<string>('');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications =
    activeFilter === 'all'
      ? notifications
      : notifications.filter((n) => n.category === activeFilter);

  const handleToggleNotifPanel = () => {
    if (isNotifOpen) {
      if (activeFilter === 'all' && unreadCount > 0 && onMarkAllNotificationsRead) {
        onMarkAllNotificationsRead();
      }
      setIsNotifOpen(false);
    } else {
      setIsNotifOpen(true);
    }
  };

  const handleSelectFilter = (filter: 'all' | NotificationCategory) => {
    setActiveFilter(filter);
    if (filter !== 'all' && onMarkNotificationRead) {
      notifications
        .filter((n) => n.category === filter && !n.read)
        .forEach((n) => onMarkNotificationRead(n.id));
    }
  };

  const getCategoryMeta = (category: NotificationCategory) => {
    switch (category) {
      case 'nudge':
        return {
          label: 'Nhắc tập',
          icon: <Zap className="w-4 h-4 text-[#E4483C] stroke-[1.75]" />,
        };
      case 'friend_request':
        return {
          label: 'Lời mời kết bạn',
          icon: <UserPlus className="w-4 h-4 text-[#E4483C] stroke-[1.75]" />,
        };
      case 'direct_message':
        return {
          label: 'Tin nhắn trực tiếp',
          icon: <MessageSquare className="w-4 h-4 text-[#E4483C] stroke-[1.75]" />,
        };
      case 'system':
      default:
        return {
          label: 'Thông báo hệ thống',
          icon: <ShieldAlert className="w-4 h-4 text-zinc-400 stroke-[1.75]" />,
        };
    }
  };

  const handleSendReply = (e: React.FormEvent, notif: AppNotification) => {
    e.preventDefault();
    const trimmed = replyDraft.trim();
    if (!trimmed) return;
    if (onReplyDirectMessage) {
      onReplyDirectMessage(notif, trimmed);
    }
    setReplyDraft('');
    setReplyingId(null);
  };

  return (
    <div className="header-container flex flex-col backdrop-blur-xl bg-zinc-950/85 border-b border-white/10 sticky top-0 z-30 w-full shrink-0 relative">
      <header className="max-w-3xl mx-auto w-full px-6 py-4 flex items-center justify-between gap-6">
        {/* Zone 1: Brand */}
        <div className="group flex items-center gap-3 min-w-0 cursor-pointer transition-transform duration-200 ease-in-out hover:scale-105 active:scale-95 origin-left">
          <div className="transition-transform duration-200 ease-in-out group-hover:scale-105">
            <GymChuotLogo size="sm" />
          </div>
          <span className="font-display text-base font-bold tracking-tight text-zinc-100 group-hover:text-white transition-colors duration-200 ease-in-out select-none truncate">
            DITAPDE!
          </span>
        </div>

        {/* Zone 2: Unboxed Streak Metadata */}
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-zinc-400 font-display tabular-nums shrink-0">
          <Flame className="w-4 h-4 text-[#E0B93D] stroke-[1.75] fill-current" />
          <span className="text-zinc-100 font-semibold">Chuỗi {streakWeeks} tuần</span>
        </div>

        {/* Zone 3: Primary Contextual Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            className={`min-w-[44px] min-h-[44px] w-11 h-11 rounded-2xl transition-all duration-200 ease-out active:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-zinc-400 relative flex items-center justify-center border shadow-sm select-none ${
              isNotifOpen
                ? 'bg-gradient-to-b from-[#EA5A4F] to-[#E4483C] text-white border-white/20 shadow-md shadow-[#E4483C]/25'
                : 'backdrop-blur-md bg-white/[0.08] hover:bg-white/[0.14] text-zinc-100 border-white/10'
            }`}
            title="Thông báo"
            aria-label="Thông báo"
            aria-expanded={isNotifOpen}
            onClick={handleToggleNotifPanel}
          >
            <Bell className="w-5 h-5 stroke-[1.75]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-b from-[#EA5A4F] to-[#E4483C] text-white border border-white/20 font-display tabular-nums text-[10px] font-bold flex items-center justify-center shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Notification Center Popover / Drawer */}
      {isNotifOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/75 backdrop-blur-md transition-opacity duration-200"
            onClick={handleToggleNotifPanel}
          />

          <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 relative z-50">
            <section
              className="my-3 rounded-3xl bg-zinc-950/95 backdrop-blur-2xl border border-white/10 p-6 flex flex-col gap-6 max-h-[78dvh] overflow-hidden shadow-2xl shadow-black/40"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Row: Title + Mark All Seen + Close */}
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="apple-icon-badge-accent">
                    <Bell className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="font-display text-lg font-bold tracking-tight text-zinc-100 truncate">
                      Thông báo của bạn
                    </h3>
                    <span className="font-display tabular-nums text-xs text-zinc-400">
                      {unreadCount > 0 ? `${unreadCount} chưa xem` : 'Đã xem hết tất cả'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {unreadCount > 0 && onMarkAllNotificationsRead && (
                    <button
                      type="button"
                      onClick={() => onMarkAllNotificationsRead()}
                      className="apple-btn-secondary min-h-[40px] px-3.5 py-1.5 text-xs font-medium text-zinc-200 flex items-center gap-1.5"
                    >
                      <CheckCheck className="w-4 h-4 text-[#E4483C] stroke-[1.75]" />
                      <span>Đã xem tất cả</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleToggleNotifPanel}
                    aria-label="Đóng thông báo"
                    className="w-10 h-10 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-all duration-200 ease-out active:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  >
                    <X className="w-5 h-5 stroke-[1.75]" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs (Apple Segmented Control) */}
              <div className="apple-segmented-control overflow-x-auto no-scrollbar whitespace-nowrap">
                {(
                  [
                    { id: 'all', label: `Tất cả (${notifications.length})` },
                    {
                      id: 'nudge',
                      label: `Nhắc tập (${notifications.filter((n) => n.category === 'nudge').length})`,
                    },
                    {
                      id: 'friend_request',
                      label: `Kết bạn (${notifications.filter((n) => n.category === 'friend_request').length})`,
                    },
                    {
                      id: 'direct_message',
                      label: `Tin nhắn (${notifications.filter((n) => n.category === 'direct_message').length})`,
                    },
                    {
                      id: 'system',
                      label: `Hệ thống (${notifications.filter((n) => n.category === 'system').length})`,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSelectFilter(tab.id)}
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ease-out shrink-0 focus:outline-none active:scale-[0.98] ${
                      activeFilter === tab.id
                        ? 'bg-white/15 text-white font-semibold shadow-xs border border-white/10'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Notification Items List */}
              <div className="flex flex-col gap-4 overflow-y-auto max-h-[50dvh] pr-1">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-center flex flex-col items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-100">
                      Không có thông báo nào trong mục này
                    </span>
                    <span className="text-xs text-zinc-400">
                      Mọi cập nhật nhắc tập, kết bạn, tin nhắn và hệ thống sẽ hiển thị tại đây.
                    </span>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => {
                    const meta = getCategoryMeta(notif.category);
                    const isReplying = replyingId === notif.id;

                    return (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (!notif.read && onMarkNotificationRead) {
                            onMarkNotificationRead(notif.id);
                          }
                        }}
                        className={`p-5 rounded-2xl border transition-all duration-200 ease-in-out flex flex-col gap-4 cursor-pointer ${
                          notif.read
                            ? 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06]'
                            : 'bg-white/[0.06] border-[#E4483C]/40 shadow-sm'
                        }`}
                      >
                        {/* Item Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0">
                            {notif.senderAvatar ? (
                              <img
                                src={notif.senderAvatar}
                                alt={notif.senderName || 'Avatar'}
                                className="w-11 h-11 rounded-2xl object-cover border border-white/10 shrink-0"
                              />
                            ) : (
                              <div className="apple-icon-badge">
                                {meta.icon}
                              </div>
                            )}

                            <div className="flex flex-col gap-1 min-w-0">
                              <div className="flex items-center gap-2 text-xs text-zinc-400">
                                <span className="text-[#E4483C] font-medium">
                                  {meta.label}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span>{notif.timestamp}</span>
                              </div>
                              <h4 className="font-display text-sm font-bold tracking-tight text-zinc-100 truncate">
                                {notif.title}
                              </h4>
                            </div>
                          </div>

                          {!notif.read && (
                            <span
                              className="w-2 h-2 rounded-full bg-[#E4483C] shrink-0 mt-2 ring-2 ring-[#E4483C]/20"
                              title="Chưa xem"
                            />
                          )}
                        </div>

                        {/* Body */}
                        <p className="text-sm text-zinc-300 font-normal leading-relaxed">
                          {notif.body}
                        </p>

                        {/* Reply History if replied */}
                        {notif.replyText && (
                          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-zinc-400 flex items-center gap-2">
                            <Check className="w-4 h-4 text-[#E4483C] stroke-[1.75] shrink-0" />
                            <span>
                              Bạn đã trả lời:{' '}
                              <strong className="text-zinc-100">{notif.replyText}</strong>
                            </span>
                          </div>
                        )}

                        {/* Category-Specific Interactive Actions */}
                        {notif.category === 'friend_request' && (
                          <div
                            className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {notif.actionTaken === 'accepted' ? (
                              <div className="text-xs font-medium text-emerald-400 flex items-center gap-2">
                                <Check className="w-4 h-4 stroke-[1.75] shrink-0" />
                                <span>Đã chấp nhận lời mời kết bạn</span>
                              </div>
                            ) : notif.actionTaken === 'declined' ? (
                              <div className="text-xs font-medium text-zinc-500 flex items-center gap-2">
                                <span>Đã từ chối lời mời</span>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onAcceptFriendRequest && onAcceptFriendRequest(notif)
                                  }
                                  className="apple-btn-primary flex-1 basis-[120px] min-h-[44px] px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2"
                                >
                                  <Check className="w-4 h-4 stroke-[1.75] shrink-0" />
                                  <span>Chấp nhận</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onDeclineFriendRequest && onDeclineFriendRequest(notif)
                                  }
                                  className="apple-btn-secondary flex-1 basis-[120px] min-h-[44px] px-4 py-2 text-xs font-medium flex items-center justify-center gap-2"
                                >
                                  <X className="w-4 h-4 stroke-[1.75] shrink-0" />
                                  <span>Từ chối</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {notif.category === 'nudge' && (
                          <div
                            className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (onMarkNotificationRead) onMarkNotificationRead(notif.id);
                                setIsNotifOpen(false);
                                if (onStartWorkout) onStartWorkout();
                              }}
                              className="apple-btn-primary flex-1 basis-[130px] min-h-[44px] px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap"
                            >
                              <Dumbbell className="w-4 h-4 stroke-[1.75] shrink-0" />
                              <span>Vào tập ngay</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onNudgeBack && onNudgeBack(notif)}
                              disabled={notif.actionTaken === 'nudge_back'}
                              className="apple-btn-secondary flex-1 basis-[130px] min-h-[44px] px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-40 whitespace-nowrap"
                            >
                              <Zap className="w-4 h-4 text-[#E4483C] stroke-[1.75] shrink-0" />
                              <span>
                                {notif.actionTaken === 'nudge_back'
                                  ? 'Đã hú lại'
                                  : 'Hú lại bạn tập'}
                              </span>
                            </button>
                          </div>
                        )}

                        {notif.category === 'direct_message' && (
                          <div
                            className="flex flex-col gap-3 pt-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {!isReplying ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onMarkNotificationRead) onMarkNotificationRead(notif.id);
                                  setReplyingId(notif.id);
                                }}
                                className="apple-btn-secondary self-start min-h-[44px] px-4 py-2 text-xs font-medium flex items-center gap-2"
                              >
                                <MessageSquare className="w-4 h-4 text-[#E4483C] stroke-[1.75] shrink-0" />
                                <span>
                                  {notif.replyText ? 'Gửi thêm tin nhắn' : 'Trả lời tin nhắn'}
                                </span>
                              </button>
                            ) : (
                              <form
                                onSubmit={(e) => handleSendReply(e, notif)}
                                className="flex flex-wrap sm:flex-nowrap items-center gap-2.5"
                              >
                                <input
                                  type="text"
                                  value={replyDraft}
                                  onChange={(e) => setReplyDraft(e.target.value)}
                                  placeholder={`Nhắn cho ${notif.senderName || 'bạn tập'}...`}
                                  className="apple-input flex-1 min-w-0 w-full min-h-[44px] px-4 py-2 text-xs text-zinc-100 placeholder-zinc-500"
                                />
                                <button
                                  type="submit"
                                  className="apple-btn-primary min-h-[44px] px-4 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 ml-auto"
                                >
                                  <Send className="w-4 h-4 stroke-[1.75] shrink-0" />
                                  <span>Gửi</span>
                                </button>
                              </form>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};
