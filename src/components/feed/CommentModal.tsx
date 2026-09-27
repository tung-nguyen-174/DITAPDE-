import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, MessageSquare } from 'lucide-react';
import { FeedPost } from '../../types/gym';

interface CommentModalProps {
  post: FeedPost;
  onClose: () => void;
  onAddComment: (postId: string, text: string) => void;
  currentUser?: {
    name?: string;
    avatar?: string;
  };
}

const QUICK_EMOJIS = ['💪', '🔥', '🏆', '👏', '💯', '⚡', '👊', '🦁'];

export const CommentModal: React.FC<CommentModalProps> = ({
  post,
  onClose,
  onAddComment,
  currentUser,
}) => {
  const [inputText, setInputText] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState<number>(0);
  const [sheetMaxHeight, setSheetMaxHeight] = useState<string>('78dvh');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const comments = post.comments || [];

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const vv = window.visualViewport;
    const handleViewportUpdate = () => {
      if (!vv) return;
      const offsetBottom = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
      setKeyboardOffset(offsetBottom);
      setSheetMaxHeight(`${Math.min(vv.height * 0.9, vv.height - 16)}px`);
    };

    if (vv) {
      handleViewportUpdate();
      vv.addEventListener('resize', handleViewportUpdate);
      vv.addEventListener('scroll', handleViewportUpdate);
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      if (vv) {
        vv.removeEventListener('resize', handleViewportUpdate);
        vv.removeEventListener('scroll', handleViewportUpdate);
      }
    };
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments.length, keyboardOffset]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onAddComment(post.id, trimmed);
    setInputText('');
  };

  const handleAddEmoji = (emoji: string) => {
    setInputText((prev) => (prev ? `${prev} ${emoji}` : emoji));
    inputRef.current?.focus();
  };

  const bottomSheetOverlay = (
    <div
      className="fixed inset-0 z-[120] bg-zinc-950/75 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Bảng bình luận bài tập"
    >
      <div
        style={{
          bottom: keyboardOffset > 0 ? `${keyboardOffset}px` : '0px',
          height: sheetMaxHeight,
          maxHeight: sheetMaxHeight,
        }}
        className="fixed inset-x-0 bottom-0 z-[121] mx-auto w-full max-w-2xl backdrop-blur-md bg-zinc-900/95 border-t border-x border-zinc-800 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bottom-Sheet Drag Handle + Header */}
        <div className="shrink-0 border-b border-zinc-800 px-6 pt-3 pb-4 flex flex-col gap-3">
          <div className="w-10 h-1.5 rounded-full bg-zinc-700 mx-auto" />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-emerald-400 stroke-[1.5]" />
              </div>
              <div className="min-w-0 flex flex-col gap-0.5">
                <h3 className="font-display font-bold tracking-tight text-lg text-zinc-100 truncate">
                  Bình luận & cổ vũ ({comments.length})
                </h3>
                <p className="text-xs text-zinc-400 truncate">{post.title}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng bình luận"
              className="min-w-[40px] min-h-[40px] w-10 h-10 rounded-xl bg-zinc-950 hover:bg-zinc-800/60 border border-zinc-800 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 shrink-0"
            >
              <X className="w-5 h-5 stroke-[1.5]" />
            </button>
          </div>
        </div>

        {/* Comment List Container */}
        <div
          ref={listRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-touch px-6 pt-6 pb-40 flex flex-col gap-4"
        >
          {comments.length === 0 ? (
            <div className="py-10 text-center text-zinc-400 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-400">
                <MessageSquare className="w-5 h-5 stroke-[1.5]" />
              </div>
              <p className="font-display font-bold tracking-tight text-zinc-100 text-base">
                Chưa có bình luận nào
              </p>
              <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                Hãy là người đầu tiên để lại lời động viên, Dap hoặc nhận xét buổi tập này!
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3.5">
                <img
                  src={comment.userAvatar}
                  alt={comment.userName}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-xl object-cover border border-zinc-800 shrink-0 mt-1"
                />
                <div className="flex-1 min-w-0 bg-zinc-950/70 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-display font-bold tracking-tight text-sm text-zinc-100 truncate">
                        {comment.userName}
                      </span>
                      {comment.userBadge && (
                        <span className="text-xs text-emerald-400 shrink-0">
                          · {comment.userBadge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-zinc-400 shrink-0">
                      {comment.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed break-words">
                    {comment.text}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Anchored Bottom Input & Emoji Dock */}
      <div
        style={{
          bottom: keyboardOffset > 0 ? `${keyboardOffset}px` : '0px',
        }}
        className="fixed bottom-0 inset-x-0 z-[125] mx-auto w-full max-w-2xl backdrop-blur-md bg-zinc-900/95 border-t border-x border-zinc-800 pb-safe shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Quick Emoji Strip */}
        <div className="px-6 py-2.5 bg-zinc-950/70 border-b border-zinc-800 flex items-center gap-2.5 overflow-x-auto no-scrollbar">
          <span className="text-xs text-zinc-400 shrink-0">Nhanh:</span>
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleAddEmoji(emoji)}
              className="min-w-[40px] min-h-[40px] w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800/60 border border-zinc-800 text-base flex items-center justify-center transition-all duration-200 shrink-0 active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Input Form Row */}
        <form
          onSubmit={handleSubmit}
          className="px-6 py-3.5 flex items-center gap-3"
        >
          <img
            src={
              currentUser?.avatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80'
            }
            alt="Người dùng hiện tại"
            referrerPolicy="no-referrer"
            className="hidden sm:block w-11 h-11 rounded-xl object-cover border border-zinc-800 shrink-0"
          />
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onFocus={() => {
              setTimeout(() => {
                if (listRef.current) {
                  listRef.current.scrollTop = listRef.current.scrollHeight;
                }
              }, 150);
            }}
            placeholder="Viết bình luận, lời khen hoặc mẹo tập..."
            className="flex-1 min-w-0 min-h-[44px] bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 transition-all duration-200"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shrink-0 active:scale-95 focus:outline-none focus:ring-2 focus:ring-zinc-500"
          >
            <Send className="w-4 h-4 stroke-[1.5] shrink-0" />
            <span>Gửi</span>
          </button>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(bottomSheetOverlay, document.body)
    : bottomSheetOverlay;
};
