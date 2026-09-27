import React from 'react';
import { MuscleGroup } from '../../types/gym';
import { getVolumePlateColor, PLATE_CODE_COLORS } from '../../utils/fitnessCalculations';

interface MuscleHeatmapProps {
  volumeMap?: Partial<Record<MuscleGroup, number>>;
  compact?: boolean;
}

export const MuscleHeatmap: React.FC<MuscleHeatmapProps> = ({
  volumeMap = {},
  compact = false,
}) => {
  const getFill = (muscle: MuscleGroup) => {
    const sets = volumeMap[muscle] || 0;
    return getVolumePlateColor(sets);
  };

  const sizeClass = compact ? 'w-16 h-24' : 'w-28 h-40';

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div className="flex items-center justify-center gap-4">
        {/* Front Anatomy View */}
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 160" className={sizeClass}>
            {/* Head & Neck */}
            <circle cx="50" cy="16" r="10" fill="#28272E" stroke="#35343C" strokeWidth="1" />
            <rect x="46" y="26" width="8" height="6" rx="2" fill="#28272E" />

            {/* Front Delts */}
            <path d="M26 34 Q32 30 37 34 L35 48 Q27 46 26 34 Z" fill={getFill('front_delts')} stroke="#17161A" strokeWidth="1" />
            <path d="M74 34 Q68 30 63 34 L65 48 Q73 46 74 34 Z" fill={getFill('front_delts')} stroke="#17161A" strokeWidth="1" />

            {/* Side Delts */}
            <path d="M21 37 Q24 33 27 36 L26 49 Q20 46 21 37 Z" fill={getFill('side_delts')} stroke="#17161A" strokeWidth="1" />
            <path d="M79 37 Q76 33 73 36 L74 49 Q80 46 79 37 Z" fill={getFill('side_delts')} stroke="#17161A" strokeWidth="1" />

            {/* Chest (Pectorals) */}
            <path d="M36 33 L49 33 L49 51 Q40 53 35 47 Z" fill={getFill('chest')} stroke="#17161A" strokeWidth="1" />
            <path d="M64 33 L51 33 L51 51 Q60 53 65 47 Z" fill={getFill('chest')} stroke="#17161A" strokeWidth="1" />

            {/* Biceps */}
            <rect x="21" y="50" width="8" height="18" rx="4" fill={getFill('biceps')} stroke="#17161A" strokeWidth="1" />
            <rect x="71" y="50" width="8" height="18" rx="4" fill={getFill('biceps')} stroke="#17161A" strokeWidth="1" />

            {/* Forearms */}
            <rect x="19" y="69" width="7" height="16" rx="3" fill="#28272E" />
            <rect x="74" y="69" width="7" height="16" rx="3" fill="#28272E" />

            {/* Abs / Core */}
            <rect x="39" y="53" width="10" height="10" rx="2" fill={getFill('abs')} stroke="#17161A" strokeWidth="1" />
            <rect x="51" y="53" width="10" height="10" rx="2" fill={getFill('abs')} stroke="#17161A" strokeWidth="1" />
            <rect x="39" y="65" width="10" height="10" rx="2" fill={getFill('abs')} stroke="#17161A" strokeWidth="1" />
            <rect x="51" y="65" width="10" height="10" rx="2" fill={getFill('abs')} stroke="#17161A" strokeWidth="1" />
            <rect x="40" y="77" width="9" height="9" rx="2" fill={getFill('abs')} stroke="#17161A" strokeWidth="1" />
            <rect x="51" y="77" width="9" height="9" rx="2" fill={getFill('abs')} stroke="#17161A" strokeWidth="1" />

            {/* Quads */}
            <path d="M35 88 L48 88 L47 122 Q37 122 34 106 Z" fill={getFill('quads')} stroke="#17161A" strokeWidth="1" />
            <path d="M65 88 L52 88 L53 122 Q63 122 66 106 Z" fill={getFill('quads')} stroke="#17161A" strokeWidth="1" />

            {/* Calves Front */}
            <rect x="36" y="125" width="9" height="24" rx="4" fill={getFill('calves')} stroke="#17161A" strokeWidth="1" />
            <rect x="55" y="125" width="9" height="24" rx="4" fill={getFill('calves')} stroke="#17161A" strokeWidth="1" />
          </svg>
          {!compact && (
            <span className="text-[11px] font-medium text-[#9C9AA3] mt-1">
              Mặt trước
            </span>
          )}
        </div>

        {/* Back Anatomy View */}
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 100 160" className={sizeClass}>
            {/* Head & Neck */}
            <circle cx="50" cy="16" r="10" fill="#28272E" stroke="#35343C" strokeWidth="1" />
            <rect x="46" y="26" width="8" height="6" rx="2" fill="#28272E" />

            {/* Rear Delts */}
            <path d="M24 35 Q30 31 35 35 L34 48 Q25 46 24 35 Z" fill={getFill('rear_delts')} stroke="#17161A" strokeWidth="1" />
            <path d="M76 35 Q70 31 65 35 L66 48 Q75 46 76 35 Z" fill={getFill('rear_delts')} stroke="#17161A" strokeWidth="1" />

            {/* Upper Back / Traps */}
            <polygon points="36,32 64,32 58,48 42,48" fill={getFill('upper_back')} stroke="#17161A" strokeWidth="1" />

            {/* Lats */}
            <polygon points="34,46 43,49 45,72 37,66" fill={getFill('lats')} stroke="#17161A" strokeWidth="1" />
            <polygon points="66,46 57,49 55,72 63,66" fill={getFill('lats')} stroke="#17161A" strokeWidth="1" />

            {/* Lower Back */}
            <rect x="43" y="68" width="14" height="16" rx="3" fill={getFill('lower_back')} stroke="#17161A" strokeWidth="1" />

            {/* Triceps */}
            <rect x="21" y="50" width="8" height="18" rx="4" fill={getFill('triceps')} stroke="#17161A" strokeWidth="1" />
            <rect x="71" y="50" width="8" height="18" rx="4" fill={getFill('triceps')} stroke="#17161A" strokeWidth="1" />

            {/* Glutes */}
            <path d="M35 85 L49 85 L49 102 Q36 104 35 93 Z" fill={getFill('glutes')} stroke="#17161A" strokeWidth="1" />
            <path d="M65 85 L51 85 L51 102 Q64 104 65 93 Z" fill={getFill('glutes')} stroke="#17161A" strokeWidth="1" />

            {/* Hamstrings */}
            <rect x="36" y="104" width="11" height="20" rx="4" fill={getFill('hamstrings')} stroke="#17161A" strokeWidth="1" />
            <rect x="53" y="104" width="11" height="20" rx="4" fill={getFill('hamstrings')} stroke="#17161A" strokeWidth="1" />

            {/* Calves Back */}
            <rect x="37" y="126" width="9" height="23" rx="4" fill={getFill('calves')} stroke="#17161A" strokeWidth="1" />
            <rect x="54" y="126" width="9" height="23" rx="4" fill={getFill('calves')} stroke="#17161A" strokeWidth="1" />
          </svg>
          {!compact && (
            <span className="text-[11px] font-medium text-[#9C9AA3] mt-1">
              Mặt sau
            </span>
          )}
        </div>
      </div>

      {/* Plate-Code Load / Intensity Legend */}
      {!compact && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-[11px] text-[#9C9AA3]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PLATE_CODE_COLORS.green }} />
            <span>10kg · Nhẹ</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PLATE_CODE_COLORS.yellow }} />
            <span>15kg · Vừa</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PLATE_CODE_COLORS.blue }} />
            <span>20kg · Nặng</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PLATE_CODE_COLORS.red }} />
            <span>25kg · Tối đa</span>
          </span>
        </div>
      )}
    </div>
  );
};
