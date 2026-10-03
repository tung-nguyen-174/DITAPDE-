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
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="backdrop-blur-2xl bg-zinc-950/95 border border-white/10 rounded-3xl w-full max-w-md max-h-[88dvh] flex flex-col overflow-hidden shadow-2xl text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="apple-icon-badge-accent">
              <Pencil className="w-5 h-5 stroke-[1.75]" />
            </div>
            <h3 className="font-display font-bold tracking-tight text-lg text-zinc-100">
              Chỉnh sửa bài viết
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chỉnh sửa"
            className="w-10 h-10 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-all duration-200 ease-out active:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <X className="w-5 h-5 stroke-[1.75]" />
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
              className="apple-input w-full min-h-[44px] px-4 py-2 text-sm"
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
              className="apple-input w-full px-4 py-3 text-sm resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="apple-btn-secondary min-h-[44px] px-4 py-2 text-xs font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="apple-btn-primary min-h-[44px] px-5 py-2 text-xs font-semibold flex items-center gap-2 disabled:opacity-40"
            >
              <Check className="w-4 h-4 stroke-[1.75]" />
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
