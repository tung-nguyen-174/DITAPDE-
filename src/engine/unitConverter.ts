export type WeightUnit = 'kg' | 'lbs';

/**
 * Exact internationalavoirdupois pound conversion constant:
 * 1 kg = 2.2046226218 lbs
 */
export const KG_TO_LBS_FACTOR = 2.2046226218;
export const LBS_TO_KG_FACTOR = 1 / KG_TO_LBS_FACTOR;

export interface DisplayRoundingOptions {
  /**
   * Step increment for display rounding.
   * Defaults to 0.5 for 'kg' and 1.0 for 'lbs' (or 2.5 when plateRounding is enabled).
   */
  step?: number;
  plateRounding?: boolean;
}

/**
 * Lossless Multi-Unit Normalization Utility (`UnitConverter`).
 *
 * Architectural Rule:
 * - Every weight metric in storage (Firestore / Isar / LocalStorage) is persisted
 *   canonically as `base_weight_kg` (IEEE 754 Double/Float).
 * - UI display values are derived on-the-fly from `base_weight_kg` and rounded
 *   solely for presentation.
 * - Switching units (`kg <-> lbs`) never mutates `base_weight_kg` unless the user
 *   explicitly types a new number that differs from the current display projection.
 */
export const UnitConverter = {
  /**
   * Converts a canonical database weight (`base_weight_kg`) into a display value
   * in the target unit (`kg` or `lbs`) with clean display rounding.
   */
  toDisplayValue(
    baseWeightKg: number | null | undefined,
    unit: WeightUnit,
    options?: DisplayRoundingOptions
  ): number {
    if (baseWeightKg === null || baseWeightKg === undefined || Number.isNaN(baseWeightKg)) {
      return 0;
    }

    const clampedKg = Math.max(0, baseWeightKg);
    if (clampedKg === 0) {
      return 0;
    }

    const rawConverted = unit === 'lbs' ? clampedKg * KG_TO_LBS_FACTOR : clampedKg;

    const defaultStep =
      options?.step ??
      (unit === 'lbs' ? (options?.plateRounding ? 2.5 : 1.0) : 0.5);

    if (defaultStep <= 0) {
      return Number(rawConverted.toFixed(2));
    }

    const rounded = Math.round(rawConverted / defaultStep) * defaultStep;
    // Eliminate floating point representation noise (e.g. 67.50000000000001)
    return Number(rounded.toFixed(2));
  },

  /**
   * Converts a user-entered value in `unit` (`kg` or `lbs`) into the canonical
   * database `base_weight_kg` float without premature rounding.
   *
   * Includes precision-loss protection: if `previousBaseWeightKg` is provided and
   * its display projection in `unit` equals `inputValue`, returns `previousBaseWeightKg`
   * untouched so toggling kg <-> lbs never drifts the stored value.
   */
  toDatabaseValue(
    inputValue: number | null | undefined,
    unit: WeightUnit,
    previousBaseWeightKg?: number,
    options?: DisplayRoundingOptions
  ): number {
    if (inputValue === null || inputValue === undefined || Number.isNaN(inputValue)) {
      return 0;
    }

    const sanitizedInput = Math.max(0, inputValue);
    if (sanitizedInput === 0) {
      return 0;
    }

    if (
      previousBaseWeightKg !== undefined &&
      previousBaseWeightKg > 0 &&
      Math.abs(
        this.toDisplayValue(previousBaseWeightKg, unit, options) - sanitizedInput
      ) < 1e-6
    ) {
      return previousBaseWeightKg;
    }

    if (unit === 'kg') {
      return sanitizedInput;
    }

    // Store high-precision float (8 decimal places) in kg to guarantee lossless round-trip
    return Number((sanitizedInput * LBS_TO_KG_FACTOR).toFixed(8));
  },

  /**
   * Formats a canonical `base_weight_kg` into a human-readable string with unit label.
   * Example: `100 kg` or `220 lbs`.
   */
  formatPlateWeight(
    baseWeightKg: number | null | undefined,
    unit: WeightUnit,
    options?: DisplayRoundingOptions & { includeSign?: '+' | '-' }
  ): string {
    const displayVal = this.toDisplayValue(baseWeightKg, unit, options);
    const formattedNum = Number.isInteger(displayVal)
      ? displayVal.toString()
      : displayVal.toFixed(1).replace(/\.0$/, '');
    const prefix = options?.includeSign && displayVal > 0 ? options.includeSign : '';
    return `${prefix}${formattedNum} ${unit}`;
  },
};
