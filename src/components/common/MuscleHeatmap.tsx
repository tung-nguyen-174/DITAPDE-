import React, { useMemo } from 'react';
import { MuscleGroup, WorkoutExercise } from '../../types/gym';
import { HEATMAP_VOLUME_COLORS } from '../../utils/fitnessCalculations';
import {
  buildSetVolumeMapFromExercisesJson,
  mapStringToMuscleGroup,
} from '../../services/exerciseImporter';

export type HeatmapMuscleKey =
  | MuscleGroup
  | 'frontDelts'
  | 'sideDelts'
  | 'rearDelts'
  | 'upperBack'
  | 'lowerBack'
  | 'innerThigh'
  | 'outerThigh'
  | 'abdominals'
  | 'quadriceps'
  | 'shoulders'
  | 'middle_back'
  | 'traps'
  | 'forearms'
  | 'neck'
  | 'adductors'
  | 'abductors';

export interface MuscleHeatmapProps {
  /** Primary map used across DiTapDe screens */
  volumeMap?: Partial<Record<HeatmapMuscleKey, number>>;
  /** Alias matching Flutter `setVolumeMap` signature (`Map<MuscleGroup, int>`) */
  setVolumeMap?: Partial<Record<HeatmapMuscleKey, number>>;
  /** Optional active workout exercises aligned with `assets/data/exercises.json` */
  exercises?: WorkoutExercise[];
  height?: number;
  width?: number;
  compact?: boolean;
}

/**
 * 1. 4-Tier Volume Intensity Color Interpolation (`muscle_heatmap.dart`):
 * - 0 Sets:   `#334155` (Slate-700 / Inactive)
 * - 1–3 Sets: `#FBBF24` (Amber-400 / Light Activation)
 * - 4–6 Sets: `#FB923C` (Orange-400 / Moderate Fatigue)
 * - 7+ Sets:  `#EF4444` (Red-500 / High Fatigue / Aura Peak)
 */
export function getColorHexForVolume(sets: number): string {
  if (!sets || sets <= 0) return HEATMAP_VOLUME_COLORS.inactive; // #334155
  if (sets <= 3) return HEATMAP_VOLUME_COLORS.light;             // #FBBF24
  if (sets <= 6) return HEATMAP_VOLUME_COLORS.moderate;          // #FB923C
  return HEATMAP_VOLUME_COLORS.peak;                             // #EF4444
}

/**
 * Normalizes any muscle key (snake_case, camelCase, or raw `exercises.json` string)
 * into a canonical `MuscleGroup` + camelCase SVG path ID map.
 */
export function normalizeSetVolumeMap(
  rawMap: Partial<Record<string, number>>
): Record<string, number> {
  const normalized: Record<string, number> = {
    chest: 0,
    lats: 0,
    traps: 0,
    neck: 0,
    upperBack: 0,
    upper_back: 0,
    lowerBack: 0,
    lower_back: 0,
    quads: 0,
    adductors: 0,
    innerThigh: 0,
    abductors: 0,
    outerThigh: 0,
    hamstrings: 0,
    glutes: 0,
    calves: 0,
    frontDelts: 0,
    front_delts: 0,
    sideDelts: 0,
    side_delts: 0,
    rearDelts: 0,
    rear_delts: 0,
    biceps: 0,
    triceps: 0,
    forearms: 0,
    abs: 0,
  };

  Object.entries(rawMap).forEach(([key, val]) => {
    const sets = typeof val === 'number' && !isNaN(val) ? Math.round(val) : 0;
    if (sets <= 0) return;

    const mappedGroup = mapStringToMuscleGroup(
      key
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .toLowerCase()
    );

    normalized[mappedGroup] = Math.max(normalized[mappedGroup] || 0, sets);

    switch (mappedGroup) {
      case 'front_delts':
        normalized.frontDelts = normalized.front_delts;
        break;
      case 'side_delts':
        normalized.sideDelts = normalized.side_delts;
        break;
      case 'rear_delts':
        normalized.rearDelts = normalized.rear_delts;
        break;
      case 'upper_back':
        normalized.upperBack = normalized.upper_back;
        break;
      case 'lower_back':
        normalized.lowerBack = normalized.lower_back;
        break;
      case 'adductors':
        normalized.innerThigh = normalized.adductors;
        break;
      case 'abductors':
        normalized.outerThigh = normalized.abductors;
        // Also highlight inner thigh when abductors are trained
        normalized.adductors = Math.max(normalized.adductors || 0, sets);
        normalized.innerThigh = normalized.adductors;
        break;
      default:
        break;
    }
  });

  return normalized;
}

/**
 * 2. Dynamically injects or replaces `fill="<hexColor>"` on SVG `<path id="<muscle>" ...>` elements
 * based on the provided muscle set-volume map.
 */
export function injectDynamicFills(
  rawSvg: string,
  volumeMap: Partial<Record<HeatmapMuscleKey, number>>
): string {
  let modifiedSvg = rawSvg;
  const normalized = normalizeSetVolumeMap(volumeMap as Record<string, number>);

  const allPathIds = [
    'chest',
    'lats',
    'traps',
    'neck',
    'quads',
    'adductors',
    'innerThigh',
    'abductors',
    'outerThigh',
    'hamstrings',
    'biceps',
    'triceps',
    'forearms',
    'front_delts',
    'frontDelts',
    'side_delts',
    'sideDelts',
    'rear_delts',
    'rearDelts',
    'upper_back',
    'upperBack',
    'lower_back',
    'lowerBack',
    'abs',
    'glutes',
    'calves',
  ];

  for (const id of allPathIds) {
    const volume = normalized[id] ?? 0;
    const hexColor = getColorHexForVolume(volume);
    const idPattern = `id="${id}"`;

    if (modifiedSvg.includes(idPattern)) {
      modifiedSvg = modifiedSvg
        .replace(
          new RegExp(`${idPattern}\\s+pathFill="[^"]*"(\\s+fill="[^"]*")?`, 'g'),
          `${idPattern} fill="${hexColor}"`
        )
        .replace(
          new RegExp(`${idPattern}\\s+fill="[^"]*"`, 'g'),
          `${idPattern} fill="${hexColor}"`
        );
    }
  }

  return modifiedSvg;
}

export const RAW_ANATOMICAL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 200" width="220" height="200">
  <g transform="translate(5, 0)">
    <circle cx="50" cy="22" r="9" fill="#475569" />
    <path id="neck" pathFill="default" fill="#334155" d="M46 31 L54 31 L55 36 L45 36 Z" />
    <path id="traps" pathFill="default" fill="#334155" d="M36 35 L45 32 L45 37 L34 38 Z M64 35 L55 32 L55 37 L66 38 Z" />
    <path id="frontDelts" pathFill="default" fill="#334155" d="M29 38 Q23 40 21 49 Q27 50 31 41 Z M71 38 Q77 40 79 49 Q73 50 69 41 Z" />
    <path id="sideDelts" pathFill="default" fill="#334155" d="M21 43 Q17 48 18 55 Q22 54 23 46 Z M79 43 Q83 48 82 55 Q78 54 77 46 Z" />
    <path id="chest" pathFill="default" fill="#334155" d="M30 40 Q50 35 70 40 L68 58 Q50 62 32 58 Z" />
    <path id="biceps" pathFill="default" fill="#334155" d="M18 42 Q25 42 26 58 Q19 58 17 42 Z M74 42 Q81 42 83 58 Q75 58 74 42 Z" />
    <path id="forearms" pathFill="default" fill="#334155" d="M17 60 L14 78 L20 78 L22 60 Z M83 60 L86 78 L80 78 L78 60 Z" />
    <path id="abs" pathFill="default" fill="#334155" d="M34 62 Q50 64 66 62 L64 95 Q50 98 36 95 Z" />
    <path id="abductors" pathFill="default" fill="#334155" d="M32 96 Q29 108 31 120 L35 120 Q34 108 35 96 Z M68 96 Q71 108 69 120 L65 120 Q66 108 65 96 Z" />
    <path id="quads" pathFill="default" fill="#334155" d="M35 98 L43 98 L42 144 L35 144 Z M65 98 L57 98 L58 144 L65 144 Z" />
    <path id="adductors" pathFill="default" fill="#334155" d="M44 99 L49 99 L47 136 L43 136 Z M56 99 L51 99 L53 136 L57 136 Z" />
    <path id="calves" pathFill="default" fill="#334155" d="M35 149 Q33 164 37 182 L44 182 Q45 164 43 149 Z M65 149 Q67 164 63 182 L56 182 Q55 164 57 149 Z" />
  </g>
  <g transform="translate(115, 0)">
    <circle cx="50" cy="22" r="9" fill="#475569" />
    <path id="neck" pathFill="default" fill="#334155" d="M46 31 L54 31 L55 36 L45 36 Z" />
    <path id="traps" pathFill="default" fill="#334155" d="M38 34 L62 34 L65 40 L50 47 L35 40 Z" />
    <path id="upperBack" pathFill="default" fill="#334155" d="M35 40 L65 40 L68 47 L50 56 L32 47 Z" />
    <path id="rearDelts" pathFill="default" fill="#334155" d="M24 38 Q20 43 22 49 Q28 48 31 41 Z M76 38 Q80 43 78 49 Q72 48 69 41 Z" />
    <path id="lats" pathFill="default" fill="#334155" d="M32 46 L48 56 L45 78 Q33 70 32 46 Z M68 46 L52 56 L55 78 Q67 70 68 46 Z" />
    <path id="lowerBack" pathFill="default" fill="#334155" d="M39 68 L61 68 L59 83 L41 83 Z" />
    <path id="triceps" pathFill="default" fill="#334155" d="M19 46 Q25 46 26 63 Q19 63 18 46 Z M74 46 Q81 46 82 63 Q75 63 74 46 Z" />
    <path id="forearms" pathFill="default" fill="#334155" d="M18 64 L15 80 L21 80 L23 64 Z M82 64 L85 80 L79 80 L77 64 Z" />
    <path id="glutes" pathFill="default" fill="#334155" d="M34 84 Q50 81 66 84 L66 101 Q50 105 34 101 Z" />
    <path id="abductors" pathFill="default" fill="#334155" d="M31 86 Q29 98 32 110 L35 110 Q34 98 34 86 Z M69 86 Q71 98 68 110 L65 110 Q66 98 66 86 Z" />
    <path id="adductors" pathFill="default" fill="#334155" d="M45 103 L49 103 L47 136 L44 136 Z M55 103 L51 103 L53 136 L56 136 Z" />
    <path id="hamstrings" pathFill="default" fill="#334155" d="M35 104 L43 104 L42 145 L36 145 Z M65 104 L57 104 L58 145 L64 145 Z" />
  </g>
</svg>`;

export const MuscleHeatmap: React.FC<MuscleHeatmapProps> = ({
  volumeMap,
  setVolumeMap,
  exercises,
  height,
  width,
  compact = false,
}) => {
  const normalized = useMemo(() => {
    const fromExercises =
      exercises && exercises.length > 0
        ? buildSetVolumeMapFromExercisesJson(exercises, {
            includeUncompletedIfNoneDone: true,
          })
        : {};
    const merged = {
      ...fromExercises,
      ...(volumeMap || {}),
      ...(setVolumeMap || {}),
    };
    return normalizeSetVolumeMap(merged as Record<string, number>);
  }, [exercises, volumeMap, setVolumeMap]);

  const fillFor = (id: string) => getColorHexForVolume(normalized[id] ?? 0);

  const svgStyle =
    height || width
      ? {
          height: height ? `${Math.round(height * 0.55)}px` : undefined,
          width: width ? `${Math.round(width * 0.55)}px` : undefined,
        }
      : undefined;

  return (
    <div
      className={`flex flex-col items-center bg-[#1F1E24] rounded-[20px] p-5 border border-[#35343C] gap-4 ${
        compact ? 'scale-90' : ''
      }`}
    >
      <div className="flex items-center justify-center gap-8 w-full">
        {/* Front Anatomical Vector Silhouette */}
        <div className="flex flex-col items-center gap-2.5">
          <span className="text-[12px] font-medium text-[#9C9AA3]">Mặt trước</span>
          <svg
            viewBox="0 0 100 160"
            style={svgStyle}
            className={svgStyle ? 'object-contain' : 'w-24 h-36'}
          >
            {/* Head & Neck */}
            <circle cx="50" cy="14" r="10" fill="#475569" />
            <path
              id="neck"
              d="M46 24 L54 24 L55 30 L45 30 Z"
              fill={fillFor('neck')}
            />

            {/* Traps (Front) */}
            <path
              id="traps"
              d="M36 29 L45 26 L45 31 L34 31 Z M64 29 L55 26 L55 31 L66 31 Z"
              fill={fillFor('traps')}
            />

            {/* Front Delts */}
            <path
              id="frontDelts"
              d="M32 30 C28 32 25 36 24 42 C28 42 32 38 34 32 Z M68 30 C72 32 75 36 76 42 C72 42 68 38 66 32 Z"
              fill={fillFor('frontDelts')}
            />

            {/* Side Delts */}
            <path
              id="sideDelts"
              d="M24 34 C21 38 20 43 22 46 C24 45 26 41 26 36 Z M76 34 C79 38 80 43 78 46 C76 45 74 41 74 36 Z"
              fill={fillFor('sideDelts')}
            />

            {/* Chest (Pectorals) */}
            <path
              id="chest"
              d="M36 32 C43 32 49 33 49 46 C42 47 36 44 34 38 Z M64 32 C57 32 51 33 51 46 C58 47 64 44 66 38 Z"
              fill={fillFor('chest')}
            />

            {/* Biceps */}
            <path
              id="biceps"
              d="M23 44 C21 48 20 54 22 59 C24 59 26 53 26 46 Z M77 44 C79 48 80 54 78 59 C76 59 74 53 74 46 Z"
              fill={fillFor('biceps')}
            />

            {/* Forearms */}
            <path
              id="forearms"
              d="M21 60 L18 78 L23 78 L24 60 Z M79 60 L82 78 L77 78 L76 60 Z"
              fill={fillFor('forearms')}
            />

            {/* Abs / Core */}
            <path
              id="abs"
              d="M44 48 L56 48 L55 56 L45 56 Z M44 58 L56 58 L54 66 L46 66 Z M45 68 L55 68 L53 76 L47 76 Z"
              fill={fillFor('abs')}
            />

            {/* Abductors (Outer Hip / Thigh) */}
            <path
              id="abductors"
              d="M35 78 C32 88 32 98 34 108 L36 108 C35 98 35 88 37 78 Z M65 78 C68 88 68 98 66 108 L64 108 C65 98 65 88 63 78 Z"
              fill={fillFor('abductors')}
            />

            {/* Quads (Anterior Thighs) */}
            <path
              id="quads"
              d="M37 80 C35 92 35 106 37 118 C41 118 43 108 44 80 Z M63 80 C65 92 65 106 63 118 C59 118 57 108 56 80 Z"
              fill={fillFor('quads')}
            />

            {/* Adductors (Inner Thigh) */}
            <path
              id="adductors"
              d="M45 81 L49 81 C49 96 48 108 46 116 L43 116 C44 106 45 94 45 81 Z M55 81 L51 81 C51 96 52 108 54 116 L57 116 C56 106 55 94 55 81 Z"
              fill={fillFor('adductors')}
            />

            {/* Calves Front */}
            <path
              id="calves"
              d="M36 122 C34 130 35 142 38 152 L43 152 C44 142 43 130 42 122 Z M64 122 C66 130 65 142 62 152 L57 152 C56 142 57 130 58 122 Z"
              fill={fillFor('calves')}
            />
          </svg>
        </div>

        {/* Back Anatomical Vector Silhouette */}
        <div className="flex flex-col items-center gap-2.5">
          <span className="text-[12px] font-medium text-[#9C9AA3]">Mặt sau</span>
          <svg
            viewBox="0 0 100 160"
            style={svgStyle}
            className={svgStyle ? 'object-contain' : 'w-24 h-36'}
          >
            {/* Head & Neck */}
            <circle cx="50" cy="14" r="10" fill="#475569" />
            <path
              id="neckBack"
              d="M46 24 L54 24 L55 30 L45 30 Z"
              fill={fillFor('neck')}
            />

            {/* Traps */}
            <path
              id="trapsBack"
              d="M42 28 L58 28 L63 34 L50 42 L37 34 Z"
              fill={fillFor('traps')}
            />

            {/* Upper Back (Rhomboids / Mid Back) */}
            <path
              id="upperBack"
              d="M37 34 L50 42 L63 34 L65 40 L50 49 L35 40 Z"
              fill={fillFor('upperBack')}
            />

            {/* Rear Delts */}
            <path
              id="rearDelts"
              d="M35 32 C30 33 26 37 26 42 C30 42 33 38 36 34 Z M65 32 C70 33 74 37 74 42 C70 42 67 38 64 34 Z"
              fill={fillFor('rearDelts')}
            />

            {/* Lats */}
            <path
              id="lats"
              d="M37 38 L48 48 L46 64 C38 58 35 48 37 38 Z M63 38 L52 48 L54 64 C62 58 65 48 63 38 Z"
              fill={fillFor('lats')}
            />

            {/* Lower Back (Erectors) */}
            <path
              id="lowerBack"
              d="M44 58 L56 58 L55 71 L45 71 Z"
              fill={fillFor('lowerBack')}
            />

            {/* Triceps */}
            <path
              id="triceps"
              d="M23 42 C20 48 19 54 21 60 C23 60 25 54 25 45 Z M77 42 C80 48 81 54 79 60 C77 60 75 54 75 45 Z"
              fill={fillFor('triceps')}
            />

            {/* Forearms Back */}
            <path
              id="forearmsBack"
              d="M21 61 L18 78 L23 78 L24 61 Z M79 61 L82 78 L77 78 L76 61 Z"
              fill={fillFor('forearms')}
            />

            {/* Glutes */}
            <path
              id="glutes"
              d="M38 72 C44 72 49 76 49 84 C42 86 36 82 36 76 Z M62 72 C56 72 51 76 51 84 C58 86 64 82 64 76 Z"
              fill={fillFor('glutes')}
            />

            {/* Abductors Back (Outer Hip) */}
            <path
              id="abductorsBack"
              d="M35 76 C33 86 33 96 35 106 L37 106 C36 96 36 86 37 76 Z M65 76 C67 86 67 96 65 106 L63 106 C64 96 64 86 63 76 Z"
              fill={fillFor('abductors')}
            />

            {/* Adductors Back (Inner Thigh) */}
            <path
              id="adductorsBack"
              d="M45 86 L49 86 C49 98 48 108 46 116 L43 116 C44 108 45 98 45 86 Z M55 86 L51 86 C51 98 52 108 54 116 L57 116 C56 108 55 98 55 86 Z"
              fill={fillFor('adductors')}
            />

            {/* Hamstrings */}
            <path
              id="hamstrings"
              d="M37 86 C35 98 35 110 38 118 C41 118 43 108 44 86 Z M63 86 C65 98 65 110 62 118 C59 118 57 108 56 86 Z"
              fill={fillFor('hamstrings')}
            />

            {/* Calves Back */}
            <path
              id="calvesBack"
              d="M36 122 C33 130 34 142 38 152 L43 152 C45 142 44 130 42 122 Z M64 122 C67 130 66 142 62 152 L57 152 C55 142 56 130 58 122 Z"
              fill={fillFor('calves')}
            />
          </svg>
        </div>
      </div>

      {/* 4-Tier Volume Intensity Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2 border-t border-[#35343C] w-full text-[12px] text-[#9C9AA3] font-medium">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-[3px] border border-[#475569]"
            style={{ backgroundColor: HEATMAP_VOLUME_COLORS.inactive }}
          />
          <span>Nghỉ (0)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-[3px]"
            style={{ backgroundColor: HEATMAP_VOLUME_COLORS.light }}
          />
          <span>Nhẹ (1–3)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-[3px]"
            style={{ backgroundColor: HEATMAP_VOLUME_COLORS.moderate }}
          />
          <span>Vừa (4–6)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-[3px]"
            style={{ backgroundColor: HEATMAP_VOLUME_COLORS.peak }}
          />
          <span>Cao (7+)</span>
        </div>
      </div>
    </div>
  );
};
