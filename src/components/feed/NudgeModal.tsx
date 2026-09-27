import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Bell, Zap, CheckCircle2, Edit3, Plus, Trash2, Flame } from 'lucide-react';
import { GymBuddy } from '../../types/gym';
import { GymChuotLogo } from '../common/GymChuotLogo';

interface NudgeModalProps {
  buddy: GymBuddy;
  onClose: () => void;
  onSendNudge: (buddyId: string, message: string) => boolean | void;
}

const CUSTOM_NUDGE_STORAGE_KEY = 'ditapde_custom_nudge_presets';

export const NudgeModal: React.FC<NudgeModalProps> = ({
  buddy,
  onClose,
  onSendNudge,
}) => {
  const NUDGE_PRESETS = [
    'Đi tập đê anh ơi! Đừng lười nữa!',
    'Hôm nay lịch chân mà dám trốn à?',
    'Qua phòng tập đi em bao nước Pre-workout!',
    'Giữ vững chuỗi 6 tuần, đi tập đê!',
    'Đẩy ngực 100 kg đang đợi người giải cứu đây!',
  ];

  const [savedCustomPresets, setSavedCustomPresets] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_NUDGE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedMessage, setSelectedMessage] = useState<string>(NUDGE_PRESETS[0]);
  const [isCustomSelected, setIsCustomSelected] = useState<boolean>(false);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isSent, setIsSent] = useState(false);

  const effectiveMessage = isCustomSelected
    ? customMessage.trim() || selectedMessage
    : selectedMessage;

  const handleSaveCustomToPresets = () => {
    const trimmed = customMessage.trim();
    if (!trimmed) return;
    if (!savedCustomPresets.includes(trimmed) && !NUDGE_PRESETS.includes(trimmed)) {
      const updated = [trimmed, ...savedCustomPresets];
      setSavedCustomPresets(updated);
      try {
        localStorage.setItem(CUSTOM_NUDGE_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
    }
    setSelectedMessage(trimmed);
    setIsCustomSelected(false);
    setCustomMessage('');
  };

  const handleDeleteCustomPreset = (msgToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedCustomPresets.filter((m) => m !== msgToRemove);
    setSavedCustomPresets(updated);
    try {
      localStorage.setItem(CUSTOM_NUDGE_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
    if (selectedMessage === msgToRemove) {
      setSelectedMessage(NUDGE_PRESETS[0]);
    }
  };

  const handleSend = () => {
    const messageToSend = effectiveMessage;
    if (!messageToSend) return;
    const allowed = onSendNudge(buddy.id, messageToSend);
    if (allowed === false) {
      onClose();
      return;
    }
    setIsSent(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-zinc-950/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="backdrop-blur-md bg-zinc-900/95 border border-zinc-800 rounded-2xl w-full max-w-md max-h-[88dvh] flex flex-col overflow-hidden p-6 gap-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <GymChuotLogo size="sm" />
            <div className="flex flex-col gap-0.5 min-w-0">
              <h3 className="font-display font-bold tracking-tight text-lg text-zinc-100 truncate">
                Nhắc tập "Đi tập đê!"
              </h3>
              <p className="text-xs text-zinc-400 truncate">
                Thúc giục bạn tập không bỏ lỡ buổi tập
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng nhắc tập"
            className="min-w-[40px] min-h-[40px] w-10 h-10 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 shrink-0"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        {isSent ? (
          <div className="py-8 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h4 className="font-display text-lg font-bold tracking-tight text-zinc-100">
              Đã gửi lời nhắc tập thành công!
            </h4>
            <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
              Thông báo <span className="text-emerald-400 font-medium">"{effectiveMessage}"</span> đã gửi tới{' '}
              <span className="text-zinc-100 font-semibold">{buddy.name}</span>. Hẹn gặp nhau ở phòng tập!
            </p>
          </div>
        ) : (
          <>
            {/* Scrollable Body */}
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4 pr-0.5">
              {/* Target Buddy Info */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 shrink-0">
                <img
                  src={buddy.avatar}
                  alt={buddy.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover border border-zinc-800 shrink-0"
                />
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display font-bold tracking-tight text-sm sm:text-base text-zinc-100 truncate">
                      {buddy.name}
                    </span>
                    <span className="text-xs font-display font-medium text-emerald-400 flex items-center gap-1 shrink-0">
                      <Flame className="w-3.5 h-3.5 stroke-[1.5]" />
                      {buddy.streakWeeks} tuần
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400 block truncate">
                    {buddy.gymLocation}
                  </span>
                </div>
              </div>

              {/* Presets Header & Custom Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
                <span className="text-xs text-zinc-400">
                  Chọn hoặc tự soạn lời nhắn:
                </span>
                <button
                  type="button"
                  onClick={() => setIsCustomSelected((prev) => !prev)}
                  className={`min-h-[40px] text-xs font-medium flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 shrink-0 ${
                    isCustomSelected
                      ? 'bg-emerald-500 text-zinc-950 border-emerald-500 font-semibold'
                      : 'bg-zinc-950 text-zinc-100 border-zinc-800 hover:bg-zinc-800/60'
                  }`}
                >
                  <Edit3 className="w-4 h-4 stroke-[1.5] shrink-0" />
                  <span>{isCustomSelected ? 'Đang tự soạn' : 'Tự soạn lời nhắn'}</span>
                </button>
              </div>

              {/* Presets & Custom Input List */}
              <div className="flex flex-col gap-2.5">
                {/* Custom Nudge Composer Option */}
                <div
                  onClick={() => setIsCustomSelected(true)}
                  className={`w-full rounded-xl border transition-all duration-200 p-4 cursor-pointer flex flex-col gap-3 ${
                    isCustomSelected
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-2">
                      <Edit3 className="w-4 h-4 stroke-[1.5] shrink-0" />
                      <span>Tự soạn lời nhắn của riêng bạn</span>
                    </span>
                    {isCustomSelected && <Zap className="w-4 h-4 text-emerald-400 stroke-[1.5] shrink-0" />}
                  </div>
                  <div
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={customMessage}
                      onFocus={() => setIsCustomSelected(true)}
                      onChange={(e) => {
                        setCustomMessage(e.target.value);
                        if (!isCustomSelected) setIsCustomSelected(true);
                      }}
                      maxLength={120}
                      placeholder={`Nhập lời nhắn gửi ${buddy.name.split(' ')[0]}...`}
                      className="w-full min-w-0 flex-1 min-h-[44px] bg-zinc-950 border border-zinc-800 focus:ring-2 focus:ring-zinc-500 focus:outline-none rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 transition-all duration-200"
                    />
                    {customMessage.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={handleSaveCustomToPresets}
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold shrink-0 flex items-center justify-center gap-1.5 transition-all duration-200"
                        title="Lưu vào danh sách mẫu của bạn"
                      >
                        <Plus className="w-4 h-4 stroke-[1.5] shrink-0" />
                        <span>Lưu mẫu</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* User's Saved Custom Presets */}
                {savedCustomPresets.map((msg, idx) => {
                  const isActive = !isCustomSelected && selectedMessage === msg;
                  return (
                    <button
                      key={`custom-${idx}`}
                      type="button"
                      onClick={() => {
                        setSelectedMessage(msg);
                        setIsCustomSelected(false);
                      }}
                      className={`w-full min-h-[48px] text-left p-3.5 rounded-xl text-sm font-normal border transition-all duration-200 flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-zinc-100'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xs font-semibold text-emerald-400 shrink-0">
                          Mẫu ·
                        </span>
                        <span className="break-words line-clamp-2">{msg}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isActive && <Zap className="w-4 h-4 text-emerald-400 stroke-[1.5]" />}
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => handleDeleteCustomPreset(msg, e)}
                          className="min-w-[36px] min-h-[36px] w-9 h-9 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-all duration-200"
                          title="Xóa mẫu lời nhắn này"
                        >
                          <Trash2 className="w-4 h-4 stroke-[1.5]" />
                        </span>
                      </div>
                    </button>
                  );
                })}

                {/* Default Presets */}
                {NUDGE_PRESETS.map((msg, i) => {
                  const isActive = !isCustomSelected && selectedMessage === msg;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedMessage(msg);
                        setIsCustomSelected(false);
                      }}
                      className={`w-full min-h-[48px] text-left p-3.5 rounded-xl text-sm font-normal border transition-all duration-200 flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-zinc-100 font-medium'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800/60'
                      }`}
                    >
                      <span className="leading-snug">{msg}</span>
                      {isActive && <Zap className="w-4 h-4 text-emerald-400 stroke-[1.5] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sticky Submit Button Footer */}
            <div className="pt-4 border-t border-zinc-800 shrink-0">
              <button
                type="button"
                onClick={handleSend}
                disabled={isCustomSelected && !customMessage.trim()}
                className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-semibold text-sm shadow-sm transition-all duration-200 ease-in-out hover:scale-[1.01] active:scale-95 focus:outline-none focus:ring-2 focus:ring-zinc-500 flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4 stroke-[1.5] shrink-0" />
                <span>
                  {isCustomSelected && customMessage.trim()
                    ? 'Gửi lời nhắn tự soạn ngay'
                    : 'Gửi "Đi tập đê!" ngay'}
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
