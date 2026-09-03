import React, { useEffect, useRef } from 'react';
import { AlertOctagon, CheckCircle } from 'lucide-react';

interface EmergencyHUDProps {
  countdown: number | null;
  onCancel: () => void;
  isConfirmed: boolean;
  isSent: boolean;
}

export const EmergencyHUD: React.FC<EmergencyHUDProps> = ({ countdown, onCancel, isSent }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  void audioRef;

  useEffect(() => {
    // Generate emergency sound alert using Web Audio API
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      let isPlaying = true;

      const playBeep = () => {
        if (!isPlaying || isSent) return;
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(850, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(450, audioCtx.currentTime + 0.25);

        gainNode.gain.setValueAtTime(0.35, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.25);

        setTimeout(playBeep, 600);
      };

      if (!isSent) {
        playBeep();
      }

      return () => {
        isPlaying = false;
        audioCtx.close().catch(() => {});
      };
    } catch {
      // Audio context might be restricted before user interaction
    }
  }, [isSent]);

  if (isSent) {
    return (
      <div className="emergency-fullscreen-overlay emergency-fullscreen-overlay--sent">
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          background: 'rgba(5, 150, 105, 0.1)',
          border: '2px solid var(--accent-green)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <CheckCircle size={38} color="var(--accent-green)" />
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '8px' }}>
          SOS Alert Sent
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, maxWidth: '280px', marginBottom: '32px' }}>
          Emergency contacts have been notified with your live GPS location.
        </p>
        <button
          id="btn-return-dashboard"
          className="btn btn-primary"
          style={{ width: '100%', maxWidth: '280px', padding: '14px' }}
          onClick={onCancel}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const safeCountdown = countdown ?? 30;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - safeCountdown / 30);

  return (
    <div className="emergency-fullscreen-overlay">
      {/* Top Header */}
      <div>
        <div className="emergency-header-badge">
          <AlertOctagon size={16} color="#ffffff" />
          <span>Impact Detected</span>
        </div>

        <h1 className="emergency-title">
          CRASH DETECTED
        </h1>

        <p className="emergency-subtitle">
          Emergency SOS will trigger automatically in
        </p>
      </div>

      {/* Big Circular Countdown */}
      <div className="emergency-timer-wrap">
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle
            cx="95"
            cy="95"
            r={radius}
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="10"
            fill="none"
          />
          <circle
            cx="95"
            cy="95"
            r={radius}
            stroke="#ffffff"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="emergency-timer-num">
          {safeCountdown}
        </div>
      </div>

      {/* Sole prominent action button */}
      <div style={{ width: '100%' }}>
        <button
          id="btn-cancel-emergency"
          className="emergency-btn-ok"
          onClick={onCancel}
        >
          I'M OK — CANCEL SOS
        </button>
        <p style={{ fontSize: '11px', opacity: 0.85, marginTop: '12px' }}>
          Tap button above if you do not require emergency assistance
        </p>
      </div>
    </div>
  );
};
