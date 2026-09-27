import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Pencil, Check } from 'lucide-react';
import { FeedPost } from '../../types/gym';

interface EditPostModalProps {
  post: FeedPost;
  onClose: () => void;
  onSave: (postId: string, newTitle: string, newCaption: string) => void;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({
  post,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(post.title);
  const [caption, setCaption] = useState(post.caption);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(post.id, title.trim(), caption.trim());
    onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-zinc-950/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="backdrop-blur-md bg-zinc-900/95 border border-zinc-800 rounded-2xl w-full max-w-md max-h-[88dvh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <Pencil className="w-5 h-5 text-emerald-400 stroke-[1.5]" />
            <h3 className="font-display font-bold tracking-tight text-lg text-zinc-100">
              Chỉnh sửa bài viết
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chỉnh sửa"
            className="min-w-[40px] min-h-[40px] w-10 h-10 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <label className="block text-xs font-medium text-zinc-400">
              Tiêu đề bài viết
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề bài tập..."
              className="w-full min-h-[44px] bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 transition-all duration-200"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="block text-xs font-medium text-zinc-400">
              Cảm nghĩ / lời chia sẻ
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              placeholder="Chia sẻ cảm xúc, mức tạ, mẹo tập luyện..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 resize-none transition-all duration-200"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-100 bg-zinc-950 hover:bg-zinc-800/60 border border-zinc-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="min-h-[44px] px-5 py-2 rounded-xl text-xs font-semibold text-zinc-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 transition-all duration-200 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            >
              <Check className="w-4 h-4 stroke-[1.5]" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
