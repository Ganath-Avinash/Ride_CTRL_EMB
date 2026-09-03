import React from 'react';
import { Activity, Gauge, MapPin, Navigation } from 'lucide-react';
import type { TelemetryData, SystemState } from '../simulator/useHardwareSimulator';

interface DashboardProps {
  telemetry: TelemetryData;
  systemState: SystemState;
}

export const Dashboard: React.FC<DashboardProps> = ({ telemetry, systemState }) => {
  const isAlert = systemState !== 'NORMAL' && systemState !== 'CRASH_PENDING' && systemState !== 'CRASH_CONFIRMED';
  
  return (
    <div className="dashboard-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>SafeRide</h2>
          <p className="text-secondary" style={{ fontSize: '14px' }}>System Armed • GPS Locked</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)' }}></div>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>CONNECTED</span>
          </div>
        </div>
      </header>

      {/* State Badge */}
      {isAlert && (
        <div style={{ 
          background: systemState === 'POTHOLE' ? 'var(--accent-orange)' : 'var(--accent-blue)', 
          color: 'white', 
          padding: '12px 16px', 
          borderRadius: 'var(--radius-md)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Activity size={20} />
          {systemState === 'POTHOLE' ? 'Pothole Detected' : 'Hard Braking Event'}
        </div>
      )}

      {/* Telemetry Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Gauge size={24} className="text-secondary" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '32px', fontWeight: 700 }}>{telemetry.gForce.toFixed(2)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>G-FORCE</div>
        </div>
        
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Navigation size={24} className="text-secondary" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '32px', fontWeight: 700 }}>{telemetry.speed.toFixed(0)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>SPEED (KM/H)</div>
        </div>
        
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Activity size={24} className="text-secondary" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '32px', fontWeight: 700 }}>{Math.abs(telemetry.pitch).toFixed(0)}°</div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>PITCH</div>
        </div>
        
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Activity size={24} className="text-secondary" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '32px', fontWeight: 700 }}>{Math.abs(telemetry.roll).toFixed(0)}°</div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>ROLL</div>
        </div>
      </div>
      
      {/* Map Widget Mock */}
      <div className="glass-panel" style={{ padding: '16px', marginTop: 'auto', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '50%' }}>
          <MapPin size={24} color="var(--accent-blue)" />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '16px' }}>Current Location</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>13.0827° N, 80.2707° E</div>
        </div>
      </div>

    </div>
  );
};
