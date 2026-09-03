import { useState, useEffect, useCallback } from 'react';

export type SystemState = 'NORMAL' | 'POTHOLE' | 'HARD_BRAKING' | 'CRASH_PENDING' | 'CRASH_CONFIRMED' | 'SOS_SENT';

export interface TelemetryData {
  gForce: number;
  pitch: number;
  roll: number;
  speed: number;
}

export function useHardwareSimulator() {
  const [telemetry, setTelemetry] = useState<TelemetryData>({ gForce: 1.0, pitch: 0, roll: 0, speed: 45 });
  const [systemState, setSystemState] = useState<SystemState>('NORMAL');
  const [countdown, setCountdown] = useState<number | null>(null);
  
  // Fake telemetry generator
  useEffect(() => {
    if (systemState !== 'NORMAL') return;
    
    const interval = setInterval(() => {
      setTelemetry(prev => ({
        gForce: 1.0 + (Math.random() * 0.2 - 0.1), // Jitter around 1G
        pitch: prev.pitch * 0.9 + (Math.random() * 4 - 2), // Smooth random pitch
        roll: prev.roll * 0.9 + (Math.random() * 4 - 2), // Smooth random roll
        speed: Math.max(0, Math.min(120, prev.speed + (Math.random() * 2 - 1)))
      }));
    }, 100); // 10Hz update
    
    return () => clearInterval(interval);
  }, [systemState]);

  // Handle countdown
  useEffect(() => {
    if (systemState === 'CRASH_PENDING' && countdown !== null) {
      if (countdown <= 0) {
        setSystemState('CRASH_CONFIRMED');
        setTimeout(() => setSystemState('SOS_SENT'), 3000); // Simulate SMS send time
        return;
      }
      const timer = setTimeout(() => setCountdown(c => (c !== null ? c - 1 : 0)), 1000);
      return () => clearTimeout(timer);
    }
  }, [systemState, countdown]);

  const triggerCrash = useCallback(() => {
    setTelemetry({ gForce: 4.8, pitch: -80, roll: 90, speed: 0 }); // Huge spike
    setSystemState('CRASH_PENDING');
    setCountdown(30);
  }, []);

  const triggerPothole = useCallback(() => {
    setTelemetry(prev => ({ ...prev, gForce: 2.5 })); // Short spike
    setSystemState('POTHOLE');
    setTimeout(() => setSystemState('NORMAL'), 2000);
  }, []);

  const triggerBraking = useCallback(() => {
    setTelemetry(prev => ({ ...prev, pitch: 45, speed: Math.max(0, prev.speed - 30) })); 
    setSystemState('HARD_BRAKING');
    setTimeout(() => setSystemState('NORMAL'), 2000);
  }, []);

  const cancelAlert = useCallback(() => {
    if (systemState === 'CRASH_PENDING') {
      setSystemState('NORMAL');
      setCountdown(null);
      setTelemetry(prev => ({ ...prev, gForce: 1.0, pitch: 0, roll: 0 }));
    }
  }, [systemState]);

  return {
    telemetry,
    systemState,
    countdown,
    triggerCrash,
    triggerPothole,
    triggerBraking,
    cancelAlert,
  };
}
