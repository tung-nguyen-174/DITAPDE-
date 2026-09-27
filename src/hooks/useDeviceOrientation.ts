import { useState, useEffect, useCallback } from 'react';

export type DeviceOrientation = 'portrait' | 'landscape';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type SimulatedDevice = 'auto' | 'phone' | 'tablet' | 'desktop';

export interface DeviceOrientationState {
  orientation: DeviceOrientation;
  isLandscape: boolean;
  isPortrait: boolean;
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  viewportWidth: number;
  viewportHeight: number;
  angle: number;
  // Simulation & Manual Overrides
  simulatedDevice: SimulatedDevice;
  simulatedOrientation: DeviceOrientation;
  isRotatedSimulated: boolean;
  toggleRotate: () => void;
  setSimulatedDevice: (device: SimulatedDevice) => void;
  setSimulatedOrientation: (orientation: DeviceOrientation) => void;
  resetToAuto: () => void;
}

export function useDeviceOrientation(): DeviceOrientationState {
  // Real physical window state
  const [windowSize, setWindowSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 390,
    height: typeof window !== 'undefined' ? window.innerHeight : 844,
  }));

  const [physicalOrientation, setPhysicalOrientation] = useState<DeviceOrientation>(() => {
    if (typeof window !== 'undefined') {
      if (window.matchMedia && window.matchMedia('(orientation: landscape)').matches) {
        return 'landscape';
      }
      return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    }
    return 'portrait';
  });

  const [screenAngle, setScreenAngle] = useState<number>(0);

  // Simulation controls (for testing rotation on desktop / iframe preview)
  const [simulatedDevice, setSimulatedDevice] = useState<SimulatedDevice>('auto');
  const [manualOrientationOverride, setManualOrientationOverride] = useState<DeviceOrientation | null>(null);

  // Update real screen orientation
  const handleResizeOrRotate = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    setWindowSize({ width, height });

    // Determine orientation from screen.orientation or dimensions
    let isLand = width > height;
    if (window.screen && window.screen.orientation && window.screen.orientation.type) {
      isLand = window.screen.orientation.type.includes('landscape');
      setScreenAngle(window.screen.orientation.angle || 0);
    } else if (typeof window.orientation !== 'undefined') {
      const angle = Number(window.orientation);
      setScreenAngle(angle);
      isLand = Math.abs(angle) === 90;
    }

    setPhysicalOrientation(isLand ? 'landscape' : 'portrait');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    handleResizeOrRotate();

    window.addEventListener('resize', handleResizeOrRotate, { passive: true });
    window.addEventListener('orientationchange', handleResizeOrRotate, { passive: true });

    if (window.screen && window.screen.orientation) {
      try {
        window.screen.orientation.addEventListener('change', handleResizeOrRotate);
      } catch (e) {
        // Fallback for older browsers
      }
    }

    const mql = window.matchMedia('(orientation: landscape)');
    const handleMqlChange = (e: MediaQueryListEvent) => {
      setPhysicalOrientation(e.matches ? 'landscape' : 'portrait');
    };
    if (mql.addEventListener) {
      mql.addEventListener('change', handleMqlChange);
    }

    return () => {
      window.removeEventListener('resize', handleResizeOrRotate);
      window.removeEventListener('orientationchange', handleResizeOrRotate);
      if (window.screen && window.screen.orientation) {
        try {
          window.screen.orientation.removeEventListener('change', handleResizeOrRotate);
        } catch (e) {
          // ignore
        }
      }
      if (mql.removeEventListener) {
        mql.removeEventListener('change', handleMqlChange);
      }
    };
  }, [handleResizeOrRotate]);

  // Compute effective orientation
  const effectiveOrientation: DeviceOrientation = manualOrientationOverride || physicalOrientation;
  const isLandscape = effectiveOrientation === 'landscape';
  const isPortrait = effectiveOrientation === 'portrait';

  // Determine physical device category from min dimension
  const minDimension = Math.min(windowSize.width, windowSize.height);
  const detectedDeviceType: DeviceType =
    minDimension < 600 ? 'mobile' : minDimension < 1024 ? 'tablet' : 'desktop';

  // Effective device type
  const effectiveDeviceType: DeviceType =
    simulatedDevice === 'auto'
      ? detectedDeviceType
      : simulatedDevice === 'phone'
      ? 'mobile'
      : simulatedDevice === 'tablet'
      ? 'tablet'
      : 'desktop';

  const isMobile = effectiveDeviceType === 'mobile';
  const isTablet = effectiveDeviceType === 'tablet';
  const isDesktop = effectiveDeviceType === 'desktop';

  // Toggle rotation callback
  const toggleRotate = useCallback(() => {
    setManualOrientationOverride((prev) => {
      const current = prev || physicalOrientation;
      return current === 'portrait' ? 'landscape' : 'portrait';
    });
  }, [physicalOrientation]);

  const resetToAuto = useCallback(() => {
    setManualOrientationOverride(null);
    setSimulatedDevice('auto');
  }, []);

  return {
    orientation: effectiveOrientation,
    isLandscape,
    isPortrait,
    deviceType: effectiveDeviceType,
    isMobile,
    isTablet,
    isDesktop,
    viewportWidth: windowSize.width,
    viewportHeight: windowSize.height,
    angle: screenAngle,
    simulatedDevice,
    simulatedOrientation: effectiveOrientation,
    isRotatedSimulated: manualOrientationOverride !== null,
    toggleRotate,
    setSimulatedDevice,
    setSimulatedOrientation: (ori: DeviceOrientation) => setManualOrientationOverride(ori),
    resetToAuto,
  };
}
