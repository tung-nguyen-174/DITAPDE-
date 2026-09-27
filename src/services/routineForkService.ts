// src/services/routineForkService.ts
import { FeedPost, MuscleGroup, RoutineTemplate, WorkoutExercise, WorkoutSession } from '../types/gym';
import { ALL_RAW_EXERCISES, mapStringToMuscleGroup } from './exerciseImporter';
import { WorkoutDraftCacheService } from './workoutDraftCacheService';

export interface RoutineExerciseModel {
  name: string;
  vietnameseName?: string;
  primaryMuscle?: MuscleGroup;
  equipment?: string;
  targetSets: number;
  targetReps: number;
  targetRpe: number;
}

export interface RoutineModel {
  id: string;
  title: string;
  creatorName: string;
  isCustom?: boolean;
  createdAt?: string;
  exercises: RoutineExerciseModel[];
}

const SAVED_ROUTINES_KEY = 'gym_chuot_saved_routines';

const INITIAL_FORKED_ROUTINES: RoutineModel[] = [
  {
    id: 'routine_push_day_saved',
    title: 'Push Day - Ngực Vai Tay Sau',
    creatorName: 'Long Aura (PT Pro)',
    isCustom: false,
    createdAt: 'Đã lưu vào bộ nhớ (Isar Cache)',
    exercises: [
      {
        name: 'Barbell Bench Press',
        vietnameseName: 'Đẩy ngực ngang đòn tạ',
        primaryMuscle: 'chest',
        equipment: 'barbell',
        targetSets: 4,
        targetReps: 8,
        targetRpe: 8.5,
      },
      {
        name: 'Incline Dumbbell Press',
        vietnameseName: 'Đẩy ngực dốc tạ đơn',
        primaryMuscle: 'chest',
        equipment: 'dumbbell',
        targetSets: 3,
        targetReps: 8,
        targetRpe: 8.5,
      },
      {
        name: 'Overhead Barbell Press',
        vietnameseName: 'Đẩy vai đứng đòn tạ (OHP)',
        primaryMuscle: 'front_delts',
        equipment: 'barbell',
        targetSets: 3,
        targetReps: 8,
        targetRpe: 8.5,
      },
      {
        name: 'Cable Lateral Raise',
        vietnameseName: 'Bay vai cáp bên',
        primaryMuscle: 'side_delts',
        equipment: 'cable',
        targetSets: 4,
        targetReps: 15,
        targetRpe: 9.0,
      },
      {
        name: 'Rope Tricep Pushdown',
        vietnameseName: 'Kéo cáp tay sau dây thừng',
        primaryMuscle: 'triceps',
        equipment: 'cable',
        targetSets: 3,
        targetReps: 12,
        targetRpe: 8.5,
      },
    ],
  },
  {
    id: 'fork_initial_1',
    title: 'Upper Body Hypertrophy & PR Push Day 🔥 (Fork từ Long Aura (PT Pro))',
    creatorName: 'Long Aura (PT Pro)',
    isCustom: false,
    createdAt: 'Đã lưu từ Xin lịch',
    exercises: [
      {
        name: 'Barbell Bench Press',
        vietnameseName: 'Đẩy ngực ngang đòn tạ',
        primaryMuscle: 'chest',
        equipment: 'barbell',
        targetSets: 4,
        targetReps: 5,
        targetRpe: 9,
      },
      {
        name: 'Incline Dumbbell Press',
        vietnameseName: 'Đẩy ngực dốc tạ đơn',
        primaryMuscle: 'chest',
        equipment: 'dumbbell',
        targetSets: 3,
        targetReps: 8,
        targetRpe: 8.5,
      },
      {
        name: 'Barbell Bent Over Row',
        vietnameseName: 'Kéo xô đòn tạ gập người',
        primaryMuscle: 'lats',
        equipment: 'barbell',
        targetSets: 4,
        targetReps: 8,
        targetRpe: 8,
      },
      {
        name: 'Cable Lateral Raise',
        vietnameseName: 'Bay vai cáp bên',
        primaryMuscle: 'side_delts',
        equipment: 'cable',
        targetSets: 4,
        targetReps: 15,
        targetRpe: 9.5,
      },
    ],
  },
];

function readRawList(): RoutineModel[] {
  try {
    const raw = localStorage.getItem(SAVED_ROUTINES_KEY);
    if (!raw) {
      localStorage.setItem(SAVED_ROUTINES_KEY, JSON.stringify(INITIAL_FORKED_ROUTINES));
      return INITIAL_FORKED_ROUTINES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return INITIAL_FORKED_ROUTINES;

    const normalized: RoutineModel[] = parsed.map((item: any) => {
      const obj = typeof item === 'string' ? JSON.parse(item) : item;
      return {
        id: String(obj.id || `routine_${Date.now()}`),
        title: String(obj.title || 'Lịch tập'),
        creatorName: String(obj.creatorName || 'Gymer'),
        isCustom: Boolean(obj.isCustom),
        createdAt: obj.createdAt || (obj.isCustom ? 'Tự tạo' : 'Đã lưu từ Xin lịch'),
        exercises: Array.isArray(obj.exercises)
          ? obj.exercises.map((e: any) => ({
              name: String(e.name || 'Barbell Bench Press'),
              vietnameseName: e.vietnameseName || findVietnameseName(String(e.name || '')),
              primaryMuscle: e.primaryMuscle || findPrimaryMuscle(String(e.name || '')),
              equipment: e.equipment || findEquipment(String(e.name || '')),
              targetSets: Number(e.targetSets) || 3,
              targetReps: Number(e.targetReps) || 10,
              targetRpe: Number(e.targetRpe) || 8,
            }))
          : [],
      };
    });

    // Ensure "Push Day - Ngực Vai Tay Sau" is always available in saved routines
    const hasPushDay = normalized.some((r) =>
      r.title.toLowerCase().includes('push day - ngực vai tay sau')
    );
    if (!hasPushDay) {
      const merged = [INITIAL_FORKED_ROUTINES[0], ...normalized];
      localStorage.setItem(SAVED_ROUTINES_KEY, JSON.stringify(merged));
      return merged;
    }

    return normalized;
  } catch (e) {
    console.warn('Error reading saved routines:', e);
    return INITIAL_FORKED_ROUTINES;
  }
}

function writeRawList(list: RoutineModel[]): void {
  try {
    localStorage.setItem(SAVED_ROUTINES_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Error saving routines:', e);
  }
}

export function findVietnameseName(exerciseName: string): string {
  const clean = exerciseName.toLowerCase().trim();
  const found = ALL_RAW_EXERCISES.find((item) => item.name.toLowerCase() === clean);
  return found?.nameVn || exerciseName;
}

export function findPrimaryMuscle(exerciseName: string): MuscleGroup {
  const clean = exerciseName.toLowerCase().trim();
  const found = ALL_RAW_EXERCISES.find((item) => item.name.toLowerCase() === clean);
  if (found?.primaryMuscles?.[0]) {
    return mapStringToMuscleGroup(found.primaryMuscles[0]);
  }
  return 'chest';
}

export function findEquipment(exerciseName: string): string {
  const clean = exerciseName.toLowerCase().trim();
  const found = ALL_RAW_EXERCISES.find((item) => item.name.toLowerCase() === clean);
  return found?.equipment || 'barbell';
}

function parseTopSetMetrics(topSet: string): { reps: number; rpe: number } {
  // Example: "120kg x 5 (RPE 9)" or "36kg x 8 (RPE 8.5)"
  const repsMatch = topSet.match(/[x×]\s*(\d+)/i);
  const rpeMatch = topSet.match(/RPE\s*([\d.]+)/i);
  return {
    reps: repsMatch ? Math.max(1, parseInt(repsMatch[1], 10)) : 8,
    rpe: rpeMatch ? Math.min(10, Math.max(5, parseFloat(rpeMatch[1]))) : 8.5,
  };
}

export class RoutineForkService {
  /// Get all saved / forked & custom routines from local storage
  static getSavedRoutines(): RoutineModel[] {
    return readRawList();
  }

  /// 1-Tap Fork Routine to Local Storage (matches Dart RoutineForkService.forkRoutine)
  static forkRoutine(publicRoutine: Omit<RoutineModel, 'id'> & { id?: string }): RoutineModel {
    const current = readRawList();
    const isAlreadyTitled = publicRoutine.title.includes('(Fork từ');
    const clonedRoutine: RoutineModel = {
      id: `fork_${Date.now()}`,
      title: isAlreadyTitled
        ? publicRoutine.title
        : `${publicRoutine.title} (Fork từ ${publicRoutine.creatorName})`,
      creatorName: publicRoutine.creatorName,
      isCustom: false,
      createdAt: 'Vừa xin lịch xong',
      exercises: publicRoutine.exercises,
    };

    const next = [clonedRoutine, ...current];
    writeRawList(next);
    return clonedRoutine;
  }

  /// Fork directly from a Community FeedPost ("Xin lịch" button)
  static forkFromFeedPost(post: FeedPost): RoutineModel {
    const exercises: RoutineExerciseModel[] = post.workoutSummary.exercises.map((ex) => {
      const { reps, rpe } = parseTopSetMetrics(ex.topSet);
      return {
        name: ex.name,
        vietnameseName: findVietnameseName(ex.name),
        primaryMuscle: ex.primaryMuscle,
        equipment: findEquipment(ex.name),
        targetSets: Math.max(3, Math.round(post.totalSets / Math.max(1, post.workoutSummary.exercises.length))),
        targetReps: reps,
        targetRpe: rpe,
      };
    });

    return RoutineForkService.forkRoutine({
      title: post.title,
      creatorName: post.userName,
      exercises,
    });
  }

  /// Fork directly from Discover RoutineTemplate
  static forkFromRoutineTemplate(template: RoutineTemplate): RoutineModel {
    const exercises: RoutineExerciseModel[] = template.exercises.map((ex) => {
      const parsedReps = parseInt(ex.repsRange.split('-')[0], 10);
      return {
        name: ex.name,
        vietnameseName: findVietnameseName(ex.name),
        primaryMuscle: ex.muscle,
        equipment: findEquipment(ex.name),
        targetSets: ex.sets || 3,
        targetReps: Number.isNaN(parsedReps) ? 10 : parsedReps,
        targetRpe: 8.5,
      };
    });

    return RoutineForkService.forkRoutine({
      title: template.title,
      creatorName: template.author,
      exercises,
    });
  }

  /// Create a Custom Routine built from the app's Exercise Catalog
  static createCustomRoutine(params: {
    title: string;
    creatorName: string;
    exercises: RoutineExerciseModel[];
  }): RoutineModel {
    const current = readRawList();
    const customRoutine: RoutineModel = {
      id: `custom_${Date.now()}`,
      title: params.title.trim() || 'Lịch Tập Custom Mới',
      creatorName: params.creatorName || 'Bạn',
      isCustom: true,
      createdAt: 'Tự tạo',
      exercises: params.exercises,
    };

    const next = [customRoutine, ...current];
    writeRawList(next);
    return customRoutine;
  }

  /// Delete a saved routine by ID
  static deleteRoutine(routineId: string): RoutineModel[] {
    const current = readRawList();
    const next = current.filter((item) => item.id !== routineId);
    writeRawList(next);
    return next;
  }

  /// Convert a RoutineModel into a live WorkoutSession for ActiveLoggerScreen
  /// Pre-populates sets from previous workout history in Local DB (Isar Cache) and persists draft
  static toWorkoutSession(routine: RoutineModel, gymVenue: string): WorkoutSession {
    const sessionExercises: WorkoutExercise[] = routine.exercises.map((ex, exIdx) => {
      const setsCount = Math.max(1, Math.min(10, ex.targetSets || 3));
      const primaryMuscle = ex.primaryMuscle || findPrimaryMuscle(ex.name);
      const preFilledSets = WorkoutDraftCacheService.buildPreFilledSetsForExercise({
        exerciseName: ex.name,
        primaryMuscle,
        targetSets: setsCount,
        targetReps: ex.targetReps || 10,
        targetRpe: ex.targetRpe || 8.0,
        exerciseIndex: exIdx,
      });

      return {
        id: `ex-${Date.now()}-${exIdx}`,
        name: ex.name,
        vietnameseName: ex.vietnameseName || findVietnameseName(ex.name),
        primaryMuscle,
        secondaryMuscles: [],
        sets: preFilledSets,
      };
    });

    const newSession: WorkoutSession = {
      id: `session-${Date.now()}`,
      title: routine.title.replace(/\s*\(Fork từ.*?\)\s*$/i, ''),
      startTime: Date.now(),
      durationSeconds: 0,
      gymVenue,
      visibility: 'public',
      telemetryOverlayEnabled: true,
      totalTonnageKg: 0,
      totalSets: 0,
      exercises: sessionExercises,
    };

    WorkoutDraftCacheService.saveDraftSession(newSession);
    return newSession;
  }
}
