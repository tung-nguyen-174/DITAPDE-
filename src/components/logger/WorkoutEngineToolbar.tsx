import React, { useState, useEffect, useMemo } from 'react';
import { Layers, Scale, CheckCircle2, X, Check } from 'lucide-react';
import { WorkoutExercise } from '../../types/gym';
import { UnitConverter, WeightUnit } from '../../engine/unitConverter';
import { runWorkoutEngineTestSuite } from '../../engine/__tests__/workoutExecutionEngine.test';

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
  const [showTestDrawer, setShowTestDrawer] = useState<boolean>(false);
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

  const testSummary = useMemo(() => runWorkoutEngineTestSuite(), [showTestDrawer]);

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
      <section className="bg-[#1F1E24] rounded-[20px] border border-[#35343C] p-4 flex flex-wrap items-center justify-between gap-3">
        {/* 1. User Bodyweight Context Input */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[12px] bg-[#28272E] border border-[#35343C] flex items-center justify-center text-[#E4483C] shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-[#9C9AA3]">Cân nặng cơ thể (BW)</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step={unit === 'lbs' ? '1' : '0.5'}
                min={20}
                max={unit === 'lbs' ? 700 : 320}
                value={bwInput}
                onChange={(e) => handleBwChange(e.target.value)}
                aria-label="Cân nặng cơ thể"
                className="w-20 min-h-[36px] px-2 py-1 rounded-[10px] bg-[#28272E] border border-[#35343C] font-display tabular-nums text-[13px] font-semibold text-[#F2F1ED] text-center focus:outline-hidden focus:border-[#E4483C]"
              />
              <span className="font-display text-[12px] font-semibold text-[#9C9AA3]">
                {unit}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Lossless Multi-Unit Normalization Toggle (KG <-> LBS) */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center bg-[#17161A] p-1 rounded-[12px] border border-[#35343C]"
            role="group"
            aria-label="Chuyển đổi đơn vị khối lượng"
          >
            <button
              type="button"
              onClick={() => onChangeUnit('kg')}
              className={`min-h-[36px] px-3 py-1 rounded-[10px] font-display text-[12px] font-semibold transition ${
                unit === 'kg'
                  ? 'bg-[#E4483C] text-[#F2F1ED]'
                  : 'text-[#9C9AA3] hover:text-[#F2F1ED]'
              }`}
            >
              KG
            </button>
            <button
              type="button"
              onClick={() => onChangeUnit('lbs')}
              className={`min-h-[36px] px-3 py-1 rounded-[10px] font-display text-[12px] font-semibold transition ${
                unit === 'lbs'
                  ? 'bg-[#E4483C] text-[#F2F1ED]'
                  : 'text-[#9C9AA3] hover:text-[#F2F1ED]'
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
            className="min-h-[40px] px-3.5 py-2 rounded-[12px] bg-[#28272E] hover:bg-[#35343C] disabled:opacity-40 border border-[#E0B93D]/50 text-[#E0B93D] font-semibold text-[12px] transition flex items-center gap-1.5"
            title="Ghép 2 hoặc 3 bài tập thành Superset hoặc Tri-set xen kẽ"
          >
            <Layers className="w-4 h-4" />
            <span>Ghép Superset / Tri-set</span>
          </button>

          {/* 4. Engine Edge-Case Unit Tests Verifier */}
          <button
            type="button"
            onClick={() => setShowTestDrawer(true)}
            className="min-h-[40px] px-3 py-2 rounded-[12px] bg-[#28272E] hover:bg-[#35343C] border border-[#4CAF6D]/40 text-[#4CAF6D] font-display font-semibold text-[12px] transition flex items-center gap-1.5"
            title="Kiểm tra bộ Unit Tests của Workout Execution Engine"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Tests ({testSummary.passedCount}/{testSummary.totalCount})
            </span>
          </button>
        </div>
      </section>

      {/* Superset / Tri-set Creation Modal */}
      {showSupersetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#1F1E24] rounded-[20px] border border-[#35343C] p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 border-b border-[#35343C] pb-3">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-[#E0B93D]" />
                <h3 className="font-display font-bold text-[17px] text-[#F2F1ED]">
                  Tạo nhóm Superset / Tri-set
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSupersetModal(false)}
                className="w-10 h-10 rounded-[12px] text-[#9C9AA3] hover:text-[#F2F1ED] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[13px] text-[#9C9AA3]">
              Chọn từ 2 bài tập trở lên để thực hiện xen kẽ từng vòng (ví dụ: Bài A Hiệp 1 → Bài B
              Hiệp 1 → Nghỉ chính).
            </p>

            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              {ungroupedExercises.map((ex) => {
                const orderIdx = selectedIds.indexOf(ex.id);
                const isSelected = orderIdx >= 0;
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => toggleSelectExercise(ex.id)}
                    className={`p-3 rounded-[14px] border text-left flex items-center justify-between gap-3 transition ${
                      isSelected
                        ? 'bg-[#E0B93D]/15 border-[#E0B93D] text-[#F2F1ED]'
                        : 'bg-[#17161A] border-[#35343C] text-[#9C9AA3] hover:text-[#F2F1ED]'
                    }`}
                  >
                    <div className="min-w-0 flex flex-col">
                      <span className="font-display text-[14px] font-semibold text-[#F2F1ED] truncate">
                        {ex.name}
                      </span>
                      <span className="text-[12px] text-[#9C9AA3] truncate">
                        {ex.vietnameseName} · {ex.sets.length} hiệp
                      </span>
                    </div>
                    <span
                      className={`w-7 h-7 rounded-[10px] font-display text-[12px] font-bold flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#E0B93D] text-[#17161A]'
                          : 'bg-[#28272E] text-[#656470]'
                      }`}
                    >
                      {isSelected ? `A${orderIdx + 1}` : '+'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#35343C] text-[12px]">
              <div className="flex flex-col gap-1">
                <label className="text-[#9C9AA3]">Nghỉ chuyển bài (Intra-rest)</label>
                <select
                  value={intraRestSec}
                  onChange={(e) => setIntraRestSec(Number(e.target.value))}
                  className="min-h-[40px] rounded-[12px] bg-[#28272E] border border-[#35343C] px-3 text-[#F2F1ED] font-display"
                >
                  <option value={0}>0 giây (Chuyển ngay)</option>
                  <option value={15}>15 giây</option>
                  <option value={20}>20 giây</option>
                  <option value={30}>30 giây</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[#9C9AA3]">Nghỉ hết vòng (Inter-round)</label>
                <select
                  value={interRoundRestSec}
                  onChange={(e) => setInterRoundRestSec(Number(e.target.value))}
                  className="min-h-[40px] rounded-[12px] bg-[#28272E] border border-[#35343C] px-3 text-[#E0B93D] font-display font-semibold"
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
                className="min-h-[44px] px-4 py-2 rounded-[12px] bg-[#28272E] text-[#F2F1ED] text-[13px] font-medium"
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
                className="min-h-[44px] px-4 py-2 rounded-[12px] bg-[#E0B93D] hover:bg-[#caa532] disabled:opacity-40 text-[#17161A] font-display font-bold text-[13px] flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>
                  Kích hoạt {selectedIds.length === 3 ? 'Tri-set' : 'Superset'} (
                  {selectedIds.length} bài)
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unit Test Suite Verification Modal */}
      {showTestDrawer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[85vh] bg-[#1F1E24] rounded-[20px] border border-[#35343C] p-5 flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-[#35343C] pb-3">
              <div>
                <h3 className="font-display font-bold text-[17px] text-[#F2F1ED]">
                  Workout Execution Engine · Unit Test Suite
                </h3>
                <p className="text-[12px] text-[#4CAF6D]">
                  Đã vượt qua {testSummary.passedCount}/{testSummary.totalCount} bài kiểm thử thuật
                  toán & Edge Cases
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTestDrawer(false)}
                className="w-10 h-10 rounded-[12px] text-[#9C9AA3] hover:text-[#F2F1ED] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
              {testSummary.results.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-[12px] bg-[#17161A] border border-[#35343C] flex flex-col gap-1 text-[12px]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display font-semibold text-[#F2F1ED]">
                      [{r.id}] {r.name}
                    </span>
                    <span
                      className={`font-display font-bold ${
                        r.passed ? 'text-[#4CAF6D]' : 'text-[#E4483C]'
                      }`}
                    >
                      {r.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[#9C9AA3] truncate">
                    Result: {r.actual}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
