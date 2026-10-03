import { ExerciseType } from '../engine/workoutExecutionEngine';
import { SupersetGroup } from '../engine/supersetExecutionEngine';
import { WeightUnit } from '../engine/unitConverter';

export type MuscleGroup = 
  | 'chest' 
  | 'front_delts' 
  | 'side_delts' 
  | 'rear_delts' 
  | 'triceps' 
  | 'biceps' 
  | 'forearms'
  | 'lats' 
  | 'traps'
  | 'upper_back' 
  | 'lower_back' 
  | 'neck'
  | 'abs' 
  | 'quads' 
  | 'adductors'
  | 'abductors'
  | 'hamstrings' 
  | 'glutes' 
  | 'calves';

export interface ExerciseSet {
  id: string;
  setNumber: number;
  setType: 'W' | 'N' | 'D' | 'F'; // Warmup, Normal, Drop, Failure
  previous: string;
  /** Canonical weight in kg (synced with baseWeightKg for lossless multi-unit storage) */
  weight: number;
  /** Lossless canonical database weight in kg */
  baseWeightKg?: number;
  /** Added weight in kg for WEIGHTED_BODYWEIGHT exercises */
  addedWeightKg?: number;
  /** Counterweight/band assistance in kg for ASSISTED_BODYWEIGHT exercises */
  assistedWeightKg?: number;
  reps: number;
  rpe: number;
  completed: boolean;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  vietnameseName: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  sets: ExerciseSet[];
  notes?: string;
  /** Biomechanical classification: BARBELL_DUMBBELL_CABLE | WEIGHTED_BODYWEIGHT | ASSISTED_BODYWEIGHT | BODYWEIGHT_ONLY */
  exerciseType?: ExerciseType;
  /** Bodyweight engagement factor alpha (e.g. Push-up = 0.64, Pull-up = 1.0) */
  bodyweightEngagementFactor?: number;
  /** Optional ID linking this exercise to a Superset or Tri-set group */
  supersetGroupId?: string;
}

export interface WorkoutSession {
  id: string;
  title: string;
  startTime: number;
  endTime?: number;
  durationSeconds: number;
  exercises: WorkoutExercise[];
  /** Interleaved Superset & Tri-set group definitions */
  supersetGroups?: SupersetGroup[];
  /** User bodyweight in kg for Weighted/Assisted/Bodyweight-only calculations */
  userBodyweightKg?: number;
  /** Active display unit preference ('kg' | 'lbs') */
  preferredUnit?: WeightUnit;
  gymVenue: string;
  notes?: string;
  visibility: 'public' | 'friends' | 'private';
  attachedPhotoUrl?: string;
  telemetryOverlayEnabled: boolean;
  totalTonnageKg: number;
  totalSets: number;
  prAchieved?: {
    exerciseName: string;
    weight: number;
    reps: number;
    e1rm: number;
  };
}

export interface PostComment {
  id: string;
  userId?: string;
  userName: string;
  userAvatar: string;
  userBadge?: string;
  timestamp: string;
  createdAt?: string | number;
  text: string;
}

export interface FeedPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userBadge?: string;
  userGym: string;
  timestamp: string;
  createdAt?: string | number;
  title: string;
  durationMinutes: number;
  totalTonnageKg: number;
  totalSets: number;
  prHighlight?: string;
  caption: string;
  dapsCount: number;
  isDapped: boolean;
  commentsCount: number;
  comments?: PostComment[];
  forkCount: number;
  workoutSummary: {
    exercises: {
      name: string;
      topSet: string;
      primaryMuscle: MuscleGroup;
      volumeKg: number;
    }[];
    muscleVolumeMap: Partial<Record<MuscleGroup, number>>;
  };
  media?: {
    type: 'image' | 'video';
    url: string;
    telemetryData: {
      exercise: string;
      weightReps: string;
      rpe: number;
      volume: string;
    };
  };
}

export interface GymBuddy {
  id: string;
  name: string;
  username?: string;
  email?: string;
  avatar: string;
  gymLocation: string;
  status: 'online_gym' | 'resting' | 'streak_active';
  streakWeeks: number;
  lastNudgeTime?: number;
  canNudge: boolean;
}

export interface GymVenue {
  id: string;
  name: string;
  address: string;
  activeLiftersCount: number;
  rating: number;
  isCheckedIn: boolean;
  city: 'Hà Nội' | 'TP. Hồ Chí Minh' | 'Thanh Hóa' | 'Đà Nẵng';
  photo: string;
}

export interface RoutineTemplate {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  difficulty: 'Tân Binh' | 'Trung Cấp' | 'Cao Thủ';
  frequency: string;
  targetMuscles: string[];
  exercisesCount: number;
  forksCount: number;
  exercises: {
    name: string;
    sets: number;
    repsRange: string;
    muscle: MuscleGroup;
  }[];
}

export interface Challenge {
  id: string;
  title: string;
  badgeIcon: string;
  subtitle: string;
  targetVolumeTons: number;
  currentVolumeTons: number;
  daysRemaining: number;
  participantsCount: number;
  joined: boolean;
  rewardBadge: string;
}

export type NotificationCategory = 'nudge' | 'friend_request' | 'system' | 'direct_message';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  senderName?: string;
  senderAvatar?: string;
  senderUsername?: string;
  senderGym?: string;
  actionTaken?: 'accepted' | 'declined' | 'replied' | 'nudge_back';
  replyText?: string;
}

