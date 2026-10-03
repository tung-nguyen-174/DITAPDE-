// src/services/workoutDraftCacheService.ts
import { ExerciseSet, MuscleGroup, WorkoutExercise, WorkoutSession } from '../types/gym';
import {
  calculateCompoundLiftsE1RM,
  CompoundLiftKey,
} from '../utils/fitnessCalculations';

const ISAR_DRAFT_SESSION_KEY = 'ditapde_isar_draft_session_v1';
const ISAR_EXERCISE_HISTORY_KEY = 'ditapde_isar_exercise_history_v1';
const ISAR_USER_LOGGED_HISTORY_KEY = 'ditapde_isar_user_logged_history_v1';
const ISAR_MANUAL_1RM_KEY = 'ditapde_isar_manual_1rm_v1';
const ISAR_SYNCED_COMPOUND_PRS_KEY = 'ditapde_isar_synced_compound_prs_v1';
const ISAR_AI_VERIFIED_PRS_KEY = 'ditapde_isar_ai_verified_prs_v1';
const ISAR_INITIAL_CRASH_DEMO_SEEDED_KEY = 'ditapde_isar_crash_demo_seeded_v1';

export interface Manual1RMRecord {
  weightKg: number;
  updatedAt: string;
}

export interface AIVerifiedPRRecord {
  weightKg: number;
  reps: number;
  e1rmKg: number;
  bestRep: number;
  peakVelocityMps: number;
  volumeKg: number;
  verifiedAt: string;
  updatedAt: string;
}

export interface SyncedCompoundPRRecord {
  key: CompoundLiftKey;
  e1rmKg: number;
  heaviestWeightKg: number;
  reps: number;
  rpe?: number;
  setNumber: number;
  matchedExerciseName: string;
  updatedAt: string;
}

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
  private static pendingSaveTimer: ReturnType<typeof setTimeout> | null = null;

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
      const userLoggedHistory = WorkoutDraftCacheService.getUserLoggedHistory();
      session.exercises.forEach((ex) => {
        const key = ex.name.toLowerCase().trim();
        const completedOrValidSets = ex.sets.filter((s) => s.weight > 0 && s.reps > 0);
        if (completedOrValidSets.length > 0) {
          const mappedSets: PreviousSetRecord[] = completedOrValidSets.map((s, idx) => ({
            setNumber: idx + 1,
            setType: s.setType,
            weight: s.weight,
            reps: s.reps,
            rpe: s.rpe,
            previousLabel: `${s.weight}kg × ${s.reps}`,
          }));
          currentHistory[key] = mappedSets;
          userLoggedHistory[key] = mappedSets;
        }
      });
      localStorage.setItem(ISAR_EXERCISE_HISTORY_KEY, JSON.stringify(currentHistory));
      localStorage.setItem(ISAR_USER_LOGGED_HISTORY_KEY, JSON.stringify(userLoggedHistory));
      WorkoutDraftCacheService.syncCompoundPRsFromSession(session);
    } catch (e) {
      console.warn('Error updating exercise history cache:', e);
    }
  }

  /**
   * Read synced Compound Lift E1RMs calculated from Logger sessions
   */
  static getSyncedCompoundPRs(): Partial<Record<CompoundLiftKey, SyncedCompoundPRRecord>> {
    try {
      const raw = localStorage.getItem(ISAR_SYNCED_COMPOUND_PRS_KEY);
      if (!raw) return {};
      return JSON.parse(raw) as Partial<Record<CompoundLiftKey, SyncedCompoundPRRecord>>;
    } catch {
      return {};
    }
  }

  /**
   * Automatically calculate and sync compound lift E1RMs (Bench, Squat, Deadlift, OHP)
   * from a Logger session's heaviest sets into the Kỷ lục cá nhân store.
   */
  static syncCompoundPRsFromSession(
    session: Pick<WorkoutSession, 'exercises' | 'userBodyweightKg' | 'preferredUnit'>
  ): Partial<Record<CompoundLiftKey, SyncedCompoundPRRecord>> {
    const current = WorkoutDraftCacheService.getSyncedCompoundPRs();
    const results = calculateCompoundLiftsE1RM(session.exercises || [], {
      bodyweightKg: session.userBodyweightKg,
      preferredUnit: session.preferredUnit,
    });

    const next: Partial<Record<CompoundLiftKey, SyncedCompoundPRRecord>> = {
      ...current,
    };
    const todayStr = new Date().toLocaleDateString('vi-VN');

    for (const item of results) {
      if (item.hasSessionSet && item.e1rmKg > 0) {
        const existing = next[item.key];
        // Sync if there is no previous record or if the current session's heaviest set updates/matches or is a valid session lift
        if (!existing || item.e1rmKg >= existing.e1rmKg || item.heaviestWeightKg > 0) {
          next[item.key] = {
            key: item.key,
            e1rmKg: item.e1rmKg,
            heaviestWeightKg: item.heaviestWeightKg,
            reps: item.reps,
            rpe: item.rpe,
            setNumber: item.setNumber,
            matchedExerciseName: item.matchedExerciseName,
            updatedAt: todayStr,
          };
        }
      }
    }

    try {
      localStorage.setItem(ISAR_SYNCED_COMPOUND_PRS_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Error syncing compound PRs:', e);
    }
    return next;
  }

  /**
   * Read sets that were explicitly logged by the user in Logger sessions
   */
  static getUserLoggedHistory(): ExerciseHistoryMap {
    try {
      const raw = localStorage.getItem(ISAR_USER_LOGGED_HISTORY_KEY);
      if (!raw) return {};
      return JSON.parse(raw) as ExerciseHistoryMap;
    } catch {
      return {};
    }
  }

  /**
   * Read manually entered 1RM records for core lifts
   */
  static getManual1RMMap(): Record<string, Manual1RMRecord> {
    try {
      const raw = localStorage.getItem(ISAR_MANUAL_1RM_KEY);
      if (!raw) return {};
      return JSON.parse(raw) as Record<string, Manual1RMRecord>;
    } catch {
      return {};
    }
  }

  /**
   * Persist a manually entered 1RM for a core lift
   */
  static saveManual1RM(liftKey: string, weightKg: number): Record<string, Manual1RMRecord> {
    const current = WorkoutDraftCacheService.getManual1RMMap();
    const next: Record<string, Manual1RMRecord> = {
      ...current,
      [liftKey]: {
        weightKg: Math.round(weightKg * 10) / 10,
        updatedAt: new Date().toLocaleDateString('vi-VN'),
      },
    };
    try {
      localStorage.setItem(ISAR_MANUAL_1RM_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Error saving manual 1RM:', e);
    }
    return next;
  }

  /**
   * Read camera-verified (MediaPipe Pose) PR test results for core lifts
   */
  static getAIVerifiedPRMap(): Record<string, AIVerifiedPRRecord> {
    try {
      const raw = localStorage.getItem(ISAR_AI_VERIFIED_PRS_KEY);
      if (!raw) return {};
      return JSON.parse(raw) as Record<string, AIVerifiedPRRecord>;
    } catch {
      return {};
    }
  }

  /**
   * Persist a camera-verified PR test result confirmed by the user
   */
  static saveAIVerifiedPR(
    liftKey: string,
    record: Omit<AIVerifiedPRRecord, 'verifiedAt' | 'updatedAt'>
  ): Record<string, AIVerifiedPRRecord> {
    const now = new Date();
    const next: Record<string, AIVerifiedPRRecord> = {
      ...WorkoutDraftCacheService.getAIVerifiedPRMap(),
      [liftKey]: {
        ...record,
        verifiedAt: now.toISOString(),
        updatedAt: now.toLocaleDateString('vi-VN'),
      },
    };
    try {
      localStorage.setItem(ISAR_AI_VERIFIED_PRS_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Error saving AI verified PR:', e);
    }
    return next;
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
      if (WorkoutDraftCacheService.pendingSaveTimer) {
        clearTimeout(WorkoutDraftCacheService.pendingSaveTimer);
        WorkoutDraftCacheService.pendingSaveTimer = null;
      }
      localStorage.setItem(ISAR_DRAFT_SESSION_KEY, JSON.stringify(session));
      localStorage.setItem(ISAR_INITIAL_CRASH_DEMO_SEEDED_KEY, 'true');
    } catch (e) {
      console.warn('Failed to save workout draft to local cache:', e);
    }
  }

  /**
   * Non-blocking debounced draft persistence so rapid set/timer updates never block the UI thread.
   */
  static saveDraftSessionAsync(session: WorkoutSession, delayMs = 350): void {
    if (WorkoutDraftCacheService.pendingSaveTimer) {
      clearTimeout(WorkoutDraftCacheService.pendingSaveTimer);
    }
    WorkoutDraftCacheService.pendingSaveTimer = setTimeout(() => {
      WorkoutDraftCacheService.pendingSaveTimer = null;
      WorkoutDraftCacheService.saveDraftSession(session);
    }, delayMs);
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
      if (WorkoutDraftCacheService.pendingSaveTimer) {
        clearTimeout(WorkoutDraftCacheService.pendingSaveTimer);
        WorkoutDraftCacheService.pendingSaveTimer = null;
      }
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
