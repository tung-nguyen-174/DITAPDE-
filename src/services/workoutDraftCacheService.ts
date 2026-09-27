// src/services/workoutDraftCacheService.ts
import { ExerciseSet, MuscleGroup, WorkoutExercise, WorkoutSession } from '../types/gym';

const ISAR_DRAFT_SESSION_KEY = 'ditapde_isar_draft_session_v1';
const ISAR_EXERCISE_HISTORY_KEY = 'ditapde_isar_exercise_history_v1';
const ISAR_INITIAL_CRASH_DEMO_SEEDED_KEY = 'ditapde_isar_crash_demo_seeded_v1';

export interface PreviousSetRecord {
  setNumber: number;
  setType: 'W' | 'N' | 'D' | 'F';
  weight: number;
  reps: number;
  rpe: number;
  previousLabel: string;
}

export type ExerciseHistoryMap = Record<string, PreviousSetRecord[]>;

/**
 * Default historical performance from the user's previous workouts stored in Local DB (Isar Cache).
 * Used to pre-populate sets when initializing a session from a saved/forked routine.
 */
const DEFAULT_PREVIOUS_EXERCISE_HISTORY: ExerciseHistoryMap = {
  'barbell bench press': [
    { setNumber: 1, setType: 'W', weight: 60, reps: 10, rpe: 7.0, previousLabel: '60kg × 10' },
    { setNumber: 2, setType: 'N', weight: 80, reps: 8, rpe: 8.0, previousLabel: '80kg × 8' },
    { setNumber: 3, setType: 'N', weight: 90, reps: 6, rpe: 8.5, previousLabel: '90kg × 6' },
    { setNumber: 4, setType: 'N', weight: 95, reps: 5, rpe: 9.0, previousLabel: '95kg × 5' },
  ],
  'incline dumbbell press': [
    { setNumber: 1, setType: 'N', weight: 32, reps: 10, rpe: 8.0, previousLabel: '32kg × 10' },
    { setNumber: 2, setType: 'N', weight: 34, reps: 8, rpe: 8.5, previousLabel: '34kg × 8' },
    { setNumber: 3, setType: 'N', weight: 36, reps: 8, rpe: 9.0, previousLabel: '36kg × 8' },
  ],
  'overhead barbell press': [
    { setNumber: 1, setType: 'N', weight: 50, reps: 8, rpe: 8.0, previousLabel: '50kg × 8' },
    { setNumber: 2, setType: 'N', weight: 55, reps: 8, rpe: 8.5, previousLabel: '55kg × 8' },
    { setNumber: 3, setType: 'N', weight: 60, reps: 6, rpe: 9.0, previousLabel: '60kg × 6' },
  ],
  'cable lateral raise': [
    { setNumber: 1, setType: 'N', weight: 12.5, reps: 15, rpe: 8.5, previousLabel: '12.5kg × 15' },
    { setNumber: 2, setType: 'N', weight: 15, reps: 15, rpe: 9.0, previousLabel: '15kg × 15' },
    { setNumber: 3, setType: 'N', weight: 15, reps: 12, rpe: 9.5, previousLabel: '15kg × 12' },
    { setNumber: 4, setType: 'N', weight: 15, reps: 12, rpe: 9.5, previousLabel: '15kg × 12' },
  ],
  'rope tricep pushdown': [
    { setNumber: 1, setType: 'N', weight: 25, reps: 12, rpe: 8.0, previousLabel: '25kg × 12' },
    { setNumber: 2, setType: 'N', weight: 30, reps: 10, rpe: 8.5, previousLabel: '30kg × 10' },
    { setNumber: 3, setType: 'N', weight: 32.5, reps: 10, rpe: 9.0, previousLabel: '32.5kg × 10' },
  ],
  'barbell bent over row': [
    { setNumber: 1, setType: 'N', weight: 80, reps: 10, rpe: 8.0, previousLabel: '80kg × 10' },
    { setNumber: 2, setType: 'N', weight: 85, reps: 8, rpe: 8.5, previousLabel: '85kg × 8' },
    { setNumber: 3, setType: 'N', weight: 90, reps: 8, rpe: 8.5, previousLabel: '90kg × 8' },
    { setNumber: 4, setType: 'N', weight: 90, reps: 6, rpe: 9.0, previousLabel: '90kg × 6' },
  ],
  'barbell back squat': [
    { setNumber: 1, setType: 'W', weight: 80, reps: 8, rpe: 7.0, previousLabel: '80kg × 8' },
    { setNumber: 2, setType: 'N', weight: 110, reps: 6, rpe: 8.0, previousLabel: '110kg × 6' },
    { setNumber: 3, setType: 'N', weight: 125, reps: 5, rpe: 8.5, previousLabel: '125kg × 5' },
    { setNumber: 4, setType: 'N', weight: 130, reps: 5, rpe: 9.0, previousLabel: '130kg × 5' },
  ],
};

export class WorkoutDraftCacheService {
  /**
   * Read the exercise history map from Local DB (Isar Cache)
   */
  static getExerciseHistory(): ExerciseHistoryMap {
    try {
      const raw = localStorage.getItem(ISAR_EXERCISE_HISTORY_KEY);
      if (!raw) {
        localStorage.setItem(
          ISAR_EXERCISE_HISTORY_KEY,
          JSON.stringify(DEFAULT_PREVIOUS_EXERCISE_HISTORY)
        );
        return DEFAULT_PREVIOUS_EXERCISE_HISTORY;
      }
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PREVIOUS_EXERCISE_HISTORY, ...parsed };
    } catch {
      return DEFAULT_PREVIOUS_EXERCISE_HISTORY;
    }
  }

  /**
   * Retrieve pre-filled sets for an exercise based on previous workout history in Local DB
   */
  static buildPreFilledSetsForExercise(params: {
    exerciseName: string;
    primaryMuscle: MuscleGroup;
    targetSets: number;
    targetReps: number;
    targetRpe: number;
    exerciseIndex: number;
  }): ExerciseSet[] {
    const historyMap = WorkoutDraftCacheService.getExerciseHistory();
    const key = params.exerciseName.toLowerCase().trim();
    const historicalSets = historyMap[key];
    const setsCount = Math.max(1, Math.min(10, params.targetSets || 3));
    const defaultWeight =
      params.primaryMuscle === 'quads' || params.primaryMuscle === 'lower_back'
        ? 60
        : params.primaryMuscle === 'side_delts' || params.primaryMuscle === 'triceps' || params.primaryMuscle === 'biceps'
        ? 20
        : 40;

    return Array.from({ length: setsCount }, (_, sIdx) => {
      const hist =
        historicalSets && historicalSets.length > 0
          ? historicalSets[Math.min(sIdx, historicalSets.length - 1)]
          : null;

      const weight = hist ? hist.weight : defaultWeight;
      const reps = hist ? hist.reps : params.targetReps || 10;
      const rpe = hist ? hist.rpe : params.targetRpe || 8.0;
      const previous = hist
        ? hist.previousLabel
        : `${weight}kg × ${reps}`;

      return {
        id: `set-${Date.now()}-${params.exerciseIndex}-${sIdx + 1}`,
        setNumber: sIdx + 1,
        setType: hist ? hist.setType : sIdx === 0 && setsCount >= 3 ? 'W' : 'N',
        previous,
        weight,
        reps,
        rpe,
        completed: false,
      };
    });
  }

  /**
   * Record completed workout sets into the Exercise History cache for future sessions
   */
  static updateHistoryFromCompletedSession(session: WorkoutSession): void {
    try {
      const currentHistory = WorkoutDraftCacheService.getExerciseHistory();
      session.exercises.forEach((ex) => {
        const key = ex.name.toLowerCase().trim();
        const completedOrValidSets = ex.sets.filter((s) => s.weight > 0 && s.reps > 0);
        if (completedOrValidSets.length > 0) {
          currentHistory[key] = completedOrValidSets.map((s, idx) => ({
            setNumber: idx + 1,
            setType: s.setType,
            weight: s.weight,
            reps: s.reps,
            rpe: s.rpe,
            previousLabel: `${s.weight}kg × ${s.reps}`,
          }));
        }
      });
      localStorage.setItem(ISAR_EXERCISE_HISTORY_KEY, JSON.stringify(currentHistory));
    } catch (e) {
      console.warn('Error updating exercise history cache:', e);
    }
  }

  /**
   * Initialize and persist a Blank Workout Session ("Tạo buổi tập trống") in Local DB (Isar Cache)
   */
  static createBlankSession(gymVenue: string): WorkoutSession {
    const blankSession: WorkoutSession = {
      id: `session-blank-${Date.now()}`,
      title: 'Buổi tập tự do (Blank Session)',
      startTime: Date.now(),
      durationSeconds: 0,
      gymVenue,
      visibility: 'public',
      telemetryOverlayEnabled: true,
      totalTonnageKg: 0,
      totalSets: 0,
      exercises: [],
    };
    WorkoutDraftCacheService.saveDraftSession(blankSession);
    return blankSession;
  }

  /**
   * Save or update the active draft workout session in Local DB (Isar Cache)
   */
  static saveDraftSession(session: WorkoutSession): void {
    try {
      localStorage.setItem(ISAR_DRAFT_SESSION_KEY, JSON.stringify(session));
      localStorage.setItem(ISAR_INITIAL_CRASH_DEMO_SEEDED_KEY, 'true');
    } catch (e) {
      console.warn('Failed to save workout draft to local cache:', e);
    }
  }

  /**
   * Load an unfinished draft workout session from Local DB (Isar Cache).
   * If this is the very first boot, seeds an interrupted draft session so crash recovery can be verified immediately.
   */
  static getDraftSession(): WorkoutSession | null {
    try {
      const raw = localStorage.getItem(ISAR_DRAFT_SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as WorkoutSession;
        if (parsed && parsed.id && Array.isArray(parsed.exercises)) {
          return parsed;
        }
      }

      const alreadySeeded = localStorage.getItem(ISAR_INITIAL_CRASH_DEMO_SEEDED_KEY);
      if (!alreadySeeded) {
        const initialInterruptedDraft = WorkoutDraftCacheService.buildDefaultInterruptedDraft(
          'California Fitness & Yoga Thanh Hóa'
        );
        localStorage.setItem(ISAR_DRAFT_SESSION_KEY, JSON.stringify(initialInterruptedDraft));
        localStorage.setItem(ISAR_INITIAL_CRASH_DEMO_SEEDED_KEY, 'true');
        return initialInterruptedDraft;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Clear the draft session from Local DB (when completed or discarded via [Hủy bỏ])
   */
  static clearDraftSession(): void {
    try {
      localStorage.removeItem(ISAR_DRAFT_SESSION_KEY);
      localStorage.setItem(ISAR_INITIAL_CRASH_DEMO_SEEDED_KEY, 'true');
    } catch (e) {
      console.warn('Failed to clear workout draft:', e);
    }
  }

  /**
   * Helper to build a realistic interrupted workout draft for crash recovery
   */
  static buildDefaultInterruptedDraft(gymVenue: string): WorkoutSession {
    const exercises: WorkoutExercise[] = [
      {
        id: 'ex-draft-1',
        name: 'Barbell Bench Press',
        vietnameseName: 'Đẩy ngực ngang đòn tạ',
        primaryMuscle: 'chest',
        secondaryMuscles: ['triceps', 'front_delts'],
        sets: [
          {
            id: 'set-draft-1-1',
            setNumber: 1,
            setType: 'W',
            previous: '60kg × 10',
            weight: 60,
            reps: 10,
            rpe: 7,
            completed: true,
          },
          {
            id: 'set-draft-1-2',
            setNumber: 2,
            setType: 'N',
            previous: '80kg × 8',
            weight: 80,
            reps: 8,
            rpe: 8,
            completed: true,
          },
          {
            id: 'set-draft-1-3',
            setNumber: 3,
            setType: 'N',
            previous: '90kg × 6',
            weight: 90,
            reps: 6,
            rpe: 8.5,
            completed: false,
          },
        ],
      },
      {
        id: 'ex-draft-2',
        name: 'Incline Dumbbell Press',
        vietnameseName: 'Đẩy ngực dốc tạ đơn',
        primaryMuscle: 'chest',
        secondaryMuscles: ['front_delts', 'triceps'],
        sets: [
          {
            id: 'set-draft-2-1',
            setNumber: 1,
            setType: 'N',
            previous: '32kg × 10',
            weight: 32,
            reps: 10,
            rpe: 8,
            completed: true,
          },
          {
            id: 'set-draft-2-2',
            setNumber: 2,
            setType: 'N',
            previous: '34kg × 8',
            weight: 34,
            reps: 8,
            rpe: 8.5,
            completed: false,
          },
        ],
      },
    ];

    return {
      id: 'session-draft-recovery-1',
      title: 'Push Day - Ngực Vai Tay Sau',
      startTime: Date.now() - 18 * 60 * 1000,
      durationSeconds: 18 * 60 + 42, // 00:18:42
      gymVenue,
      visibility: 'public',
      telemetryOverlayEnabled: true,
      totalTonnageKg: 60 * 10 + 80 * 8 + 32 * 10,
      totalSets: 3,
      exercises,
    };
  }
}
