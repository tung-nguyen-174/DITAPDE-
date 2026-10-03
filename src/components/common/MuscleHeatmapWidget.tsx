import React, { useMemo } from 'react';
import { Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { MuscleGroup, WorkoutExercise } from '../../types/gym';
import {
  getColorHexForVolume,
  normalizeSetVolumeMap,
} from './MuscleHeatmap';
import { HEATMAP_VOLUME_COLORS } from '../../utils/fitnessCalculations';
import { buildSetVolumeMapFromExercisesJson } from '../../services/exerciseImporter';

interface MuscleHeatmapWidgetProps {
  muscleVolumes: { [key: string]: number };
  setVolumeMap?: Partial<Record<MuscleGroup, number>>;
  exercises?: WorkoutExercise[];
  height?: number;
  width?: number;
}

export const MuscleHeatmapWidget: React.FC<MuscleHeatmapWidgetProps> = ({
  muscleVolumes,
  setVolumeMap,
  exercises,
  height = 250,
  width = 280,
}) => {
  const normalizedVectorMap = useMemo<Record<string, number>>(() => {
    const jsonDerivedMap =
      exercises && exercises.length > 0
        ? buildSetVolumeMapFromExercisesJson(exercises, {
            includeUncompletedIfNoneDone: true,
          })
        : {};

    const mergedRaw: Record<string, number> = {
      ...jsonDerivedMap,
      ...(setVolumeMap || {}),
    };

    const base = normalizeSetVolumeMap(mergedRaw);

    const chest = Math.round(base.chest || muscleVolumes.Chest || 0);
    const lats = Math.round(base.lats || muscleVolumes.Back || 0);
    const traps = Math.round(base.traps || 0);
    const neck = Math.round(base.neck || 0);
    const upperBack = Math.round(
      base.upperBack || Math.ceil((muscleVolumes.Back || 0) * 0.6)
    );
    const lowerBack = Math.round(
      base.lowerBack || Math.floor((muscleVolumes.Core || 0) * 0.5)
    );
    const quads = Math.round(base.quads || muscleVolumes.Legs || 0);
    const adductors = Math.round(base.adductors || base.innerThigh || 0);
    const abductors = Math.round(base.abductors || base.outerThigh || 0);
    const hamstrings = Math.round(
      base.hamstrings || Math.floor((muscleVolumes.Legs || 0) * 0.6)
    );
    const glutes = Math.round(
      base.glutes || Math.floor((muscleVolumes.Legs || 0) * 0.5)
    );
    const calves = Math.round(
      base.calves || Math.floor((muscleVolumes.Legs || 0) * 0.4)
    );
    const biceps = Math.round(base.biceps || muscleVolumes.Arms || 0);
    const triceps = Math.round(base.triceps || muscleVolumes.Arms || 0);
    const forearms = Math.round(base.forearms || 0);
    const frontDelts = Math.round(
      base.frontDelts || muscleVolumes.Shoulders || 0
    );
    const sideDelts = Math.round(
      base.sideDelts || Math.ceil((muscleVolumes.Shoulders || 0) * 0.6)
    );
    const rearDelts = Math.round(
      base.rearDelts || Math.floor((muscleVolumes.Shoulders || 0) * 0.5)
    );
    const abs = Math.round(base.abs || muscleVolumes.Core || 0);

    return {
      chest,
      lats,
      traps,
      neck,
      upperBack,
      lowerBack,
      quads,
      adductors,
      innerThigh: adductors,
      abductors,
      outerThigh: abductors,
      hamstrings,
      glutes,
      calves,
      biceps,
      triceps,
      forearms,
      frontDelts,
      sideDelts,
      rearDelts,
      abs,
    };
  }, [muscleVolumes, setVolumeMap, exercises]);

  const fillFor = (key: string) =>
    getColorHexForVolume(normalizedVectorMap[key] ?? 0);

  const vietnameseMuscleLabels: Record<string, string> = {
    Chest: 'Ngực',
    Back: 'Lưng & Xô',
    Shoulders: 'Vai',
    Arms: 'Tay',
    Core: 'Bụng & Lưng dưới',
    Legs: 'Chân & Mông',
  };

  const maxMuscleSets = Math.max(8, ...Object.values(muscleVolumes));

  return (
    <div className="bg-[#1F1E24] border border-[#35343C] rounded-[20px] p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3 pb-3 border-b border-[#35343C]">
        <div className="w-9 h-9 rounded-[12px] bg-[#28272E] border border-[#35343C] flex items-center justify-center text-[#EF4444]">
          <Flame className="w-4 h-4 fill-[#EF4444]" />
        </div>
        <h4 className="font-display text-[16px] font-semibold text-[#F2F1ED]">
          Bản đồ nhiệt cơ bắp
        </h4>
      </div>

      {/* Anatomical Vector SVG */}
      <div className="flex items-center justify-center py-1 relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 220 200"
          width={width}
          height={height}
          className="object-contain"
        >
          {/* FRONT ANATOMICAL VIEW */}
          <g transform="translate(5, 0)">
            <text
              x="50"
              y="12"
              textAnchor="middle"
              fill="#9C9AA3"
              fontSize="8"
              fontWeight="600"
            >
              MẶT TRƯỚC
            </text>
            <circle cx="50" cy="22" r="9" fill="#475569" />
            <path
              id="neck"
              d="M46 31 L54 31 L55 36 L45 36 Z"
              fill={fillFor('neck')}
            />
            <path
              id="traps"
              d="M36 35 L45 32 L45 37 L34 38 Z M64 35 L55 32 L55 37 L66 38 Z"
              fill={fillFor('traps')}
            />
            <path
              id="frontDelts"
              fill={fillFor('frontDelts')}
              d="M29 38 Q23 40 21 49 Q27 50 31 41 Z M71 38 Q77 40 79 49 Q73 50 69 41 Z"
            />
            <path
              id="sideDelts"
              fill={fillFor('sideDelts')}
              d="M21 43 Q17 48 18 55 Q22 54 23 46 Z M79 43 Q83 48 82 55 Q78 54 77 46 Z"
            />
            <path
              id="chest"
              fill={fillFor('chest')}
              d="M30 40 Q50 35 70 40 L68 58 Q50 62 32 58 Z"
            />
            <path
              id="biceps"
              fill={fillFor('biceps')}
              d="M18 42 Q25 42 26 58 Q19 58 17 42 Z M74 42 Q81 42 83 58 Q75 58 74 42 Z"
            />
            <path
              id="forearms"
              fill={fillFor('forearms')}
              d="M17 60 L14 78 L20 78 L22 60 Z M83 60 L86 78 L80 78 L78 60 Z"
            />
            <path
              id="abs"
              fill={fillFor('abs')}
              d="M34 62 Q50 64 66 62 L64 95 Q50 98 36 95 Z"
            />
            <path
              id="abductors"
              fill={fillFor('abductors')}
              d="M32 96 Q29 108 31 120 L35 120 Q34 108 35 96 Z M68 96 Q71 108 69 120 L65 120 Q66 108 65 96 Z"
            />
            <path
              id="quads"
              fill={fillFor('quads')}
              d="M35 98 L43 98 L42 144 L35 144 Z M65 98 L57 98 L58 144 L65 144 Z"
            />
            <path
              id="adductors"
              fill={fillFor('adductors')}
              d="M44 99 L49 99 L47 136 L43 136 Z M56 99 L51 99 L53 136 L57 136 Z"
            />
            <path
              id="calves"
              fill={fillFor('calves')}
              d="M35 149 Q33 164 37 182 L44 182 Q45 164 43 149 Z M65 149 Q67 164 63 182 L56 182 Q55 164 57 149 Z"
            />
          </g>

          <line
            x1="110"
            y1="16"
            x2="110"
            y2="185"
            stroke="#35343C"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* BACK ANATOMICAL VIEW */}
          <g transform="translate(115, 0)">
            <text
              x="50"
              y="12"
              textAnchor="middle"
              fill="#9C9AA3"
              fontSize="8"
              fontWeight="600"
            >
              MẶT SAU
            </text>
            <circle cx="50" cy="22" r="9" fill="#475569" />
            <path
              id="neckBack"
              d="M46 31 L54 31 L55 36 L45 36 Z"
              fill={fillFor('neck')}
            />
            <path
              id="trapsBack"
              d="M38 34 L62 34 L65 40 L50 47 L35 40 Z"
              fill={fillFor('traps')}
            />
            <path
              id="upperBack"
              fill={fillFor('upperBack')}
              d="M35 40 L65 40 L68 47 L50 56 L32 47 Z"
            />
            <path
              id="rearDelts"
              fill={fillFor('rearDelts')}
              d="M24 38 Q20 43 22 49 Q28 48 31 41 Z M76 38 Q80 43 78 49 Q72 48 69 41 Z"
            />
            <path
              id="lats"
              fill={fillFor('lats')}
              d="M32 46 L48 56 L45 78 Q33 70 32 46 Z M68 46 L52 56 L55 78 Q67 70 68 46 Z"
            />
            <path
              id="lowerBack"
              fill={fillFor('lowerBack')}
              d="M39 68 L61 68 L59 83 L41 83 Z"
            />
            <path
              id="triceps"
              fill={fillFor('triceps')}
              d="M19 46 Q25 46 26 63 Q19 63 18 46 Z M74 46 Q81 46 82 63 Q75 63 74 46 Z"
            />
            <path
              id="forearmsBack"
              fill={fillFor('forearms')}
              d="M18 64 L15 80 L21 80 L23 64 Z M82 64 L85 80 L79 80 L77 64 Z"
            />
            <path
              id="glutes"
              fill={fillFor('glutes')}
              d="M34 84 Q50 81 66 84 L66 101 Q50 105 34 101 Z"
            />
            <path
              id="abductorsBack"
              fill={fillFor('abductors')}
              d="M31 86 Q29 98 32 110 L35 110 Q34 98 34 86 Z M69 86 Q71 98 68 110 L65 110 Q66 98 66 86 Z"
            />
            <path
              id="adductorsBack"
              fill={fillFor('adductors')}
              d="M45 103 L49 103 L47 136 L44 136 Z M55 103 L51 103 L53 136 L56 136 Z"
            />
            <path
              id="hamstrings"
              fill={fillFor('hamstrings')}
              d="M35 104 L43 104 L42 145 L36 145 Z M65 104 L57 104 L58 145 L64 145 Z"
            />
          </g>
        </svg>
      </div>

      {/* Clean 4-Tier Legend without hex codes */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-[12px] text-[#9C9AA3]">
        <span className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-[3px] border border-[#475569]"
            style={{ backgroundColor: HEATMAP_VOLUME_COLORS.inactive }}
          />
          <span>Nghỉ (0)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-[3px]"
            style={{ backgroundColor: HEATMAP_VOLUME_COLORS.light }}
          />
          <span>Nhẹ (1–3)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-[3px]"
            style={{ backgroundColor: HEATMAP_VOLUME_COLORS.moderate }}
          />
          <span>Vừa (4–6)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-[3px]"
            style={{ backgroundColor: HEATMAP_VOLUME_COLORS.peak }}
          />
          <span>Cao (7+)</span>
        </span>
      </div>

      {/* Muscle Group Set-Volume Breakdown */}
      <div className="grid grid-cols-2 gap-x-5 gap-y-3 pt-3 border-t border-[#35343C]">
        {Object.entries(muscleVolumes).map(([muscle, vol], idx) => {
          const roundedSets = Math.round(vol);
          const barColor = getColorHexForVolume(roundedSets);
          const pct = Math.min(100, Math.round((roundedSets / maxMuscleSets) * 100));

          return (
            <div key={muscle} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-medium text-[#F2F1ED]">
                  {vietnameseMuscleLabels[muscle] || muscle}
                </span>
                <span
                  className="font-display font-semibold tabular-nums"
                  style={{ color: roundedSets > 0 ? barColor : '#94A3B8' }}
                >
                  {roundedSets} hiệp
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#17161A] border border-[#35343C] overflow-hidden">
                <motion.div
                  initial={{ width: 0, opacity: 0.4 }}
                  animate={{ width: `${pct}%`, opacity: 1 }}
                  transition={{
                    duration: 0.85,
                    delay: 0.1 + idx * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: barColor }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
