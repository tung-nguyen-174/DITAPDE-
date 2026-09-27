import React, { useRef, useState } from 'react';
import { Camera, Upload, Check, RotateCcw } from 'lucide-react';

export const CUSTOM_AVATAR_STORAGE_KEY = 'ditapde_custom_profile_avatar_v1';

export function getSavedCustomAvatar(): string | null {
  try {
    return localStorage.getItem(CUSTOM_AVATAR_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveCustomAvatar(dataUrl: string | null): void {
  try {
    if (dataUrl) {
      localStorage.setItem(CUSTOM_AVATAR_STORAGE_KEY, dataUrl);
    } else {
      localStorage.removeItem(CUSTOM_AVATAR_STORAGE_KEY);
    }
  } catch (err) {
    console.warn('Could not persist avatar in localStorage:', err);
  }
}

/**
 * Resizes and crops an uploaded image file to a crisp square data URL (320x320)
 * so it renders quickly and persists cleanly in local storage.
 */
function processUploadedImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          const targetSize = 320;
          const canvas = document.createElement('canvas');
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(result);
            return;
          }

          // Center-crop square
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;

          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          resolve(compressed);
        } catch {
          resolve(result);
        }
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export interface ChangeProfileButtonProps {
  currentAvatar: string;
  onAvatarChange: (newAvatarDataUrl: string) => void;
  onResetAvatar?: () => void;
  hasCustomAvatar?: boolean;
}

export const ChangeProfileButton: React.FC<ChangeProfileButtonProps> = ({
  onAvatarChange,
  onResetAvatar,
  hasCustomAvatar = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTriggerUpload = () => {
    setErrorMsg(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn tệp hình ảnh (PNG, JPG, WEBP).');
      e.target.value = '';
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setErrorMsg('Ảnh quá lớn (tối đa 12MB).');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      const optimizedDataUrl = await processUploadedImage(file);
      saveCustomAvatar(optimizedDataUrl);
      onAvatarChange(optimizedDataUrl);
      setJustUpdated(true);
      window.setTimeout(() => setJustUpdated(false), 2200);
    } catch (err) {
      console.error('Error reading uploaded profile image:', err);
      setErrorMsg('Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload profile photo"
      />

      <div className="inline-flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleTriggerUpload}
          disabled={isUploading}
          title="Change your profile picture"
          aria-label="Change your profile"
          className={`min-h-[32px] px-2.5 py-1 rounded-[10px] border text-[11px] font-semibold tracking-tight transition-all duration-200 ease-in-out flex items-center gap-1.5 whitespace-nowrap shrink-0 active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-[#E4483C]/50 ${
            justUpdated
              ? 'bg-[#4CAF6D]/15 border-[#4CAF6D]/60 text-[#4CAF6D]'
              : 'bg-[#28272E] hover:bg-[#35343C] border-[#35343C] hover:border-[#E4483C]/60 text-[#F2F1ED]'
          }`}
        >
          {isUploading ? (
            <>
              <Upload className="w-3.5 h-3.5 text-[#E4483C] animate-bounce stroke-[1.75]" />
              <span>Đang tải...</span>
            </>
          ) : justUpdated ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#4CAF6D] stroke-[2]" />
              <span>Đã đổi ảnh</span>
            </>
          ) : (
            <>
              <Camera className="w-3.5 h-3.5 text-[#E4483C] stroke-[1.75]" />
              <span>Đổi ảnh đại diện</span>
            </>
          )}
        </button>

        {hasCustomAvatar && onResetAvatar && (
          <button
            type="button"
            onClick={() => {
              saveCustomAvatar(null);
              onResetAvatar();
            }}
            title="Khôi phục ảnh mặc định"
            aria-label="Reset profile picture"
            className="min-h-[32px] min-w-[32px] p-1.5 rounded-[10px] bg-[#28272E]/70 hover:bg-[#35343C] border border-[#35343C] text-[#9C9AA3] hover:text-[#F2F1ED] transition-all duration-200 flex items-center justify-center active:scale-95"
          >
            <RotateCcw className="w-3 h-3 stroke-[1.75]" />
          </button>
        )}
      </div>

      {errorMsg && (
        <span className="text-[11px] text-[#E4483C] font-medium">
          {errorMsg}
        </span>
      )}
    </div>
  );
};
