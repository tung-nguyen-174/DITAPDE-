import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DrawingUtils,
  FilesetResolver,
  PoseLandmarker,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision';
import { Camera, RefreshCcw, RotateCcw, ScanLine, X, Zap } from 'lucide-react';
import { calculateE1RM } from '../../utils/fitnessCalculations';

// Pin the WASM runtime to the installed package version so JS and WASM always match.
const MEDIAPIPE_WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const POSE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

const C = {
  bg: '#0D1117',
  card: '#161B22',
  border: '#30363d',
  green: '#00FF88',
  cyan: '#00E5FF',
  red: '#FF3366',
  muted: '#8B949E',
};

const FONT_STACK = "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif";

// Assumed real-world shoulder→hip length used to convert pixels to meters.
const TORSO_LENGTH_M = 0.5;
const KG_PER_LB = 1 / 2.20462;

export interface KineticPRTestResult {
  weightKg: number;
  reps: number;
  e1rmKg: number;
  bestRep: number;
  peakVelocityMps: number;
  volumeKg: number;
}

interface KineticPRTrackerModalProps {
  liftKey: string;
  liftName: string;
  unit: 'kg' | 'lbs';
  currentPrKg: number;
  onClose: () => void;
  onSave: (result: KineticPRTestResult) => void;
}

/**
 * Per-lift motion profile: which joint angle defines the rep range of motion
 * and which landmark is tracked as the bar path for velocity.
 */
interface LiftMotionProfile {
  joint: 'elbow' | 'knee' | 'hip';
  barPoint: 'wrist' | 'hip' | 'shoulder';
  topAngle: number;
  bottomAngle: number;
  jointLabel: string;
  depthLabel: string;
  cue: string;
}

const MOTION_PROFILES: Record<string, LiftMotionProfile> = {
  bench_press: {
    joint: 'elbow',
    barPoint: 'wrist',
    topAngle: 150,
    bottomAngle: 90,
    jointLabel: 'Góc khuỷu tay',
    depthLabel: 'Chạm ngực',
    cue: 'Đặt camera ngang người, thấy rõ vai – khuỷu – cổ tay.',
  },
  overhead_press: {
    joint: 'elbow',
    barPoint: 'wrist',
    topAngle: 155,
    bottomAngle: 95,
    jointLabel: 'Góc khuỷu tay',
    depthLabel: 'Về vai',
    cue: 'Đứng nghiêng 45° so với camera, thấy rõ cả cánh tay.',
  },
  back_squat: {
    joint: 'knee',
    barPoint: 'hip',
    topAngle: 160,
    bottomAngle: 100,
    jointLabel: 'Góc gối',
    depthLabel: 'Đủ sâu',
    cue: 'Đặt camera bên hông, thấy rõ hông – gối – cổ chân.',
  },
  deadlift: {
    joint: 'hip',
    barPoint: 'shoulder',
    topAngle: 165,
    bottomAngle: 115,
    jointLabel: 'Góc hông',
    depthLabel: 'Tạ chạm sàn',
    cue: 'Đặt camera bên hông, thấy rõ vai – hông – gối.',
  },
};

// MediaPipe Pose landmark indices: [left, right]
const LANDMARK_IDX = {
  shoulder: [11, 12],
  elbow: [13, 14],
  wrist: [15, 16],
  hip: [23, 24],
  knee: [25, 26],
  ankle: [27, 28],
} as const;

const JOINT_TRIPLETS: Record<LiftMotionProfile['joint'], [keyof typeof LANDMARK_IDX, keyof typeof LANDMARK_IDX, keyof typeof LANDMARK_IDX]> = {
  elbow: ['shoulder', 'elbow', 'wrist'],
  knee: ['hip', 'knee', 'ankle'],
  hip: ['shoulder', 'hip', 'knee'],
};

type Phase = 'setup' | 'starting' | 'tracking' | 'review' | 'error';
type MotionStatus = 'SEARCHING' | 'READY' | 'LOCKOUT' | 'ECCENTRIC' | 'BOTTOM' | 'CONCENTRIC';

const STATUS_LABEL: Record<MotionStatus, string> = {
  SEARCHING: 'Đang tìm cơ thể',
  READY: 'Sẵn sàng',
  LOCKOUT: 'Lockout',
  ECCENTRIC: 'Hạ tạ ↓',
  BOTTOM: 'Điểm thấp nhất',
  CONCENTRIC: 'Đẩy lên ↑',
};

interface RepRecord {
  rep: number;
  peakVelocityMps: number;
}

interface TrackerEngine {
  bottomReached: boolean;
  currentRepPeak: number;
  reps: RepRecord[];
  lastBarY: number | null;
  lastTs: number;
  velocity: number;
  torsoPx: number;
  angle: number;
  status: MotionStatus;
}

interface HudSnapshot {
  reps: number;
  velocity: number;
  peakVelocity: number;
  lastRepVelocity: number;
  angle: number;
  romProgress: number;
  status: MotionStatus;
}

const createEngine = (): TrackerEngine => ({
  bottomReached: false,
  currentRepPeak: 0,
  reps: [],
  lastBarY: null,
  lastTs: 0,
  velocity: 0,
  torsoPx: 0,
  angle: 0,
  status: 'SEARCHING',
});

const EMPTY_HUD: HudSnapshot = {
  reps: 0,
  velocity: 0,
  peakVelocity: 0,
  lastRepVelocity: 0,
  angle: 0,
  romProgress: 0,
  status: 'SEARCHING',
};

let landmarkerPromise: Promise<PoseLandmarker> | null = null;

/** Lazily create (and cache) a single PoseLandmarker, preferring GPU with CPU fallback. */
const getPoseLandmarker = (): Promise<PoseLandmarker> => {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
      const baseOptions = { modelAssetPath: POSE_MODEL_URL };
      const options = {
        runningMode: 'VIDEO' as const,
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      };
      try {
        return await PoseLandmarker.createFromOptions(fileset, {
          ...options,
          baseOptions: { ...baseOptions, delegate: 'GPU' },
        });
      } catch {
        return await PoseLandmarker.createFromOptions(fileset, {
          ...options,
          baseOptions: { ...baseOptions, delegate: 'CPU' },
        });
      }
    })().catch((err) => {
      landmarkerPromise = null;
      throw err;
    });
  }
  return landmarkerPromise;
};

const angleBetween = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) => {
  const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let deg = Math.abs((rad * 180) / Math.PI);
  if (deg > 180) deg = 360 - deg;
  return deg;
};

const formatWeight = (kg: number, unit: 'kg' | 'lbs') =>
  unit === 'lbs' ? `${Math.round(kg * 2.20462 * 10) / 10} lbs` : `${Math.round(kg * 10) / 10} kg`;

export const KineticPRTrackerModal: React.FC<KineticPRTrackerModalProps> = ({
  liftKey,
  liftName,
  unit,
  currentPrKg,
  onClose,
  onSave,
}) => {
  const profile = MOTION_PROFILES[liftKey] ?? MOTION_PROFILES.bench_press;

  const [phase, setPhase] = useState<Phase>('setup');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [weightInput, setWeightInput] = useState<string>(() => {
    if (currentPrKg <= 0) return '';
    const val = unit === 'lbs' ? currentPrKg * 2.20462 : currentPrKg;
    return String(Math.round(val * 10) / 10);
  });
  const [hud, setHud] = useState<HudSnapshot>(EMPTY_HUD);
  const [result, setResult] = useState<KineticPRTestResult | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(3 / 4);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const engineRef = useRef<TrackerEngine>(createEngine());
  const lastVideoTimeRef = useRef<number>(-1);
  const lastHudPushRef = useRef<number>(0);
  const weightKgRef = useRef<number>(0);

  const parsedWeight = parseFloat(weightInput);
  const weightValid = !isNaN(parsedWeight) && parsedWeight > 0 && parsedWeight <= 1000;
  const isMirrored = facingMode === 'user';

  // Warm up the model while the user is entering their weight.
  useEffect(() => {
    getPoseLandmarker().catch(() => undefined);
  }, []);

  // Lock background scroll while the full-screen modal is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(
    () => () => {
      stopCamera();
      audioCtxRef.current?.close().catch(() => undefined);
    },
    [stopCamera]
  );

  // Fit the stage to the available area while preserving the stream aspect ratio.
  useLayoutEffect(() => {
    const wrap = stageWrapRef.current;
    if (!wrap) return;
    const fit = () => {
      const { width, height } = wrap.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      const fittedWidth = Math.min(width, height * aspectRatio);
      setStageSize({ width: fittedWidth, height: fittedWidth / aspectRatio });
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [aspectRatio, phase]);

  const playRepBeep = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // Audio feedback is best-effort only.
    }
    if ('vibrate' in navigator) navigator.vibrate?.(40);
  };

  const processLandmarks = (landmarks: NormalizedLandmark[] | undefined, width: number, height: number, ts: number) => {
    const engine = engineRef.current;
    if (!landmarks) {
      engine.status = 'SEARCHING';
      engine.lastBarY = null;
      return;
    }

    const [aKey, bKey, cKey] = JOINT_TRIPLETS[profile.joint];
    const sideScore = (side: 0 | 1) =>
      [aKey, bKey, cKey].reduce((sum, key) => sum + (landmarks[LANDMARK_IDX[key][side]]?.visibility ?? 0), 0);
    const side: 0 | 1 = sideScore(0) >= sideScore(1) ? 0 : 1;
    const pt = (key: keyof typeof LANDMARK_IDX) => {
      const lm = landmarks[LANDMARK_IDX[key][side]];
      return { x: lm.x * width, y: lm.y * height, v: lm.visibility ?? 0 };
    };

    const a = pt(aKey);
    const b = pt(bKey);
    const c = pt(cKey);
    if (Math.min(a.v, b.v, c.v) < 0.5) {
      engine.status = 'SEARCHING';
      engine.lastBarY = null;
      return;
    }

    const shoulder = pt('shoulder');
    const hip = pt('hip');
    const torsoPx = Math.hypot(hip.x - shoulder.x, hip.y - shoulder.y);
    engine.torsoPx = engine.torsoPx > 0 ? engine.torsoPx * 0.9 + torsoPx * 0.1 : torsoPx;
    const metersPerPx = TORSO_LENGTH_M / Math.max(engine.torsoPx, 1);

    // Upward bar velocity (positive = concentric), smoothed with an EMA.
    const bar = pt(profile.barPoint);
    const dt = (ts - engine.lastTs) / 1000;
    if (engine.lastBarY !== null && dt > 0 && dt < 0.5) {
      const instant = ((engine.lastBarY - bar.y) * metersPerPx) / dt;
      engine.velocity = engine.velocity * 0.5 + instant * 0.5;
    } else {
      engine.velocity = 0;
    }
    engine.lastBarY = bar.y;
    engine.lastTs = ts;

    const angle = angleBetween(a, b, c);
    engine.angle = angle;

    if (angle <= profile.bottomAngle) {
      if (!engine.bottomReached) engine.currentRepPeak = 0;
      engine.bottomReached = true;
    }

    if (engine.bottomReached && engine.velocity > engine.currentRepPeak) {
      engine.currentRepPeak = engine.velocity;
    }

    if (angle >= profile.topAngle) {
      if (engine.bottomReached) {
        engine.reps.push({
          rep: engine.reps.length + 1,
          peakVelocityMps: Math.round(engine.currentRepPeak * 100) / 100,
        });
        engine.bottomReached = false;
        engine.currentRepPeak = 0;
        playRepBeep();
      }
      engine.status = 'LOCKOUT';
    } else if (engine.bottomReached) {
      engine.status = engine.velocity > 0.05 && angle > profile.bottomAngle ? 'CONCENTRIC' : 'BOTTOM';
    } else {
      engine.status = engine.velocity < -0.05 ? 'ECCENTRIC' : 'READY';
    }
  };

  const drawOverlay = (landmarks: NormalizedLandmark[] | undefined) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!landmarks) return;
    const utils = new DrawingUtils(ctx);
    const scale = Math.max(1, canvas.width / 480);
    utils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, { color: C.green, lineWidth: 3 * scale });
    utils.drawLandmarks(landmarks, { color: C.cyan, fillColor: C.bg, lineWidth: 1.5 * scale, radius: 3.5 * scale });
  };

  const pushHud = (force = false) => {
    const now = performance.now();
    if (!force && now - lastHudPushRef.current < 100) return;
    lastHudPushRef.current = now;
    const engine = engineRef.current;
    const range = profile.topAngle - profile.bottomAngle;
    const romProgress = engine.angle > 0 ? Math.min(1, Math.max(0, (profile.topAngle - engine.angle) / range)) : 0;
    const peaks = engine.reps.map((r) => r.peakVelocityMps);
    setHud({
      reps: engine.reps.length,
      velocity: Math.max(0, engine.velocity),
      peakVelocity: peaks.length ? Math.max(...peaks) : 0,
      lastRepVelocity: peaks.length ? peaks[peaks.length - 1] : 0,
      angle: Math.round(engine.angle),
      romProgress,
      status: engine.status,
    });
  };

  const runLoop = (landmarker: PoseLandmarker) => {
    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !streamRef.current) return;

      if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        const ts = performance.now();
        try {
          const res = landmarker.detectForVideo(video, ts);
          const landmarks = res.landmarks?.[0];
          processLandmarks(landmarks, canvas.width, canvas.height, ts);
          drawOverlay(landmarks);
          pushHud();
        } catch (err) {
          console.warn('Pose detection frame skipped:', err);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  /**
   * Must run directly from a tap: iOS Safari only grants camera + audio playback
   * inside an explicit user gesture.
   */
  const handleStartCamera = async (nextFacing: 'user' | 'environment' = facingMode) => {
    if (!weightValid) return;
    weightKgRef.current = unit === 'lbs' ? parsedWeight * KG_PER_LB : parsedWeight;

    if (!audioCtxRef.current) {
      const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtor) audioCtxRef.current = new AudioCtor();
    }
    audioCtxRef.current?.resume().catch(() => undefined);

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg('Trình duyệt không hỗ trợ camera. Hãy mở bằng Safari/Chrome qua HTTPS.');
      setPhase('error');
      return;
    }

    stopCamera();
    setPhase('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: nextFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) throw new Error('Video element unavailable');
      video.muted = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.srcObject = stream;
      await new Promise<void>((resolve) => {
        if (video.readyState >= 1) return resolve();
        video.onloadedmetadata = () => resolve();
      });
      await video.play();

      if (video.videoWidth && video.videoHeight) {
        setAspectRatio(video.videoWidth / video.videoHeight);
      }

      const landmarker = await getPoseLandmarker();
      engineRef.current = createEngine();
      lastVideoTimeRef.current = -1;
      setHud(EMPTY_HUD);
      setPhase('tracking');
      runLoop(landmarker);
    } catch (err) {
      stopCamera();
      const name = (err as { name?: string })?.name;
      setErrorMsg(
        name === 'NotAllowedError'
          ? 'Bạn chưa cấp quyền camera. Vào Cài đặt trình duyệt để cho phép rồi thử lại.'
          : name === 'NotFoundError'
          ? 'Không tìm thấy camera trên thiết bị này.'
          : 'Không thể khởi động camera hoặc mô hình AI. Kiểm tra kết nối mạng và thử lại.'
      );
      setPhase('error');
    }
  };

  const handleFlipCamera = () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    handleStartCamera(next);
  };

  const handleResetSet = () => {
    engineRef.current = createEngine();
    setHud(EMPTY_HUD);
  };

  const handleFinish = () => {
    const engine = engineRef.current;
    stopCamera();
    const reps = engine.reps.length;
    const weightKg = Math.round(weightKgRef.current * 10) / 10;
    const best = engine.reps.reduce<RepRecord | null>(
      (top, r) => (!top || r.peakVelocityMps > top.peakVelocityMps ? r : top),
      null
    );
    setResult({
      weightKg,
      reps,
      e1rmKg: calculateE1RM(weightKg, reps),
      bestRep: best?.rep ?? 0,
      peakVelocityMps: best?.peakVelocityMps ?? 0,
      volumeKg: Math.round(weightKg * reps * 10) / 10,
    });
    setPhase('review');
  };

  const handleCancel = () => {
    stopCamera();
    onClose();
  };

  const showStage = phase === 'starting' || phase === 'tracking';
  const isNewPr = result ? result.reps > 0 && result.e1rmKg > currentPrKg : false;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Test PR bằng camera: ${liftName}`}
      className="fixed inset-0 z-[100] flex flex-col text-[#E6EDF3] overscroll-none"
      style={{
        backgroundColor: C.bg,
        fontFamily: FONT_STACK,
        paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
        paddingLeft: 'max(16px, env(safe-area-inset-left, 16px))',
        paddingRight: 'max(16px, env(safe-area-inset-right, 16px))',
      }}
    >
      {/* Top bar with iPhone 15 safe container */}
      <div className="flex items-center justify-between gap-3 pb-3 w-full max-w-[430px] mx-auto shrink-0">
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: C.green }}>
            AI Kinetic Test
          </span>
          <span className="text-lg font-black uppercase tracking-tight truncate">{liftName}</span>
        </div>
        <button
          type="button"
          onClick={handleCancel}
          className="min-w-[48px] min-h-[48px] w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center active:scale-95 transition-transform"
          style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, color: C.muted }}
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Camera stage (kept mounted so the <video> element exists before getUserMedia resolves) */}
      <div
        ref={stageWrapRef}
        className={`relative flex-1 min-h-0 w-full max-w-[430px] mx-auto items-center justify-center ${
          showStage ? 'flex' : 'hidden'
        }`}
      >
        <div
          className="relative overflow-hidden rounded-2xl bg-black shadow-2xl"
          style={{ width: stageSize.width || '100%', height: stageSize.height || '100%', border: `1px solid ${C.border}` }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            webkit-playsinline="true"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: isMirrored ? 'scaleX(-1)' : undefined }}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ transform: isMirrored ? 'scaleX(-1)' : undefined }}
          />

          {phase === 'starting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
              <ScanLine className="w-8 h-8 animate-pulse" style={{ color: C.cyan }} />
              <span className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: C.cyan }}>
                Đang khởi tạo camera & AI...
              </span>
            </div>
          )}

          {phase === 'tracking' && (
            <>
              {/* HUD */}
              <div
                className="absolute top-2.5 left-2.5 right-2.5 rounded-xl p-3 backdrop-blur-md"
                style={{ backgroundColor: 'rgba(13,17,23,0.85)', border: `1px solid ${C.border}` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: C.muted }}>
                      Reps hợp lệ
                    </span>
                    <span className="text-5xl font-black tabular-nums leading-none" style={{ color: C.green }}>
                      {hud.reps}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: C.muted }}>
                      Bar velocity
                    </span>
                    <span className="text-3xl font-black tabular-nums leading-none" style={{ color: C.cyan }}>
                      {hud.velocity.toFixed(2)}
                      <span className="text-xs font-bold ml-1">m/s</span>
                    </span>
                    <span
                      className="mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{
                        color: hud.status === 'SEARCHING' ? C.red : C.green,
                        backgroundColor: hud.status === 'SEARCHING' ? 'rgba(255,51,102,0.12)' : 'rgba(0,255,136,0.12)',
                      }}
                    >
                      {STATUS_LABEL[hud.status]}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 font-mono text-[11px] tabular-nums">
                  <div className="flex flex-col">
                    <span style={{ color: C.muted }}>PEAK</span>
                    <span style={{ color: C.cyan }}>{hud.peakVelocity.toFixed(2)} m/s</span>
                  </div>
                  <div className="flex flex-col">
                    <span style={{ color: C.muted }}>REP CUỐI</span>
                    <span style={{ color: C.cyan }}>{hud.lastRepVelocity.toFixed(2)} m/s</span>
                  </div>
                  <div className="flex flex-col">
                    <span style={{ color: C.muted }}>VOLUME</span>
                    <span style={{ color: C.cyan }}>
                      {formatWeight(weightKgRef.current * hud.reps, unit)}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1" style={{ color: C.muted }}>
                    <span>
                      {profile.jointLabel.toUpperCase()}: {hud.angle || '--'}°
                    </span>
                    <span style={{ color: hud.romProgress >= 1 ? C.green : C.muted }}>
                      {hud.romProgress >= 1 ? `✓ ${profile.depthLabel.toUpperCase()}` : profile.depthLabel.toUpperCase()}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}>
                    <div
                      className="h-full rounded-full transition-[width] duration-100"
                      style={{
                        width: `${hud.romProgress * 100}%`,
                        backgroundColor: hud.romProgress >= 1 ? C.green : C.cyan,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Floating stage controls with ergonomic touch targets */}
              <div className="absolute bottom-2.5 right-2.5 flex gap-2">
                <button
                  type="button"
                  onClick={handleResetSet}
                  className="min-h-[48px] h-12 px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-bold uppercase backdrop-blur-md active:scale-95 transition-transform"
                  style={{ backgroundColor: 'rgba(13,17,23,0.85)', border: `1px solid ${C.red}`, color: C.red }}
                  aria-label="Đặt lại số rep"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleFlipCamera}
                  className="min-w-[48px] min-h-[48px] w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-md active:scale-95 transition-transform"
                  style={{ backgroundColor: 'rgba(13,17,23,0.85)', border: `1px solid ${C.border}`, color: '#E6EDF3' }}
                  aria-label="Đổi camera trước/sau"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Setup step: weight loaded + explicit camera start gesture */}
      {phase === 'setup' && (
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain scroll-touch w-full max-w-[430px] mx-auto flex flex-col gap-4 pr-1">
          <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(0,229,255,0.1)', color: C.cyan }}
              >
                <Camera className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black uppercase tracking-tight">Chuẩn bị bài test</span>
                <span className="text-xs" style={{ color: C.muted }}>{profile.cue}</span>
              </div>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: C.muted }}>
                Mức tạ đã lắp ({unit})
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                min="1"
                max="1000"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder={`VD: ${unit === 'lbs' ? '225' : '100'}`}
                className="w-full min-h-[56px] rounded-xl px-4 text-2xl font-black tabular-nums focus:outline-none"
                style={{ backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.cyan, fontSize: '20px' }}
              />
            </label>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: C.muted }}>
                Camera
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(['environment', 'user'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFacingMode(mode)}
                    className="min-h-[48px] rounded-xl text-xs font-bold uppercase tracking-wide transition-colors"
                    style={{
                      backgroundColor: facingMode === mode ? 'rgba(0,255,136,0.12)' : C.bg,
                      border: `1px solid ${facingMode === mode ? C.green : C.border}`,
                      color: facingMode === mode ? C.green : C.muted,
                    }}
                  >
                    {mode === 'environment' ? 'Camera sau' : 'Camera trước'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <ul className="text-xs flex flex-col gap-1.5 px-1 pb-4" style={{ color: C.muted }}>
            <li>• Dựng điện thoại cố định, cách 2–3 m, thấy toàn bộ cơ thể.</li>
            <li>• Rep chỉ được tính khi đủ biên độ ({profile.depthLabel.toLowerCase()}) và về lockout.</li>
            <li>• Tốc độ tạ ước tính từ chiều dài thân người (~{TORSO_LENGTH_M * 100} cm).</li>
          </ul>
        </div>
      )}

      {phase === 'error' && (
        <div className="flex-1 min-h-0 w-full max-w-[430px] mx-auto flex flex-col items-center justify-center gap-3 text-center px-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,51,102,0.12)', color: C.red }}
          >
            <X className="w-7 h-7" />
          </div>
          <span className="text-sm font-black uppercase">Không thể bắt đầu test</span>
          <span className="text-xs" style={{ color: C.muted }}>{errorMsg}</span>
        </div>
      )}

      {/* Bottom controls with natural Thumb Zone reach */}
      {phase !== 'review' && (
        <div className="w-full max-w-[430px] mx-auto pt-3 flex flex-col gap-2 shrink-0">
          {phase === 'setup' || phase === 'error' ? (
            <button
              type="button"
              disabled={!weightValid}
              onClick={() => handleStartCamera()}
              className="min-h-[56px] rounded-2xl text-base font-black uppercase tracking-wide flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-40 shadow-lg"
              style={{ backgroundColor: C.green, color: '#000' }}
            >
              <Camera className="w-5 h-5" />
              {phase === 'error' ? 'Thử lại' : 'Bật camera & bắt đầu'}
            </button>
          ) : (
            <button
              type="button"
              disabled={phase !== 'tracking'}
              onClick={handleFinish}
              className="min-h-[56px] rounded-2xl text-base font-black uppercase tracking-wide flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-40 shadow-lg"
              style={{ backgroundColor: C.green, color: '#000' }}
            >
              🏁 Hoàn thành bài test
            </button>
          )}
          <button
            type="button"
            onClick={handleCancel}
            className="min-h-[48px] rounded-2xl text-sm font-bold uppercase tracking-wide active:scale-[0.98] transition-transform"
            style={{ border: `1px solid ${C.red}`, color: C.red, backgroundColor: 'transparent' }}
          >
            Hủy bỏ
          </button>
        </div>
      )}

      {/* Confirmation drawer — native mobile Bottom Sheet with gesture indicator safe area */}
      {phase === 'review' && result && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full max-w-[430px] rounded-t-3xl px-5 pt-3 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-bottom duration-200"
            style={{
              backgroundColor: C.card,
              borderTop: `1px solid ${C.border}`,
              paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
            }}
          >
            <div className="w-10 h-1.5 rounded-full mx-auto" style={{ backgroundColor: C.border }} />
            <div className="flex flex-col gap-1">
              <span className="text-xl font-black uppercase tracking-tight" style={{ color: C.green }}>
                {result.reps > 0 ? '🔥 Kết quả test PR' : 'Chưa ghi nhận rep'}
              </span>
              <span className="text-xs" style={{ color: C.muted }}>
                {liftName} · 1RM ước tính{' '}
                <strong style={{ color: C.cyan }}>{result.e1rmKg > 0 ? formatWeight(result.e1rmKg, unit) : '--'}</strong>
                {isNewPr && (
                  <span
                    className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase"
                    style={{ backgroundColor: 'rgba(0,255,136,0.15)', color: C.green, border: `1px solid ${C.green}` }}
                  >
                    <Zap className="w-3 h-3" /> PR mới
                  </span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Rep tốt nhất', value: result.bestRep > 0 ? `Rep #${result.bestRep}` : '--' },
                { label: 'Mức tạ đã lắp', value: formatWeight(result.weightKg, unit) },
                { label: 'Tốc độ đỉnh', value: `${result.peakVelocityMps.toFixed(2)} m/s` },
                { label: 'Tổng reps', value: `${result.reps} reps` },
              ].map((m) => (
                <div key={m.label} className="rounded-xl p-3" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                  <span className="block text-[11px] font-bold uppercase tracking-wide" style={{ color: C.muted }}>
                    {m.label}
                  </span>
                  <strong className="block text-lg font-black tabular-nums" style={{ color: C.cyan }}>
                    {m.value}
                  </strong>
                </div>
              ))}
            </div>

            <div className="text-xs flex items-center justify-between" style={{ color: C.muted }}>
              <span>Tổng volume</span>
              <strong className="tabular-nums" style={{ color: C.cyan }}>{formatWeight(result.volumeKg, unit)}</strong>
            </div>

            {result.reps === 0 && (
              <span className="text-xs" style={{ color: C.red }}>
                AI chưa thấy rep nào đủ biên độ. Hãy chỉnh góc camera và test lại.
              </span>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                disabled={result.reps === 0}
                onClick={() => onSave(result)}
                className="min-h-[56px] rounded-2xl text-base font-black uppercase tracking-wide active:scale-[0.98] transition-transform disabled:opacity-40 shadow-lg"
                style={{ backgroundColor: C.green, color: '#000' }}
              >
                Lưu vào Hồ sơ
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[48px] rounded-2xl text-sm font-bold uppercase tracking-wide active:scale-[0.98] transition-transform"
                style={{ border: `1px solid ${C.red}`, color: C.red, backgroundColor: 'transparent' }}
              >
                Bỏ qua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
