import React from 'react';
import { Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { getVolumePlateColor, PLATE_CODE_COLORS } from '../../utils/fitnessCalculations';

interface MuscleHeatmapWidgetProps {
  muscleVolumes: { [key: string]: number };
}

export const MuscleHeatmapWidget: React.FC<MuscleHeatmapWidgetProps> = ({ muscleVolumes }) => {
  const getIntensityColor = (muscleName: string) => {
    const vol = muscleVolumes[muscleName] || 0;
    return getVolumePlateColor(vol);
  };

  const muscles = [
    { key: 'Shoulders', label: 'Vai', cx: 100, cy: 50, rx: 35, ry: 18 },
    { key: 'Chest', label: 'Ngực', cx: 100, cy: 95, rx: 30, ry: 20 },
    { key: 'Core', label: 'Bụng', cx: 100, cy: 145, rx: 25, ry: 22 },
    { key: 'Arms', label: 'Tay', cx: 45, cy: 95, rx: 14, ry: 30 },
    { key: 'ArmsRight', label: 'Tay', cx: 155, cy: 95, rx: 14, ry: 30 },
    { key: 'Legs', label: 'Chân', cx: 100, cy: 215, rx: 28, ry: 38 },
  ];

  const vietnameseMuscleLabels: Record<string, string> = {
    Chest: 'Ngực',
    Shoulders: 'Vai',
    Arms: 'Tay',
    Core: 'Bụng',
    Legs: 'Chân',
  };

  const maxMuscleSets = Math.max(10, ...Object.values(muscleVolumes));

  return (
    <div className="bg-[#1F1E24] border border-[#35343C] rounded-[20px] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#35343C]">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-[14px] bg-[#28272E] border border-[#35343C] flex items-center justify-center text-[#E4483C]">
            <Flame className="w-5 h-5 fill-[#E4483C]" />
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="font-display text-[16px] font-semibold text-[#F2F1ED]">
              Bản đồ nhiệt cơ bắp
            </h4>
            <p className="text-[12px] text-[#9C9AA3] font-normal">
              Cường độ vận động theo hệ màu đĩa tạ
            </p>
          </div>
        </div>
        <span className="text-[12px] font-medium text-[#E4483C]">
          Trực tiếp 2D
        </span>
      </div>

      <div className="flex items-center justify-center py-2 relative">
        <svg width="200" height="260" viewBox="0 0 200 260">
          {muscles.map((m, idx) => {
            const baseKey = m.key === 'ArmsRight' ? 'Arms' : m.key;
            const color = getIntensityColor(baseKey);
            const vol = muscleVolumes[baseKey] || 0;

            return (
              <motion.g
                key={m.key}
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: idx * 0.07,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{ transformOrigin: `${m.cx}px ${m.cy}px` }}
              >
                <ellipse
                  cx={m.cx}
                  cy={m.cy}
                  rx={m.rx}
                  ry={m.ry}
                  fill={color}
                  stroke="#35343C"
                  strokeWidth="2"
                />
                <text
                  x={m.cx}
                  y={m.cy}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#F2F1ED"
                  fontSize="11"
                  fontWeight="600"
                  className="font-display pointer-events-none select-none"
                >
                  {vol > 0 ? `${vol}s` : ''}
                </text>
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* Plate-code Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-[12px] text-[#9C9AA3]">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-[14px]" style={{ backgroundColor: PLATE_CODE_COLORS.green }} />
          <span>Nhẹ (1–3)</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-[14px]" style={{ backgroundColor: PLATE_CODE_COLORS.yellow }} />
          <span>Vừa (4–5)</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-[14px]" style={{ backgroundColor: PLATE_CODE_COLORS.blue }} />
          <span>Nặng (6–8)</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-[14px]" style={{ backgroundColor: PLATE_CODE_COLORS.red }} />
          <span>Tối đa (9+)</span>
        </span>
      </div>

      {/* Animated Muscle Group Heatmap Progress Bars */}
      <div className="flex flex-col gap-3 pt-3 border-t border-[#35343C]">
        {Object.entries(muscleVolumes).map(([muscle, vol], idx) => {
          const barColor = vol > 0 ? getIntensityColor(muscle) : '#35343C';
          const pct = Math.min(100, Math.round((vol / maxMuscleSets) * 100));

          return (
            <div key={muscle} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-medium text-[#F2F1ED]">
                  {vietnameseMuscleLabels[muscle] || muscle}
                </span>
                <span
                  className="font-display font-semibold tabular-nums"
                  style={{ color: vol > 0 ? barColor : '#656470' }}
                >
                  {vol} hiệp ({pct}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#17161A] border border-[#35343C] overflow-hidden">
                <motion.div
                  initial={{ width: 0, opacity: 0.4 }}
                  animate={{ width: `${pct}%`, opacity: 1 }}
                  transition={{
                    duration: 0.85,
                    delay: 0.15 + idx * 0.1,
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

      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#35343C]">
        {Object.entries(muscleVolumes)
          .slice(0, 3)
          .map(([muscle, vol], idx) => {
            const pct = Math.min(100, Math.round((vol / maxMuscleSets) * 100));
            const color = vol > 0 ? getIntensityColor(muscle) : '#656470';
            return (
              <div
                key={muscle}
                className="bg-[#17161A] p-3 rounded-[14px] text-center border border-[#35343C] space-y-1.5"
              >
                <div className="text-[12px] text-[#9C9AA3] font-normal">
                  {vietnameseMuscleLabels[muscle] || muscle}
                </div>
                <div
                  className="font-display text-[14px] font-semibold tabular-nums"
                  style={{ color }}
                >
                  {vol} hiệp
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#28272E] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      duration: 0.8,
                      delay: 0.3 + idx * 0.1,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: vol > 0 ? color : '#35343C' }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
