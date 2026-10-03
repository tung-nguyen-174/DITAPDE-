import React, { useState, useEffect, useMemo } from 'react';
import { Layers, Scale, X, Check } from 'lucide-react';
import { WorkoutExercise } from '../../types/gym';
import { UnitConverter, WeightUnit } from '../../engine/unitConverter';

interface WorkoutEngineToolbarProps {
  userBodyweightKg: number;
  unit: WeightUnit;
  exercises: WorkoutExercise[];
  onChangeBodyweightKg: (nextBodyweightKg: number) => void;
  onChangeUnit: (nextUnit: WeightUnit) => void;
  onCreateSupersetGroup: (
    selectedExerciseIds: string[],
    intraRestSec: number,
    interRoundRestSec: number
  ) => void;
}

export const WorkoutEngineToolbar: React.FC<WorkoutEngineToolbarProps> = ({
  userBodyweightKg,
  unit,
  exercises,
  onChangeBodyweightKg,
  onChangeUnit,
  onCreateSupersetGroup,
}) => {
  const displayBw = UnitConverter.toDisplayValue(userBodyweightKg, unit);
  const [bwInput, setBwInput] = useState<string>(String(displayBw));
  const [showSupersetModal, setShowSupersetModal] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [intraRestSec, setIntraRestSec] = useState<number>(15);
  const [interRoundRestSec, setInterRoundRestSec] = useState<number>(90);

  useEffect(() => {
    setBwInput(String(UnitConverter.toDisplayValue(userBodyweightKg, unit)));
  }, [userBodyweightKg, unit]);

  const ungroupedExercises = useMemo(
    () => exercises.filter((ex) => !ex.supersetGroupId),
    [exercises]
  );

  const handleBwChange = (raw: string) => {
    setBwInput(raw);
    const parsed = parseFloat(raw);
    if (!Number.isNaN(parsed) && parsed > 0) {
      const nextKg = UnitConverter.toDatabaseValue(parsed, unit, userBodyweightKg);
      onChangeBodyweightKg(nextKg);
    }
  };

  const toggleSelectExercise = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <>
      <section className="apple-card p-4 flex flex-wrap items-center justify-between gap-3">
        {/* 1. User Bodyweight Context Input */}
        <div className="flex items-center gap-2.5">
          <div className="apple-icon-badge-accent w-9 h-9 rounded-xl">
            <Scale className="w-4 h-4 stroke-[1.75]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-zinc-400 font-medium">Cân nặng cơ thể (BW)</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step={unit === 'lbs' ? '1' : '0.5'}
                min={20}
                max={unit === 'lbs' ? 700 : 320}
                value={bwInput}
                onChange={(e) => handleBwChange(e.target.value)}
                aria-label="Cân nặng cơ thể"
                className="w-20 min-h-[36px] px-2 py-1 rounded-xl bg-black/40 border border-white/10 font-display tabular-nums text-xs font-semibold text-zinc-100 text-center focus:outline-none focus:border-[#E4483C]"
              />
              <span className="font-display text-xs font-semibold text-zinc-400">
                {unit}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Lossless Multi-Unit Normalization Toggle (KG <-> LBS) */}
        <div className="flex items-center gap-2">
          <div
            className="apple-segmented-control"
            role="group"
            aria-label="Chuyển đổi đơn vị khối lượng"
          >
            <button
              type="button"
              onClick={() => onChangeUnit('kg')}
              className={`min-h-[34px] px-3 py-1 rounded-xl font-display text-xs font-semibold transition-all duration-200 active:scale-[0.98] ${
                unit === 'kg'
                  ? 'bg-white/15 text-white shadow-xs border border-white/10'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              KG
            </button>
            <button
              type="button"
              onClick={() => onChangeUnit('lbs')}
              className={`min-h-[34px] px-3 py-1 rounded-xl font-display text-xs font-semibold transition-all duration-200 active:scale-[0.98] ${
                unit === 'lbs'
                  ? 'bg-white/15 text-white shadow-xs border border-white/10'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              LBS
            </button>
          </div>

          {/* 3. Superset / Tri-set Group Builder Trigger */}
          <button
            type="button"
            onClick={() => {
              setSelectedIds([]);
              setShowSupersetModal(true);
            }}
            disabled={ungroupedExercises.length < 2}
            className="apple-btn-secondary min-h-[38px] px-3.5 py-1.5 text-xs font-semibold gap-1.5 text-[#E0B93D] disabled:opacity-40"
            title="Ghép 2 hoặc 3 bài tập thành Superset hoặc Tri-set xen kẽ"
          >
            <Layers className="w-4 h-4 stroke-[1.75]" />
            <span>Ghép Superset / Tri-set</span>
          </button>
        </div>
      </section>

      {/* Superset / Tri-set Creation Modal */}
      {showSupersetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md bg-zinc-950/95 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-[#E0B93D] stroke-[1.75]" />
                <h3 className="font-display font-bold text-base text-zinc-100 tracking-tight">
                  Tạo nhóm Superset / Tri-set
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSupersetModal(false)}
                className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition active:scale-[0.96]"
                title="Đóng modal"
                aria-label="Đóng modal"
              >
                <X className="w-4 h-4 stroke-[1.75]" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Chọn từ 2 bài tập trở lên để thực hiện xen kẽ từng vòng (ví dụ: Bài A Hiệp 1 → Bài B
              Hiệp 1 → Nghỉ chính).
            </p>

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              {ungroupedExercises.map((ex) => {
                const orderIdx = selectedIds.indexOf(ex.id);
                const isSelected = orderIdx >= 0;
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => toggleSelectExercise(ex.id)}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all duration-200 active:scale-[0.99] ${
                      isSelected
                        ? 'bg-[#E0B93D]/15 border-[#E0B93D]/50 text-zinc-100 shadow-xs'
                        : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-zinc-100'
                    }`}
                  >
                    <div className="min-w-0 flex flex-col gap-0.5">
                      <span className="font-display text-sm font-semibold text-zinc-100 truncate tracking-tight">
                        {ex.name}
                      </span>
                      <span className="text-xs text-zinc-400 truncate">
                        {ex.vietnameseName} · {ex.sets.length} hiệp
                      </span>
                    </div>
                    <span
                      className={`w-7 h-7 rounded-xl font-display text-xs font-bold flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#E0B93D] text-zinc-950 shadow-xs'
                          : 'bg-white/10 text-zinc-400'
                      }`}
                    >
                      {isSelected ? `A${orderIdx + 1}` : '+'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-zinc-400 font-medium">Nghỉ chuyển bài (Intra-rest)</label>
                <select
                  value={intraRestSec}
                  onChange={(e) => setIntraRestSec(Number(e.target.value))}
                  className="min-h-[40px] rounded-xl bg-black/40 border border-white/10 px-3 text-zinc-100 font-display text-xs focus:outline-none focus:border-[#E4483C]"
                >
                  <option value={0}>0 giây (Chuyển ngay)</option>
                  <option value={15}>15 giây</option>
                  <option value={20}>20 giây</option>
                  <option value={30}>30 giây</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-zinc-400 font-medium">Nghỉ hết vòng (Inter-round)</label>
                <select
                  value={interRoundRestSec}
                  onChange={(e) => setInterRoundRestSec(Number(e.target.value))}
                  className="min-h-[40px] rounded-xl bg-black/40 border border-white/10 px-3 text-[#E0B93D] font-display font-semibold text-xs focus:outline-none focus:border-[#E4483C]"
                >
                  <option value={60}>60 giây</option>
                  <option value={90}>90 giây</option>
                  <option value={120}>120 giây</option>
                  <option value={180}>180 giây</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSupersetModal(false)}
                className="apple-btn-secondary min-h-[42px] px-4 py-2 text-xs font-medium"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={selectedIds.length < 2}
                onClick={() => {
                  onCreateSupersetGroup(selectedIds, intraRestSec, interRoundRestSec);
                  setShowSupersetModal(false);
                }}
                className="apple-btn-primary min-h-[42px] px-4 py-2 text-xs font-semibold gap-1.5 disabled:opacity-40"
              >
                <Check className="w-4 h-4 stroke-[1.75]" />
                <span>
                  Kích hoạt {selectedIds.length === 3 ? 'Tri-set' : 'Superset'} (
                  {selectedIds.length} bài)
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
