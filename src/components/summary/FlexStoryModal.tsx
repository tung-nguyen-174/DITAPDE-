import React, { useState, useRef, useEffect } from 'react';
import { X, Share2, CheckCircle2, Sparkles, Camera, Trash2, MapPin, Dumbbell } from 'lucide-react';
import { processUploadedMediaFile } from '../../utils/mediaUpload';
import { GymChuotLogo } from '../common/GymChuotLogo';

export interface AttachedStoryMedia {
  type: 'image' | 'video';
  url: string;
  fileName?: string;
  fileSizeLabel?: string;
}

export interface FlexStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userHandle?: string;
  gymLocation: string;
  workoutTitle: string;
  totalVolumeKg: number;
  totalSets: number;
  durationFormatted: string;
  prBadgeText: string;
  muscleSetCounts: Record<string, number>;
  backgroundMedia?: AttachedStoryMedia | null;
  onUpdateBackgroundMedia?: (media: AttachedStoryMedia | null) => void;
}

const PRESET_TAGLINES = [
  'Tập xong không hỏng giò - Không về! 🦵',
  'Đói tạ hơn đái dầm! 🔥',
  'Mệt nhưng mà nó sướng! 💪',
  'Nói ít thôi, nâng tạ đi! 🤐',
  'Thà đau cơ còn hơn đau lòng! ❤️‍🩹',
];

export interface FlexStoryCardProps {
  userName?: string;
  userHandle?: string;
  gymLocation: string;
  workoutTitle: string;
  totalVolumeKg: number;
  totalSets: number;
  durationFormatted: string;
  prBadgeText: string;
  muscleSetCounts: Record<string, number>;
  selectedTagline: string;
  backgroundMedia?: AttachedStoryMedia | null;
  bgVideoRef?: React.RefObject<HTMLVideoElement | null>;
}

export const FlexStoryCard: React.FC<FlexStoryCardProps> = ({
  userHandle = 'tung_powerbuilder',
  gymLocation,
  workoutTitle,
  totalVolumeKg,
  totalSets,
  durationFormatted,
  prBadgeText,
  muscleSetCounts,
  selectedTagline,
  backgroundMedia = null,
  bgVideoRef,
}) => {
  const cleanGymName = gymLocation.replace(/^📍\s*/, '');

  const _buildTelemetryCard = () => {
    const resolvedTotalSets =
      Number.isFinite(totalSets) && totalSets > 0
        ? totalSets
        : Object.values(muscleSetCounts).reduce((sum, count) => sum + (count > 0 ? count : 0), 0);
    const resolvedVolumeKg =
      Number.isFinite(totalVolumeKg) && totalVolumeKg >= 0 ? totalVolumeKg : 0;

    const activeMuscles = Object.entries(muscleSetCounts).filter(([, count]) => count > 0);
    const muscleSummaryText =
      activeMuscles.length > 0
        ? activeMuscles.map(([m, c]) => `${m} (${c})`).join(' • ')
        : Object.keys(muscleSetCounts).join(' • ') || 'Toàn thân';

    return (
      <div className="p-3.5 rounded-[20px] bg-[#17161A]/80 backdrop-blur-md border border-[#35343C] flex flex-col">
        <div className="flex items-center justify-around">
          {/* Metric 1: KHỐI LƯỢNG */}
          <div className="flex flex-col items-center">
            <span className="text-[#9C9AA3] text-[8px] font-bold tracking-[0.8px]">
              KHỐI LƯỢNG
            </span>
            <div className="flex items-baseline gap-0.5 mt-0.5">
              <span className="font-display text-[#F2F1ED] text-[18px] font-semibold tabular-nums">
                {resolvedVolumeKg.toLocaleString()}
              </span>
              <span className="text-[#E4483C] text-[9px] font-bold">KG</span>
            </div>
          </div>

          <div className="h-6 w-px bg-[#35343C]" />

          {/* Metric 2: THỜI GIAN */}
          <div className="flex flex-col items-center">
            <span className="text-[#9C9AA3] text-[8px] font-bold tracking-[0.8px]">
              THỜI GIAN
            </span>
            <div className="flex items-baseline gap-0.5 mt-0.5">
              <span className="font-display text-[#F2F1ED] text-[18px] font-semibold tabular-nums">
                {durationFormatted}
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-[#35343C]" />

          {/* Metric 3: SỐ SET */}
          <div className="flex flex-col items-center">
            <span className="text-[#9C9AA3] text-[8px] font-bold tracking-[0.8px]">
              SỐ SET
            </span>
            <div className="flex items-baseline gap-0.5 mt-0.5">
              <span className="font-display text-[#F2F1ED] text-[18px] font-semibold tabular-nums">
                {resolvedTotalSets}
              </span>
              <span className="text-[#E4483C] text-[9px] font-bold">SETS</span>
            </div>
          </div>
        </div>

        <div className="h-px bg-[#35343C] my-2.5" />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Dumbbell className="w-3.5 h-3.5 text-[#E4483C] stroke-[1.5] shrink-0" />
            <span className="text-[#F2F1ED] text-[10px] font-semibold truncate">
              {muscleSummaryText}
            </span>
          </div>
          <span className="text-[#9C9AA3] text-[10px] shrink-0">
            @{userHandle}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-story-card relative aspect-9/16 w-full rounded-[20px] overflow-hidden border border-[#35343C] bg-[#17161A] shadow-2xl select-none">
      {/* 1. Full-Bleed Background Media with Contrast Scrims */}
      {backgroundMedia ? (
        <div className="absolute inset-0">
          {backgroundMedia.type === 'video' ? (
            <video
              ref={bgVideoRef}
              src={backgroundMedia.url}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={backgroundMedia.url}
              alt="Story Background"
              className="w-full h-full object-cover"
            />
          )}
          <div
            className="absolute inset-0 bg-[#17161A]/35 backdrop-blur-[8px]"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(23,22,26,0.82) 0%, rgba(23,22,26,0) 40%, rgba(23,22,26,0.94) 100%)',
            }}
          />
        </div>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, #28272E 0%, #1F1E24 55%, #17161A 100%)',
          }}
        />
      )}

      {/* 2. Telemetry & "Đi tập đê!" Branding Overlay */}
      <div className="relative z-10 h-full w-full p-5 flex flex-col justify-between">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <GymChuotLogo size="sm" />
            <div className="flex flex-col">
              <span className="font-display text-[#F2F1ED] text-[15px] font-semibold tracking-tight leading-tight">
                ĐI TẬP ĐÊ!
              </span>
              <span className="text-[#E4483C] text-[8px] font-semibold tracking-[0.8px] leading-tight">
                COMMUNITY WORKOUT LOG
              </span>
            </div>
          </div>

          {/* Gym Location Badge */}
          <div className="px-2.5 py-1.5 rounded-[14px] bg-[#17161A]/80 border border-[#35343C] flex items-center gap-1 max-w-[125px] shrink-0">
            <MapPin className="w-3 h-3 text-[#E4483C] stroke-[1.5] shrink-0" />
            <span className="text-[#F2F1ED] text-[10px] font-semibold truncate">
              {cleanGymName}
            </span>
          </div>
        </div>

        {/* Bottom Content Stack */}
        <div className="mt-auto flex flex-col">
          {/* Notable PR Badge */}
          {prBadgeText && (
            <div className="self-start px-3 py-1 mb-3 rounded-[14px] bg-[#E4483C] flex items-center gap-1.5 shadow-sm">
              <span className="text-[12px] leading-none">⚡</span>
              <span className="text-white text-[10px] font-bold tracking-wide uppercase line-clamp-1">
                {prBadgeText}
              </span>
            </div>
          )}

          {/* Workout Title */}
          <h4
            className="font-display text-[#F2F1ED] text-[24px] font-semibold tracking-tight leading-[1.2]"
            style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}
          >
            {workoutTitle}
          </h4>

          {/* Custom Quote / Tagline */}
          <p
            className="text-[#E4483C] text-[13px] font-semibold italic mt-1.5 mb-4"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
          >
            “{selectedTagline}”
          </p>

          {/* Floating Telemetry Matrix Card */}
          {_buildTelemetryCard()}
        </div>
      </div>
    </div>
  );
};

export const FlexStoryModal: React.FC<FlexStoryModalProps> = ({
  isOpen,
  onClose,
  userName = 'Tùng Nguyễn',
  userHandle = 'tung_powerbuilder',
  gymLocation,
  workoutTitle,
  totalVolumeKg,
  totalSets,
  durationFormatted,
  prBadgeText,
  muscleSetCounts,
  backgroundMedia = null,
  onUpdateBackgroundMedia,
}) => {
  const [selectedTagline, setSelectedTagline] = useState<string>(PRESET_TAGLINES[0]);
  const [customTagline, setCustomTagline] = useState<string>('');
  const [localMedia, setLocalMedia] = useState<AttachedStoryMedia | null>(backgroundMedia);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setLocalMedia(backgroundMedia || null);
  }, [backgroundMedia, isOpen]);

  if (!isOpen) return null;

  const cleanGymName = gymLocation.replace(/^📍\s*/, '');
  const resolvedTotalSets =
    Number.isFinite(totalSets) && totalSets > 0
      ? totalSets
      : Object.values(muscleSetCounts).reduce((sum, count) => sum + (count > 0 ? count : 0), 0);
  const resolvedVolumeKg =
    Number.isFinite(totalVolumeKg) && totalVolumeKg >= 0 ? totalVolumeKg : 0;

  const activeMuscles = Object.entries(muscleSetCounts).filter(([, count]) => count > 0);
  const muscleNamesList =
    activeMuscles.length > 0
      ? activeMuscles.map(([m, c]) => `${m} (${c})`)
      : ['Toàn thân'];

  const handleMediaFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const processed = await processUploadedMediaFile(file);
    const nextMedia: AttachedStoryMedia = {
      type: processed.type,
      url: processed.url,
      fileName: processed.fileName,
      fileSizeLabel: processed.fileSizeLabel,
    };
    setLocalMedia(nextMedia);
    if (onUpdateBackgroundMedia) {
      onUpdateBackgroundMedia(nextMedia);
    }
    e.target.value = '';
  };

  const handleClearMedia = () => {
    setLocalMedia(null);
    if (onUpdateBackgroundMedia) {
      onUpdateBackgroundMedia(null);
    }
  };

  const drawCoverMediaOnCanvas = (
    ctx: CanvasRenderingContext2D,
    source: HTMLImageElement | HTMLVideoElement,
    sourceW: number,
    sourceH: number,
    targetW: number,
    targetH: number
  ) => {
    if (!sourceW || !sourceH) return;
    const scale = Math.max(targetW / sourceW, targetH / sourceH);
    const scaledW = sourceW * scale;
    const scaledH = sourceH * scale;
    const offsetX = (targetW - scaledW) / 2;
    const offsetY = (targetH - scaledH) / 2;
    ctx.drawImage(source, offsetX, offsetY, scaledW, scaledH);
  };

  const generateHighResStoryPng = async (): Promise<Blob | null> => {
    const width = 1080;
    const height = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    let mediaDrawn = false;
    if (localMedia?.url) {
      try {
        ctx.save();
        ctx.filter = 'blur(8px)';
        if (localMedia.type === 'video' && bgVideoRef.current) {
          const vid = bgVideoRef.current;
          const vw = vid.videoWidth || 1080;
          const vh = vid.videoHeight || 1920;
          drawCoverMediaOnCanvas(ctx, vid, vw, vh, width, height);
          mediaDrawn = true;
        } else {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Image load error'));
            img.src = localMedia.url;
          });
          drawCoverMediaOnCanvas(
            ctx,
            img,
            img.naturalWidth || width,
            img.naturalHeight || height,
            width,
            height
          );
          mediaDrawn = true;
        }
        ctx.restore();
      } catch (e) {
        ctx.restore();
        console.warn('Fallback to default story gradient:', e);
      }
    }

    if (mediaDrawn) {
      ctx.fillStyle = 'rgba(23, 22, 26, 0.35)';
      ctx.fillRect(0, 0, width, height);

      const scrim = ctx.createLinearGradient(0, 0, 0, height);
      scrim.addColorStop(0, 'rgba(23, 22, 26, 0.82)');
      scrim.addColorStop(0.4, 'rgba(23, 22, 26, 0)');
      scrim.addColorStop(1, 'rgba(23, 22, 26, 0.94)');
      ctx.fillStyle = scrim;
      ctx.fillRect(0, 0, width, height);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#28272E');
      grad.addColorStop(0.55, '#1F1E24');
      grad.addColorStop(1, '#17161A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.strokeStyle = '#35343C';
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // 2. Prominent "ĐI TẬP ĐÊ!" Brand Header (Design System v2 Squircle)
    const logoGrad = ctx.createLinearGradient(68, 80, 162, 174);
    logoGrad.addColorStop(0, '#F37259');
    logoGrad.addColorStop(0.55, '#E4483C');
    logoGrad.addColorStop(1, '#C23629');
    ctx.fillStyle = logoGrad;
    ctx.beginPath();
    ctx.roundRect(68, 80, 94, 94, 24);
    ctx.fill();

    const lx = 68;
    const ly = 80;
    const scale = 94 / 1024;
    const x1 = lx + 307 * scale;
    const y1 = ly + 614 * scale;
    const x2 = lx + 717 * scale;
    const y2 = ly + 410 * scale;

    ctx.strokeStyle = '#17161A';
    ctx.lineWidth = 92 * scale;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.fillStyle = '#17161A';
    ctx.beginPath();
    ctx.arc(x1, y1, 150 * scale, 0, Math.PI * 2);
    ctx.arc(x2, y2, 150 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = logoGrad;
    ctx.beginPath();
    ctx.arc(x1, y1, 58 * scale, 0, Math.PI * 2);
    ctx.arc(x2, y2, 58 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#F2F1ED';
    ctx.font = '700 42px sans-serif';
    ctx.fillText('ĐI TẬP ĐÊ!', 184, 110);

    ctx.fillStyle = '#E4483C';
    ctx.font = '600 21px sans-serif';
    ctx.fillText('COMMUNITY WORKOUT LOG', 184, 148);

    const shortGym = cleanGymName.length > 24 ? `${cleanGymName.slice(0, 24)}...` : cleanGymName;
    ctx.font = '600 26px sans-serif';
    const gymTextWidth = ctx.measureText(shortGym).width;
    const pillWidth = Math.min(440, gymTextWidth + 78);
    const pillX = width - 68 - pillWidth;

    ctx.fillStyle = 'rgba(23, 22, 26, 0.80)';
    ctx.strokeStyle = '#35343C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(pillX, 96, pillWidth, 62, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#E4483C';
    ctx.font = '26px sans-serif';
    ctx.fillText('📍', pillX + 22, 128);

    ctx.fillStyle = '#F2F1ED';
    ctx.font = '600 25px sans-serif';
    ctx.fillText(shortGym, pillX + 54, 129);

    const telemetryCardY = height - 350;
    const telemetryCardH = 270;

    ctx.font = '700 68px sans-serif';
    const words = workoutTitle.split(' ');
    const titleLines: string[] = [];
    let currentLine = '';
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i] + ' ';
      if (ctx.measureText(testLine).width > width - 136 && i > 0) {
        titleLines.push(currentLine.trim());
        currentLine = words[i] + ' ';
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine.trim()) titleLines.push(currentLine.trim());

    const quoteY = telemetryCardY - 64;
    const titleStartY = quoteY - 64 - (titleLines.length - 1) * 78;

    if (prBadgeText) {
      const prUpper = prBadgeText.toUpperCase();
      const shortPr = prUpper.length > 44 ? `${prUpper.slice(0, 44)}...` : prUpper;
      ctx.font = '700 26px sans-serif';
      const prTextW = ctx.measureText(shortPr).width;
      const prPillW = Math.min(width - 136, prTextW + 96);
      const prPillY = titleStartY - 118;

      ctx.save();
      ctx.fillStyle = '#E4483C';
      ctx.beginPath();
      ctx.roundRect(68, prPillY, prPillW, 68, 20);
      ctx.fill();
      ctx.restore();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 26px sans-serif';
      ctx.fillText(`⚡  ${shortPr}`, 98, prPillY + 36);
    }

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#F2F1ED';
    ctx.font = '700 68px sans-serif';
    ctx.textAlign = 'left';
    titleLines.forEach((tLine, idx) => {
      ctx.fillText(tLine, 68, titleStartY + idx * 78);
    });
    ctx.restore();

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#E4483C';
    ctx.font = 'italic 600 34px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`“${selectedTagline}”`, 68, quoteY);
    ctx.restore();

    ctx.fillStyle = 'rgba(23, 22, 26, 0.85)';
    ctx.strokeStyle = '#35343C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(68, telemetryCardY, width - 136, telemetryCardH, 32);
    ctx.fill();
    ctx.stroke();

    const colW = (width - 136) / 3;
    const stravaMetrics = [
      { label: 'KHỐI LƯỢNG', value: `${resolvedVolumeKg.toLocaleString()}`, unit: 'KG' },
      { label: 'THỜI GIAN', value: durationFormatted, unit: '' },
      { label: 'SỐ SET', value: `${resolvedTotalSets}`, unit: 'SETS' },
    ];

    stravaMetrics.forEach((m, idx) => {
      const centerX = 68 + colW * idx + colW / 2;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#9C9AA3';
      ctx.font = '600 20px sans-serif';
      ctx.fillText(m.label, centerX, telemetryCardY + 54);

      ctx.font = '700 48px sans-serif';
      const valW = ctx.measureText(m.value).width;
      ctx.font = '700 22px sans-serif';
      const unitW = m.unit ? ctx.measureText(m.unit).width + 8 : 0;
      const totalW = valW + unitW;

      ctx.textAlign = 'left';
      ctx.fillStyle = '#F2F1ED';
      ctx.font = '700 48px sans-serif';
      ctx.fillText(m.value, centerX - totalW / 2, telemetryCardY + 112);

      if (m.unit) {
        ctx.fillStyle = '#E4483C';
        ctx.font = '700 22px sans-serif';
        ctx.fillText(m.unit, centerX - totalW / 2 + valW + 8, telemetryCardY + 118);
      }

      if (idx < 2) {
        const divX = 68 + colW * (idx + 1);
        ctx.fillStyle = '#35343C';
        ctx.fillRect(divX, telemetryCardY + 52, 2, 68);
      }
    });

    ctx.fillStyle = '#35343C';
    ctx.fillRect(104, telemetryCardY + 168, width - 208, 2);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#E4483C';
    ctx.font = '700 28px sans-serif';
    ctx.fillText('🏋️', 104, telemetryCardY + 216);

    ctx.fillStyle = '#F2F1ED';
    ctx.font = '600 26px sans-serif';
    ctx.fillText(muscleNamesList.join(' • '), 150, telemetryCardY + 216);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#9C9AA3';
    ctx.font = '500 26px sans-serif';
    ctx.fillText(`@${userHandle}`, width - 104, telemetryCardY + 216);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
    });
  };

  const handleExportAndShare = async () => {
    setIsExporting(true);
    setExportSuccessMessage(null);

    try {
      const pngBlob = await generateHighResStoryPng();
      if (!pngBlob) {
        setIsExporting(false);
        return;
      }

      const fileName = `di_tap_de_story_${Date.now()}.png`;
      const file = new File([pngBlob], fileName, { type: 'image/png' });

      if (
        typeof navigator !== 'undefined' &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: 'Đi tập đê! Story Flex',
          text: 'Vừa hoàn thành buổi tập cùng Đi tập đê! 🔥 #DiTapDe',
        });
        setExportSuccessMessage('Đã mở bảng chia sẻ Story thành công!');
      } else {
        const url = URL.createObjectURL(pngBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setExportSuccessMessage('Đã tải ảnh Story HD (1080×1920) về máy!');
      }
    } catch (err) {
      console.error('Error exporting Flex Story card:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleApplyCustomTagline = () => {
    if (customTagline.trim().length > 0) {
      setSelectedTagline(customTagline.trim());
      setCustomTagline('');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-zinc-950/95 border border-white/10 rounded-3xl p-6 flex flex-col gap-5 max-h-[92dvh] overflow-y-auto shadow-2xl backdrop-blur-2xl text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="apple-icon-badge-accent">
              <Sparkles className="w-5 h-5 stroke-[1.75]" />
            </div>
            <h3 className="font-display text-lg font-bold tracking-tight text-zinc-100">
              Xuất Story Flex
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-all duration-200 ease-out active:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-zinc-400"
            aria-label="Đóng"
          >
            <X className="w-5 h-5 stroke-[1.75]" />
          </button>
        </div>

        {/* 9:16 Story Card Canvas Preview */}
        <div ref={cardRef} className="w-full max-w-[300px] mx-auto">
          <FlexStoryCard
            userName={userName}
            userHandle={userHandle}
            gymLocation={gymLocation}
            workoutTitle={workoutTitle}
            totalVolumeKg={resolvedVolumeKg}
            totalSets={resolvedTotalSets}
            durationFormatted={durationFormatted}
            prBadgeText={prBadgeText}
            muscleSetCounts={muscleSetCounts}
            selectedTagline={selectedTagline}
            backgroundMedia={localMedia}
            bgVideoRef={bgVideoRef}
          />
        </div>

        {/* Background Media Picker */}
        <div className="flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-zinc-900/60 border border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <Camera className="w-4 h-4 text-[#E4483C] stroke-[1.75] shrink-0" />
            <span className="text-xs text-zinc-400 truncate">
              {localMedia
                ? `Nền: ${localMedia.fileName || 'Đã đính kèm'}`
                : 'Đính kèm ảnh/video làm nền Story'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <label className="apple-btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer">
              {localMedia ? 'Đổi nền' : 'Chọn ảnh/video'}
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaFileChange}
                className="hidden"
              />
            </label>
            {localMedia && (
              <button
                type="button"
                onClick={handleClearMedia}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-[#E4483C]/20 text-zinc-400 hover:text-[#E4483C] border border-white/10 flex items-center justify-center transition-all duration-200 ease-out active:scale-[0.96]"
                title="Xóa ảnh nền"
              >
                <Trash2 className="w-4 h-4 stroke-[1.75]" />
              </button>
            )}
          </div>
        </div>

        {/* Tagline Selector Carousel */}
        <div className="flex flex-col gap-2">
          <span className="text-[#E4483C] text-[11px] font-semibold tracking-wider uppercase">
            CHỌN QUOTE FLEX:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {PRESET_TAGLINES.map((tag) => {
              const isSelected = tag === selectedTagline;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTagline(tag)}
                  className={`px-3.5 py-1.5 rounded-2xl text-xs whitespace-nowrap transition-all duration-200 ease-out shrink-0 border active:scale-[0.98] ${
                    isSelected
                      ? 'apple-btn-primary shadow-xs'
                      : 'apple-btn-secondary'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Tagline Input */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={customTagline}
            onChange={(e) => setCustomTagline(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyCustomTagline();
              }
            }}
            placeholder="Hoặc tự điền quote riêng của bạn..."
            className="apple-input w-full text-xs pl-3.5 pr-11 py-2.5"
          />
          <button
            type="button"
            onClick={handleApplyCustomTagline}
            className="absolute right-2 w-7 h-7 rounded-lg bg-[#E4483C]/20 border border-[#E4483C]/30 text-[#E4483C] hover:bg-[#E4483C] hover:text-white flex items-center justify-center transition-all duration-200 active:scale-[0.96]"
            title="Áp dụng quote"
          >
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.75]" />
          </button>
        </div>

        {exportSuccessMessage && (
          <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium text-center">
            {exportSuccessMessage}
          </div>
        )}

        {/* Export / Share CTA Button */}
        <button
          type="button"
          onClick={handleExportAndShare}
          disabled={isExporting}
          className="apple-btn-primary w-full min-h-[48px] py-3 px-4 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Đang Tạo Story...</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 stroke-[1.75]" />
              <span>Chia Sẻ Lên Story (HD 1080×1920)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
