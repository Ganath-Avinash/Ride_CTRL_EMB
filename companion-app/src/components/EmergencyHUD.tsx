import React, { useEffect, useRef } from 'react';
import { AlertOctagon, Phone } from 'lucide-react';

interface EmergencyHUDProps {
  countdown: number | null;
  onCancel: () => void;
  isConfirmed: boolean;
  isSent: boolean;
}

export const EmergencyHUD: React.FC<EmergencyHUDProps> = ({ countdown, onCancel, isSent }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  void audioRef; // retained for future audio feature

  useEffect(() => {
    // Play a generic beep sound (using a data URI or external URL for demo)
    // In a real app, this would be bundled. For now, we simulate with a Web Audio API oscillator.
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    let isPlaying = true;
    const playBeep = () => {
      if (!isPlaying || isSent) return;
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // 800Hz
      oscillator.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.3); // Drop to 400Hz
      
      gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
      
      setTimeout(playBeep, 500);
    };
    
    if (!isSent) {
      playBeep();
    }

    return () => {
      isPlaying = false;
      audioCtx.close();
    };
  }, [isSent]);

  if (isSent) {
    return (
      <div style={{
        position: 'absolute', inset: 0, zIndex: 100,
        background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center'
      }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <Phone size={40} color="white" />
        </div>
        <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>SOS Sent</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>
          Emergency contacts have been notified with your GPS location. Help is on the way.
        </p>
        <button className="btn" style={{ background: 'var(--bg-secondary)', color: 'white', marginTop: '40px', width: '100%' }} onClick={onCancel}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="emergency-active" style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(255, 69, 58, 0.95)', backdropFilter: 'blur(10px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px'
    }}>
      <AlertOctagon size={64} color="white" style={{ marginBottom: '24px' }} />
      
      <h1 style={{ fontSize: '32px', fontWeight: 800, textAlign: 'center', letterSpacing: '-0.02em', marginBottom: '8px' }}>
        CRASH DETECTED
      </h1>
      
      <p style={{ fontSize: '18px', textAlign: 'center', opacity: 0.9, marginBottom: '48px' }}>
        Alerting emergency contacts in
      </p>
      
      {/* Countdown Circle */}
      <div style={{ position: 'relative', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'auto' }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
          <circle cx="100" cy="100" r="90" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
          <circle cx="100" cy="100" r="90" stroke="white" strokeWidth="8" fill="none" 
            strokeDasharray={2 * Math.PI * 90}
            strokeDashoffset={2 * Math.PI * 90 * (1 - (countdown || 0) / 30)}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div style={{ fontSize: '72px', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
          {countdown}
        </div>
      </div>
      
      {/* Slide to Cancel Simulation (just a button for now) */}
      <button 
        onClick={onCancel}
        style={{
          width: '100%',
          padding: '24px',
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.4)',
          borderRadius: 'var(--radius-full)',
          color: 'white',
          fontSize: '20px',
          fontWeight: 700,
          cursor: 'pointer',
          backdropFilter: 'blur(20px)',
          marginTop: '40px'
        }}
      >
        TAP TO CANCEL (I'm OK)
      </button>
    </div>
  );
};
