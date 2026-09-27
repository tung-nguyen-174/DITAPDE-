export interface ProcessedMediaResult {
  type: 'image' | 'video';
  url: string;
  fileName: string;
  fileSizeLabel: string;
  isPersistableInCloud: boolean;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function processUploadedMediaFile(file: File): Promise<ProcessedMediaResult> {
  const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v|avi)$/i.test(file.name);

  if (isVideo) {
    // Use fast Object URL for immediate smooth video playback on mobile & desktop
    const objectUrl = URL.createObjectURL(file);
    return {
      type: 'video',
      url: objectUrl,
      fileName: file.name || 'workout-video.mp4',
      fileSizeLabel: formatFileSize(file.size),
      isPersistableInCloud: false,
    };
  }

  // For images from mobile camera or library, compress reasonably so it renders fast and can be saved
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 1080;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve({
            type: 'image',
            url: compressedUrl,
            fileName: file.name || 'workout-photo.jpg',
            fileSizeLabel: formatFileSize(file.size),
            isPersistableInCloud: compressedUrl.length < 750000,
          });
        } else {
          resolve({
            type: 'image',
            url: dataUrl,
            fileName: file.name || 'workout-photo.jpg',
            fileSizeLabel: formatFileSize(file.size),
            isPersistableInCloud: dataUrl.length < 750000,
          });
        }
      };
      img.onerror = () => {
        resolve({
          type: 'image',
          url: URL.createObjectURL(file),
          fileName: file.name || 'workout-photo.jpg',
          fileSizeLabel: formatFileSize(file.size),
          isPersistableInCloud: false,
        });
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      resolve({
        type: 'image',
        url: URL.createObjectURL(file),
        fileName: file.name || 'workout-photo.jpg',
        fileSizeLabel: formatFileSize(file.size),
        isPersistableInCloud: false,
      });
    };
    reader.readAsDataURL(file);
  });
}
