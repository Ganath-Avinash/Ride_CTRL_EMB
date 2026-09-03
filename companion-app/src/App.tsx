import React from 'react';
import { useHardwareSimulator } from './simulator/useHardwareSimulator';
import { Dashboard } from './components/Dashboard';
import { EmergencyHUD } from './components/EmergencyHUD';

function App() {
  const { 
    telemetry, 
    systemState, 
    countdown, 
    triggerCrash, 
    triggerPothole, 
    triggerBraking,
    cancelAlert 
  } = useHardwareSimulator();

  const isEmergency = systemState === 'CRASH_PENDING' || systemState === 'CRASH_CONFIRMED' || systemState === 'SOS_SENT';

  return (
    <div className="app-container">
      {/* Dynamic Background based on state */}
      <div style={{ 
        position: 'absolute', inset: 0, zIndex: -1,
        background: systemState === 'NORMAL' ? 'radial-gradient(circle at top right, #1a1a1c, #000000)' :
                    systemState === 'POTHOLE' ? 'radial-gradient(circle at top right, #3d2300, #000000)' :
                    'radial-gradient(circle at top right, #001f3d, #000000)',
        transition: 'background 1s ease'
      }} />

      {/* Main Dashboard */}
      <Dashboard telemetry={telemetry} systemState={systemState} />

      {/* Hardware Simulator Controls (For testing only) */}
      <div className="glass-panel" style={{ margin: '24px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '1px' }}>HARDWARE SIMULATOR</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button className="btn" style={{ background: 'var(--bg-tertiary)', color: 'white' }} onClick={triggerPothole}>
            Simulate Pothole
          </button>
          <button className="btn" style={{ background: 'var(--bg-tertiary)', color: 'white' }} onClick={triggerBraking}>
            Simulate Braking
          </button>
          <button className="btn btn-danger" style={{ gridColumn: '1 / -1' }} onClick={triggerCrash}>
            Simulate Crash (Trigger SOS)
          </button>
        </div>
      </div>

      {/* Emergency Overlays */}
      {isEmergency && (
        <EmergencyHUD 
          countdown={countdown} 
          onCancel={cancelAlert} 
          isConfirmed={systemState === 'CRASH_CONFIRMED'}
          isSent={systemState === 'SOS_SENT'}
        />
      )}
    </div>
  );
}

export default App;
