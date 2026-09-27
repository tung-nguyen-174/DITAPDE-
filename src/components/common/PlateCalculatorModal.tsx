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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-[#17161A]/85 backdrop-blur-md">
      <div className="bg-[#1F1E24] border border-[#35343C] rounded-[20px] w-full max-w-md overflow-hidden flex flex-col gap-6 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#35343C]">
          <div className="flex items-center gap-3">
            <Disc className="w-5 h-5 text-[#E4483C] stroke-[1.5]" />
            <h3 className="font-display font-semibold text-[17px] tracking-tight text-[#F2F1ED]">
              Tính bánh tạ đòn
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng máy tính bánh tạ"
            className="min-w-[48px] min-h-[48px] w-12 h-12 rounded-[14px] text-[#9C9AA3] hover:text-[#F2F1ED] hover:bg-[#28272E] flex items-center justify-center transition-all duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-[#656470]"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        {/* Target Weight Controls */}
        <div className="flex flex-col items-center gap-4">
          <span className="text-[12.5px] font-medium text-[#9C9AA3]">
            Tổng tải trọng mục tiêu
          </span>

          <div className="flex items-center gap-4">
            <button
              onClick={() => adjustWeight(-5)}
              aria-label="Giảm 5 kg"
              className="min-w-[48px] min-h-[48px] w-12 h-12 rounded-[14px] bg-[#28272E] hover:bg-[#35343C] text-[#F2F1ED] border border-[#35343C] flex items-center justify-center transition-all duration-200 ease-in-out hover:scale-[1.02] focus:outline-hidden focus:ring-2 focus:ring-[#656470]"
            >
              <Minus className="w-5 h-5 stroke-[1.5]" />
            </button>

            <div className="text-center px-3">
              <span className="font-display tabular-nums text-[36px] font-semibold tracking-tight text-[#E4483C]">
                {targetWeight.toFixed(1)}
              </span>
              <span className="font-display text-[16px] font-semibold text-[#9C9AA3] ml-2">
                kg
              </span>
            </div>

            <button
              onClick={() => adjustWeight(5)}
              aria-label="Tăng 5 kg"
              className="min-w-[48px] min-h-[48px] w-12 h-12 rounded-[14px] bg-[#28272E] hover:bg-[#35343C] text-[#F2F1ED] border border-[#35343C] flex items-center justify-center transition-all duration-200 ease-in-out hover:scale-[1.02] focus:outline-hidden focus:ring-2 focus:ring-[#656470]"
            >
              <Plus className="w-5 h-5 stroke-[1.5]" />
            </button>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap justify-center gap-2.5">
            {[60, 80, 100, 120, 140].map((w) => (
              <button
                key={w}
                onClick={() => setTargetWeight(w)}
                className={`min-h-[48px] min-w-[48px] px-3.5 py-2 text-[12.5px] font-semibold rounded-[14px] border transition-all duration-200 ease-in-out font-display tabular-nums focus:outline-hidden focus:ring-2 focus:ring-[#656470] ${
                  targetWeight === w
                    ? 'bg-[#E4483C] text-white border-[#E4483C] shadow-sm'
                    : 'bg-[#28272E] text-[#F2F1ED] border-[#35343C] hover:bg-[#35343C]'
                }`}
              >
                {w} kg
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-[12.5px] text-[#9C9AA3]">
            <span>Đòn tạ Olympic:</span>
            <button
              onClick={() => setBarWeight(barWeight === 20 ? 15 : 20)}
              className="min-h-[48px] min-w-[48px] px-4 py-2 bg-[#28272E] hover:bg-[#35343C] rounded-[14px] text-[#F2F1ED] font-semibold font-display tabular-nums border border-[#35343C] transition-all duration-200 ease-in-out"
            >
              {barWeight} kg
            </button>
          </div>

          {/* Barbell Visual Representation */}
          <div className="w-full bg-[#17161A] p-4 rounded-[14px] border border-[#35343C] flex flex-col items-center gap-3">
            <span className="text-[12.5px] font-medium text-[#9C9AA3]">
              Mô phỏng 1 bên đòn tạ (Chuẩn màu Plate-Code):
            </span>

            <div className="flex items-center justify-center gap-1 h-24 w-full relative">
              <div className="w-8 h-4 bg-[#656470] rounded-l-[14px]" />
              <div className="w-4 h-16 bg-[#9C9AA3]" />

              <div className="flex items-center gap-1.5 bg-[#28272E] p-2.5 rounded-r-[14px] min-w-36 h-24 justify-start border border-[#35343C]">
                {plates.length === 0 ? (
                  <span className="text-[12.5px] text-[#656470] mx-auto">Chỉ đòn không</span>
                ) : (
                  plates.flatMap(({ weight, count }) =>
                    Array.from({ length: count }).map((_, i) => (
                      <div
                        key={`${weight}-${i}`}
                        className={`w-5 ${PLATE_COLORS[weight]?.height || 'h-16'} rounded-[4px] flex items-center justify-center font-display text-[10px] font-bold border border-[#17161A]`}
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
            <div className="w-full pt-3 border-t border-[#35343C] flex flex-wrap gap-3 justify-center">
              {plates.length === 0 ? (
                <span className="text-[12.5px] text-[#9C9AA3]">Không cần lắp bánh</span>
              ) : (
                plates.map(({ weight, count }) => (
                  <div
                    key={weight}
                    className="flex items-center gap-2 text-[12.5px] font-semibold font-display tabular-nums text-[#F2F1ED]"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
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
        <div className="flex gap-3 pt-3 border-t border-[#35343C]">
          <button
            onClick={onClose}
            className="flex-1 min-h-[48px] py-3 rounded-[14px] bg-[#28272E] hover:bg-[#35343C] text-[#F2F1ED] font-semibold text-[15px] border border-[#35343C] transition-all duration-200 ease-in-out"
          >
            Đóng
          </button>
          {onApply && (
            <button
              onClick={() => {
                onApply(targetWeight);
                onClose();
              }}
              className="flex-1 min-h-[48px] py-3 rounded-[14px] bg-[#E4483C] hover:bg-[#C23629] active:scale-95 text-white font-semibold text-[15px] transition-all duration-200 ease-in-out hover:scale-[1.01] shadow-sm"
            >
              Áp dụng ({targetWeight} kg)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
