import React, { useState } from 'react';
import { X, Disc, Plus, Minus } from 'lucide-react';
import { PLATE_CODE_COLORS } from '../../utils/fitnessCalculations';

interface PlateCalculatorModalProps {
  initialWeight?: number;
  onClose: () => void;
  onApply?: (weight: number) => void;
}

export const PlateCalculatorModal: React.FC<PlateCalculatorModalProps> = ({
  initialWeight = 100,
  onClose,
  onApply,
}) => {
  const [targetWeight, setTargetWeight] = useState<number>(initialWeight);
  const [barWeight, setBarWeight] = useState<number>(20);

  // Bumper plate colors from DiTapDe Design System v2
  const PLATE_COLORS: Record<number, { bg: string; text: string; height: string }> = {
    25: { bg: PLATE_CODE_COLORS.red, text: '#F2F1ED', height: 'h-24' },
    20: { bg: PLATE_CODE_COLORS.blue, text: '#F2F1ED', height: 'h-24' },
    15: { bg: PLATE_CODE_COLORS.yellow, text: '#17161A', height: 'h-20' },
    10: { bg: PLATE_CODE_COLORS.green, text: '#17161A', height: 'h-16' },
    5: { bg: '#F2F1ED', text: '#17161A', height: 'h-12' },
    2.5: { bg: '#28272E', text: '#F2F1ED', height: 'h-10' },
    1.25: { bg: '#9C9AA3', text: '#17161A', height: 'h-8' },
  };

  const availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25];

  const calculatePlatesPerSide = () => {
    let remainder = Math.max(0, (targetWeight - barWeight) / 2);
    const result: { weight: number; count: number }[] = [];

    for (const plate of availablePlates) {
      const count = Math.floor(remainder / plate);
      if (count > 0) {
        result.push({ weight: plate, count });
        remainder -= count * plate;
      }
    }
    return { plates: result, remainingPerSide: remainder };
  };

  const { plates } = calculatePlatesPerSide();

  const adjustWeight = (delta: number) => {
    setTargetWeight((prev) => Math.max(barWeight, prev + delta));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md">
      <div className="bg-zinc-950/95 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden flex flex-col gap-6 p-6 shadow-2xl backdrop-blur-2xl text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="apple-icon-badge-accent">
              <Disc className="w-5 h-5 stroke-[1.75]" />
            </div>
            <h3 className="font-display font-semibold text-lg tracking-tight text-zinc-100">
              Tính bánh tạ đòn
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng máy tính bánh tạ"
            className="w-10 h-10 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-all duration-200 ease-out active:scale-[0.96] focus:outline-none focus:ring-2 focus:ring-zinc-400"
          >
            <X className="w-5 h-5 stroke-[1.75]" />
          </button>
        </div>

        {/* Target Weight Controls */}
        <div className="flex flex-col items-center gap-4">
          <span className="text-xs font-medium text-zinc-400">
            Tổng tải trọng mục tiêu
          </span>

          <div className="flex items-center gap-4">
            <button
              onClick={() => adjustWeight(-5)}
              aria-label="Giảm 5 kg"
              className="apple-btn-secondary w-12 h-12 rounded-2xl text-zinc-100 flex items-center justify-center"
            >
              <Minus className="w-5 h-5 stroke-[1.75]" />
            </button>

            <div className="text-center px-3">
              <span className="font-display tabular-nums text-4xl font-bold tracking-tight text-[#E4483C]">
                {targetWeight.toFixed(1)}
              </span>
              <span className="font-display text-base font-semibold text-zinc-400 ml-2">
                kg
              </span>
            </div>

            <button
              onClick={() => adjustWeight(5)}
              aria-label="Tăng 5 kg"
              className="apple-btn-secondary w-12 h-12 rounded-2xl text-zinc-100 flex items-center justify-center"
            >
              <Plus className="w-5 h-5 stroke-[1.75]" />
            </button>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap justify-center gap-2">
            {[60, 80, 100, 120, 140].map((w) => (
              <button
                key={w}
                onClick={() => setTargetWeight(w)}
                className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-2xl border transition-all duration-200 ease-out font-display tabular-nums active:scale-[0.98] ${
                  targetWeight === w
                    ? 'apple-btn-primary shadow-xs'
                    : 'apple-btn-secondary'
                }`}
              >
                {w} kg
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span>Đòn tạ Olympic:</span>
            <button
              onClick={() => setBarWeight(barWeight === 20 ? 15 : 20)}
              className="apple-btn-secondary px-3.5 py-1.5 rounded-xl font-semibold font-display tabular-nums text-xs"
            >
              {barWeight} kg
            </button>
          </div>

          {/* Barbell Visual Representation */}
          <div className="w-full bg-zinc-900/60 p-4 rounded-2xl border border-white/10 flex flex-col items-center gap-3">
            <span className="text-xs font-medium text-zinc-400">
              Mô phỏng 1 bên đòn tạ (Chuẩn màu Plate-Code):
            </span>

            <div className="flex items-center justify-center gap-1 h-24 w-full relative">
              <div className="w-8 h-4 bg-zinc-700 rounded-l-lg" />
              <div className="w-4 h-16 bg-zinc-500" />

              <div className="flex items-center gap-1.5 bg-zinc-950/80 p-2.5 rounded-r-xl min-w-36 h-24 justify-start border border-white/10">
                {plates.length === 0 ? (
                  <span className="text-xs text-zinc-500 mx-auto">Chỉ đòn không</span>
                ) : (
                  plates.flatMap(({ weight, count }) =>
                    Array.from({ length: count }).map((_, i) => (
                      <div
                        key={`${weight}-${i}`}
                        className={`w-5 ${PLATE_COLORS[weight]?.height || 'h-16'} rounded-sm flex items-center justify-center font-display text-[10px] font-bold border border-black/40`}
                        style={{
                          backgroundColor: PLATE_COLORS[weight]?.bg || '#28272E',
                          color: PLATE_COLORS[weight]?.text || '#F2F1ED',
                        }}
                        title={`${weight} kg`}
                      >
                        <span className="-rotate-90 whitespace-nowrap">{weight}</span>
                      </div>
                    ))
                  )
                )}
              </div>
            </div>

            {/* List breakdown */}
            <div className="w-full pt-3 border-t border-white/10 flex flex-wrap gap-3 justify-center">
              {plates.length === 0 ? (
                <span className="text-xs text-zinc-400">Không cần lắp bánh</span>
              ) : (
                plates.map(({ weight, count }) => (
                  <div
                    key={weight}
                    className="flex items-center gap-2 text-xs font-semibold font-display tabular-nums text-zinc-200"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: PLATE_COLORS[weight]?.bg }}
                    />
                    <span>
                      {count} × {weight} kg
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="apple-btn-secondary flex-1 min-h-[44px] py-2.5 font-medium text-sm"
          >
            Đóng
          </button>
          {onApply && (
            <button
              onClick={() => {
                onApply(targetWeight);
                onClose();
              }}
              className="apple-btn-primary flex-1 min-h-[44px] py-2.5 font-semibold text-sm"
            >
              Áp dụng ({targetWeight} kg)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
