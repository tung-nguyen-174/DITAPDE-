import { WorkoutDraftCacheService, AIVerifiedPRRecord } from '../../services/workoutDraftCacheService';
import { calculateE1RM } from '../../utils/fitnessCalculations';

// Minimal in-memory localStorage shim for headless node testing if not present
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => {
      store.set(key, String(val));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    length: 0,
  } as Storage;
}

export function runAIVerifiedPRTestSuite(): {
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
  failures: string[];
} {
  let passedCount = 0;
  let totalCount = 0;
  const failures: string[] = [];

  const assert = (name: string, condition: boolean, detail?: string) => {
    totalCount++;
    if (condition) {
      passedCount++;
    } else {
      failures.push(`${name}: ${detail || 'Assertion failed'}`);
    }
  };

  localStorage.clear();

  // Test 1: Initially empty
  const initialMap = WorkoutDraftCacheService.getAIVerifiedPRMap();
  assert('Initial map should be empty object', Object.keys(initialMap).length === 0);

  // Test 2: Save AI Verified PR for bench_press
  const benchTestResult = {
    weightKg: 100,
    reps: 3,
    e1rmKg: calculateE1RM(100, 3),
    bestRep: 2,
    peakVelocityMps: 0.48,
    volumeKg: 300,
  };

  const updatedMap = WorkoutDraftCacheService.saveAIVerifiedPR('bench_press', benchTestResult);
  assert('bench_press should exist in updated map', Boolean(updatedMap.bench_press));
  assert('bench_press weight should be 100', updatedMap.bench_press.weightKg === 100);
  assert('bench_press reps should be 3', updatedMap.bench_press.reps === 3);
  assert('bench_press e1rmKg should match calculated E1RM', updatedMap.bench_press.e1rmKg === benchTestResult.e1rmKg);
  assert('bench_press peakVelocityMps should be 0.48', updatedMap.bench_press.peakVelocityMps === 0.48);
  assert('bench_press verifiedAt should be valid ISO string', Boolean(updatedMap.bench_press.verifiedAt));
  assert('bench_press updatedAt should be defined', Boolean(updatedMap.bench_press.updatedAt));

  // Test 3: Read back from storage
  const loadedMap = WorkoutDraftCacheService.getAIVerifiedPRMap();
  assert('Loaded map should contain bench_press', Boolean(loadedMap.bench_press));
  assert('Loaded map values should match saved values', loadedMap.bench_press.volumeKg === 300);

  // Test 4: Save second exercise (back_squat)
  const squatTestResult = {
    weightKg: 140,
    reps: 5,
    e1rmKg: calculateE1RM(140, 5),
    bestRep: 1,
    peakVelocityMps: 0.52,
    volumeKg: 700,
  };
  const secondMap = WorkoutDraftCacheService.saveAIVerifiedPR('back_squat', squatTestResult);
  assert('Both bench_press and back_squat should exist', Boolean(secondMap.bench_press && secondMap.back_squat));
  assert('back_squat weightKg should be 140', secondMap.back_squat.weightKg === 140);

  return {
    allPassed: failures.length === 0,
    passedCount,
    totalCount,
    failures,
  };
}

if (process.argv[1]?.includes('aiVerifiedPR.test.ts')) {
  const result = runAIVerifiedPRTestSuite();
  console.log(`[AI Verified PR Tests] Passed: ${result.passedCount}/${result.totalCount}, All passed: ${result.allPassed}`);
  if (result.failures.length > 0) {
    console.error('Failures:', result.failures);
    process.exit(1);
  }
}
