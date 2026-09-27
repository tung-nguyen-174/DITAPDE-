import React, { useState, useEffect } from 'react';
import { Check, Flame, AlertCircle } from 'lucide-react';
import { ExerciseSet, WorkoutExercise } from '../../types/gym';
import { getRpePlateColor, PLATE_CODE_COLORS } from '../../utils/fitnessCalculations';
import {
  ExerciseType,
  UserBiometrics,
  calculateSetE1RM,
  resolveEffectiveWeightKg,
  resolveBodyweightEngagementFactor,
  classifyExerciseType,
  DEFAULT_USER_BODYWEIGHT_KG,
} from '../../engine/workoutExecutionEngine';
import { UnitConverter, WeightUnit } from '../../engine/unitConverter';

interface ValidatedSetRowProps {
  set: ExerciseSet;
  exIdx: number;
  setIdx: number;
  bestE1rm?: number;
  exercise?: Pick<
    WorkoutExercise,
    'id' | 'name' | 'vietnameseName' | 'exerciseType' | 'bodyweightEngagementFactor'
  >;
  userBodyweightKg?: number;
  unit?: WeightUnit;
  /** Optional station code in Interleaved Superset/Tri-set mode (e.g. "A1", "A2", "A3") */
  stationBadge?: string;
  /** Optional exercise title shown inline when rendered inside an Interleaved Superset Round */
  interleavedExerciseName?: string;
  /** Highlights this set as the current active step in an Interleaved Superset/Tri-set */
  isActiveFocusStep?: boolean;
  onUpdateWeight: (exIdx: number, setIdx: number, baseWeightKgVal: number) => void;
  onUpdateReps: (exIdx: number, setIdx: number, repsVal: number) => void;
  onUpdateRpe: (exIdx: number, setIdx: number, rpeVal: number) => void;
  onToggleComplete: (exIdx: number, setIdx: number) => void;
}

export const ValidatedSetRow: React.FC<ValidatedSetRowProps> = ({
  set,
  exIdx,
  setIdx,
  bestE1rm = 0,
  exercise,
  userBodyweightKg = DEFAULT_USER_BODYWEIGHT_KG,
  unit = 'kg',
  stationBadge,
  interleavedExerciseName,
  isActiveFocusStep = false,
  onUpdateWeight,
  onUpdateReps,
  onUpdateRpe,
  onToggleComplete,
}) => {
  const exType: ExerciseType = classifyExerciseType(exercise);
  const canonicalBaseKg =
    set.baseWeightKg !== undefined && !Number.isNaN(set.baseWeightKg)
      ? set.baseWeightKg
      : set.weight;

  const displayWeightVal = UnitConverter.toDisplayValue(canonicalBaseKg, unit);
  const maxAllowedDisplayWeight = unit === 'lbs' ? 1100 : 500;

  const [weightInput, setWeightInput] = useState<string>(String(displayWeightVal));
  const [repsInput, setRepsInput] = useState<string>(String(set.reps));
  const [rpeInput, setRpeInput] = useState<string>(String(set.rpe));

  const [weightError, setWeightError] = useState<string | null>(null);
  const [repsError, setRepsError] = useState<string | null>(null);
  const [rpeError, setRpeError] = useState<string | null>(null);

  // Sync display weight when canonical baseWeightKg or unit preference changes
  useEffect(() => {
    const nextDisplay = UnitConverter.toDisplayValue(canonicalBaseKg, unit);
    setWeightInput(String(nextDisplay));
    setWeightError(null);
  }, [canonicalBaseKg, unit]);

  useEffect(() => {
    setRepsInput(String(set.reps));
  }, [set.reps]);

  useEffect(() => {
    setRpeInput(String(set.rpe));
  }, [set.rpe]);

  const handleWeightChange = (raw: string) => {
    setWeightInput(raw);
    if (raw.trim() === '') {
      setWeightError(null);
      onUpdateWeight(exIdx, setIdx, 0);
      return;
    }

    const parsed = parseFloat(raw);
    if (isNaN(parsed) || parsed < 0) {
      setWeightError(`Mức tạ không hợp lệ (≥ 0 ${unit})`);
      return;
    }

    if (parsed > maxAllowedDisplayWeight) {
      setWeightError(`Mức tạ vượt giới hạn an toàn (> ${maxAllowedDisplayWeight} ${unit})`);
      return;
    }

    setWeightError(null);
    const nextBaseKg = UnitConverter.toDatabaseValue(parsed, unit, canonicalBaseKg);
    onUpdateWeight(exIdx, setIdx, nextBaseKg);
  };

  const handleWeightBlur = () => {
    const parsed = parseFloat(weightInput);
    if (isNaN(parsed) || parsed < 0) {
      setWeightInput(String(UnitConverter.toDisplayValue(canonicalBaseKg, unit)));
      setWeightError(null);
    } else if (parsed > maxAllowedDisplayWeight) {
      const clampedKg = UnitConverter.toDatabaseValue(maxAllowedDisplayWeight, unit);
      onUpdateWeight(exIdx, setIdx, clampedKg);
      setWeightInput(String(maxAllowedDisplayWeight));
      setWeightError(null);
    }
  };

  const handleRepsChange = (raw: string) => {
    setRepsInput(raw);
    if (raw.trim() === '') {
      setRepsError(null);
      onUpdateReps(exIdx, setIdx, 0);
      return;
    }

    const parsed = parseInt(raw, 10);
    if (isNaN(parsed) || parsed < 0) {
      setRepsError('Số lần lặp không hợp lệ (≥ 0)');
      return;
    }

    if (parsed > 100) {
      setRepsError('Số lần lặp vượt giới hạn (> 100 lần đã bị chặn)');
      return;
    }

    setRepsError(null);
    onUpdateReps(exIdx, setIdx, parsed);
  };

  const handleRepsBlur = () => {
    const parsed = parseInt(repsInput, 10);
    if (isNaN(parsed) || parsed < 0) {
      setRepsInput(String(set.reps));
      setRepsError(null);
    } else if (parsed > 100) {
      onUpdateReps(exIdx, setIdx, 100);
      setRepsInput('100');
    }
  };

  const handleRpeChange = (raw: string) => {
    setRpeInput(raw);
    if (raw.trim() === '') {
      setRpeError(null);
      return;
    }

    const parsed = parseFloat(raw);
    if (isNaN(parsed) || parsed < 1) {
      setRpeError('RPE tối thiểu là 1.0');
      return;
    }

    if (parsed > 10) {
      setRpeError('Chỉ số RPE vượt ngưỡng tối đa (> 10 đã bị chặn)');
      return;
    }

    setRpeError(null);
    onUpdateRpe(exIdx, setIdx, parsed);
  };

  const handleRpeBlur = () => {
    const parsed = parseFloat(rpeInput);
    if (isNaN(parsed) || parsed < 1) {
      setRpeInput(String(set.rpe));
      setRpeError(null);
    } else if (parsed > 10) {
      onUpdateRpe(exIdx, setIdx, 10);
      setRpeInput('10');
    }
  };

  const biometrics: UserBiometrics = {
    bodyweightKg: userBodyweightKg,
    preferredUnit: unit,
  };

  const effectiveExercise = exercise || {
    id: `ex-${exIdx}`,
    name: 'Exercise',
    exerciseType: 'BARBELL_DUMBBELL_CABLE' as ExerciseType,
  };

  const isChecked = set.completed;
  const effectiveWeightKg = resolveEffectiveWeightKg(effectiveExercise, set, biometrics);
  const setE1rmKg = calculateSetE1RM(effectiveExercise, set, biometrics);
  const displayE1rm = UnitConverter.toDisplayValue(setE1rmKg, unit, { step: 0.1 });
  const isTopE1RM = bestE1rm > 0 && Math.abs(setE1rmKg - bestE1rm) < 0.15 && effectiveWeightKg > 0;
  const activeError = weightError || repsError || rpeError;
  const rpeColor = getRpePlateColor(set.rpe);
  const alphaFactor = resolveBodyweightEngagementFactor(effectiveExercise);

  return (
    <div className="flex flex-col gap-2">
      {interleavedExerciseName && (
        <div className="flex items-center justify-between gap-2 px-1 pt-1">
          <div className="flex items-center gap-2 min-w-0">
            {stationBadge && (
              <span
                className={`px-2 py-0.5 rounded-[8px] font-display text-[11px] font-bold tracking-tight shrink-0 ${
                  isActiveFocusStep
                    ? 'bg-[#E4483C] text-[#F2F1ED]'
                    : isChecked
                    ? 'bg-[#4CAF6D]/20 text-[#4CAF6D]'
                    : 'bg-[#28272E] text-[#9C9AA3]'
                }`}
              >
                {stationBadge}
              </span>
            )}
            <span className="font-display text-[13px] font-semibold text-[#F2F1ED] truncate">
              {interleavedExerciseName}
            </span>
          </div>
          {isActiveFocusStep && !isChecked && (
            <span className="text-[11px] font-semibold text-[#E0B93D] flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E0B93D] animate-ping" />
              <span>Đến lượt thực hiện</span>
            </span>
          )}
        </div>
      )}

      <div
        className={`grid grid-cols-12 gap-2 items-center py-2.5 px-3 rounded-[14px] border transition-all ${
          activeError
            ? 'bg-[#E4483C]/10 border-[#E4483C]'
            : isChecked
            ? 'bg-[#4CAF6D]/10 border-[#4CAF6D]'
            : isActiveFocusStep
            ? 'bg-[#E0B93D]/10 border-[#E0B93D] ring-1 ring-[#E0B93D]/40'
            : isTopE1RM
            ? 'bg-[#E4483C]/10 border-[#E4483C]/60'
            : 'bg-[#17161A] border-[#35343C]'
        }`}
      >
        {/* 1. Set Number / Station Badge */}
        <div className="col-span-1 flex items-center justify-center">
          <span
            className="w-8 h-8 rounded-[12px] flex items-center justify-center font-display text-[12px] font-semibold tabular-nums"
            style={{
              backgroundColor:
                isActiveFocusStep && !isChecked
                  ? '#E0B93D26'
                  : set.setType === 'W'
                  ? `${PLATE_CODE_COLORS.yellow}22`
                  : '#28272E',
              color:
                isActiveFocusStep && !isChecked
                  ? '#E0B93D'
                  : set.setType === 'W'
                  ? PLATE_CODE_COLORS.yellow
                  : '#F2F1ED',
            }}
          >
            {stationBadge && !interleavedExerciseName
              ? stationBadge
              : set.setType === 'W'
              ? 'K'
              : set.setNumber}
          </span>
        </div>

        {/* 2. Previous Performance or Effective Load Subtitle */}
        <div className="col-span-2 text-left pl-1 min-w-0">
          <span
            className="text-[12px] text-[#9C9AA3] truncate block font-display tabular-nums"
            title={set.previous}
          >
            {set.previous || '--'}
          </span>
          {exType !== 'BARBELL_DUMBBELL_CABLE' && (
            <span
              className="text-[10px] text-[#656470] truncate block font-display tabular-nums"
              title={`Tải thực tế: ${UnitConverter.formatPlateWeight(effectiveWeightKg, unit)}`}
            >
              ≈ {UnitConverter.formatPlateWeight(effectiveWeightKg, unit)}
            </span>
          )}
        </div>

        {/* 3. Weight / Added / Assisted / Bodyweight Alpha Input */}
        <div className="col-span-2 flex justify-center">
          {exType === 'BODYWEIGHT_ONLY' ? (
            <div
              className="w-full min-h-[48px] px-1.5 py-1.5 flex flex-col items-center justify-center rounded-[14px] bg-[#28272E]/70 border border-[#35343C] text-center"
              title={`Trọng lượng cơ thể × ${alphaFactor} = ${UnitConverter.formatPlateWeight(
                effectiveWeightKg,
                unit
              )}`}
            >
              <span className="font-display tabular-nums text-[12px] font-semibold text-[#F2F1ED]">
                BW×{alphaFactor}
              </span>
              <span className="font-display tabular-nums text-[10px] text-[#9C9AA3]">
                {UnitConverter.formatPlateWeight(effectiveWeightKg, unit)}
              </span>
            </div>
          ) : (
            <div className="relative w-full">
              {(exType === 'WEIGHTED_BODYWEIGHT' || exType === 'ASSISTED_BODYWEIGHT') && (
                <span
                  className={`absolute left-2 top-1/2 -translate-y-1/2 font-display text-[12px] font-bold pointer-events-none ${
                    exType === 'WEIGHTED_BODYWEIGHT' ? 'text-[#4CAF6D]' : 'text-[#3E8EDE]'
                  }`}
                >
                  {exType === 'WEIGHTED_BODYWEIGHT' ? '+' : '-'}
                </span>
              )}
              <input
                type="number"
                step={unit === 'lbs' ? '1' : '0.5'}
                min={0}
                max={maxAllowedDisplayWeight}
                inputMode="decimal"
                aria-label={`Mức tạ hiệp ${set.setNumber} (${unit})`}
                aria-invalid={Boolean(weightError)}
                value={weightInput}
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleWeightChange(e.target.value)}
                onBlur={handleWeightBlur}
                className={`w-full min-h-[48px] ${
                  exType === 'WEIGHTED_BODYWEIGHT' || exType === 'ASSISTED_BODYWEIGHT'
                    ? 'pl-5 pr-1.5'
                    : 'px-2'
                } py-2 text-center font-display tabular-nums text-[14px] font-medium rounded-[14px] bg-[#28272E] text-[#F2F1ED] border transition focus:outline-hidden ${
                  weightError
                    ? 'border-[#E4483C] text-[#E4483C]'
                    : 'border-[#35343C] focus:border-[#E4483C]'
                }`}
              />
            </div>
          )}
        </div>

        {/* 4. Reps Input (Max 100) */}
        <div className="col-span-2 flex justify-center">
          <input
            type="number"
            min={0}
            max={100}
            inputMode="numeric"
            aria-label={`Số lần lặp hiệp ${set.setNumber}`}
            aria-invalid={Boolean(repsError)}
            value={repsInput}
            onFocus={(e) => e.target.select()}
            onChange={(e) => handleRepsChange(e.target.value)}
            onBlur={handleRepsBlur}
            className={`w-full min-h-[48px] px-2 py-2 text-center font-display tabular-nums text-[14px] font-medium rounded-[14px] bg-[#28272E] text-[#F2F1ED] border transition focus:outline-hidden ${
              repsError
                ? 'border-[#E4483C] text-[#E4483C]'
                : 'border-[#35343C] focus:border-[#E4483C]'
            }`}
          />
        </div>

        {/* 5. RPE Input with semantic Plate-Code tint (Max 10) */}
        <div className="col-span-2 flex justify-center">
          <input
            type="number"
            step="0.5"
            min={1}
            max={10}
            inputMode="decimal"
            aria-label={`Chỉ số RPE hiệp ${set.setNumber}`}
            aria-invalid={Boolean(rpeError)}
            value={rpeInput}
            onFocus={(e) => e.target.select()}
            onChange={(e) => handleRpeChange(e.target.value)}
            onBlur={handleRpeBlur}
            style={{
              borderColor: rpeError ? PLATE_CODE_COLORS.red : rpeColor,
              color: rpeError ? PLATE_CODE_COLORS.red : rpeColor,
            }}
            className="w-full min-h-[48px] px-2 py-2 text-center font-display tabular-nums text-[14px] font-semibold rounded-[14px] bg-[#28272E] border transition focus:outline-hidden"
          />
        </div>

        {/* 6. Calculated E1RM Display */}
        <div className="col-span-1 flex items-center justify-center">
          <span
            className={`font-display tabular-nums text-[12px] flex items-center gap-1 ${
              displayE1rm > 0
                ? isTopE1RM
                  ? 'text-[#E4483C] font-semibold'
                  : 'text-[#9C9AA3]'
                : 'text-[#656470]'
            }`}
            title={`Ước tính 1RM: ${displayE1rm > 0 ? `${displayE1rm} ${unit}` : `0 ${unit}`}`}
          >
            {isTopE1RM && <Flame className="w-3 h-3 fill-[#E4483C] text-[#E4483C] shrink-0" />}
            <span>{displayE1rm > 0 ? `${displayE1rm}` : '--'}</span>
          </span>
        </div>

        {/* 7. Check Button [ ✓ ] - 48x48px minimum touch target */}
        <div className="col-span-2 flex justify-end">
          <button
            type="button"
            onClick={() => {
              if (activeError) return;
              onToggleComplete(exIdx, setIdx);
            }}
            disabled={Boolean(activeError)}
            aria-label={`Đánh dấu hoàn thành hiệp ${set.setNumber}`}
            className={`min-w-[48px] min-h-[48px] w-12 h-12 rounded-[14px] flex items-center justify-center transition-all active:scale-95 ${
              activeError
                ? 'bg-[#E4483C]/20 text-[#E4483C] cursor-not-allowed border border-[#E4483C]'
                : isChecked
                ? 'bg-[#4CAF6D] text-[#17161A]'
                : isActiveFocusStep
                ? 'bg-[#E0B93D]/20 text-[#E0B93D] hover:bg-[#E0B93D]/30 border border-[#E0B93D]'
                : 'bg-[#28272E] text-[#9C9AA3] hover:text-[#F2F1ED] border border-[#35343C]'
            }`}
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Telemetry Sanity Validation Error Banner */}
      {activeError && (
        <div
          role="alert"
          className="p-3 rounded-[14px] bg-[#E4483C]/15 border border-[#E4483C] flex items-center justify-between gap-3 text-[#F2F1ED] text-[12px]"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#E4483C] shrink-0" />
            <span>{activeError}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (weightError) {
                const maxKg = UnitConverter.toDatabaseValue(maxAllowedDisplayWeight, unit);
                onUpdateWeight(exIdx, setIdx, maxKg);
                setWeightInput(String(maxAllowedDisplayWeight));
                setWeightError(null);
              }
              if (repsError) {
                onUpdateReps(exIdx, setIdx, 100);
                setRepsInput('100');
                setRepsError(null);
              }
              if (rpeError) {
                onUpdateRpe(exIdx, setIdx, 10);
                setRpeInput('10');
                setRpeError(null);
              }
            }}
            className="min-h-[48px] px-3 py-2 rounded-[14px] bg-[#E4483C] hover:bg-[#C23629] text-[#F2F1ED] text-[12px] font-semibold shrink-0 transition"
          >
            Đặt về tối đa
          </button>
        </div>
      )}
    </div>
  );
};
