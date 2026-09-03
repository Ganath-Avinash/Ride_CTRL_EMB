import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Activity, Gauge, Navigation, Bluetooth, BluetoothOff, BluetoothSearching, Play, Square, MapPin, Shield } from 'lucide-react';
import { useHardwareSimulator } from '../simulator/useHardwareSimulator';
import { EmergencyHUD } from '../components/EmergencyHUD';
import { useApp } from '../context/AppContext';
import { bleService } from '../services/bleService';
import type { RideLog } from '../types';

// Fix Leaflet default marker icon in Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export const DashboardScreen: React.FC = () => {
  const { user, bleStatus, setBleStatus, addRideLog } = useApp();
  const {
    telemetry, systemState, countdown,
    triggerCrash, triggerPothole, triggerBraking, cancelAlert,
  } = useHardwareSimulator();

  const [rideActive, setRideActive] = useState(false);
  const [rideStart, setRideStart] = useState<number | null>(null);
  const [rideMaxG, setRideMaxG] = useState(0);
  const [rideEvents, setRideEvents] = useState<string[]>([]);
  const [simOpen, setSimOpen] = useState(false);
  const [location] = useState({ lat: 13.0827, lng: 80.2707 });
  const rideMaxGRef = useRef(rideMaxG);
  const rideEventsRef = useRef(rideEvents);
  rideMaxGRef.current = rideMaxG;
  rideEventsRef.current = rideEvents;

  const isEmergency = systemState === 'CRASH_PENDING' || systemState === 'CRASH_CONFIRMED' || systemState === 'SOS_SENT';

  // Track max G and events during active ride
  useEffect(() => {
    if (!rideActive) return;
    if (telemetry.gForce > rideMaxGRef.current) setRideMaxG(telemetry.gForce);
  }, [telemetry.gForce, rideActive]);

  useEffect(() => {
    if (!rideActive) return;
    if (systemState === 'POTHOLE' && !rideEventsRef.current.includes('Pothole'))
      setRideEvents(e => [...e, 'Pothole Detected']);
    if (systemState === 'HARD_BRAKING' && !rideEventsRef.current.includes('Hard Braking'))
      setRideEvents(e => [...e, 'Hard Braking']);
    if (systemState === 'SOS_SENT')
      setRideEvents(e => [...e, 'SOS Sent']);
  }, [systemState, rideActive]);

  const handleBleConnect = async () => {
    if (bleStatus === 'connected') { bleService.disconnect(); setBleStatus('disconnected'); return; }
    setBleStatus('connecting');
    const res = await bleService.connect();
    setBleStatus(res === 'connected' ? 'connected' : res === 'unsupported' ? 'unsupported' : 'disconnected');
  };

  const startRide = () => {
    setRideActive(true);
    setRideStart(Date.now());
    setRideMaxG(1.0);
    setRideEvents([]);
  };

  const stopRide = () => {
    if (!rideStart) return;
    const log: RideLog = {
      id: crypto.randomUUID(),
      startTime: rideStart,
      endTime: Date.now(),
      maxGForce: parseFloat(rideMaxGRef.current.toFixed(2)),
      distanceKm: parseFloat((((Date.now() - rideStart) / 1000 / 3600) * (telemetry.speed || 30)).toFixed(1)),
      events: rideEventsRef.current,
    };
    addRideLog(log);
    setRideActive(false);
    setRideStart(null);
  };

  const safetyScore = Math.max(0, Math.min(100,
    100 - (telemetry.gForce - 1) * 20 - Math.abs(telemetry.roll) * 0.5
  ));

  const BleIcon = bleStatus === 'connected' ? Bluetooth
    : bleStatus === 'connecting' ? BluetoothSearching
    : BluetoothOff;

  const stateColor = systemState === 'NORMAL' ? 'var(--accent-green)'
    : systemState === 'POTHOLE' ? 'var(--accent-orange)'
    : systemState === 'HARD_BRAKING' ? 'var(--accent-yellow)'
    : 'var(--accent-red)';

  const stateLabel = systemState === 'NORMAL' ? 'SYSTEM ARMED'
    : systemState === 'POTHOLE' ? 'POTHOLE DETECTED'
    : systemState === 'HARD_BRAKING' ? 'HARD BRAKING'
    : systemState === 'CRASH_PENDING' ? 'CRASH DETECTED — SOS PENDING'
    : systemState === 'CRASH_CONFIRMED' ? 'CRASH CONFIRMED — ALERTING'
    : 'SOS SENT';

  if (isEmergency) {
    return (
      <EmergencyHUD
        countdown={countdown}
        onCancel={cancelAlert}
        isConfirmed={systemState === 'CRASH_CONFIRMED'}
        isSent={systemState === 'SOS_SENT'}
      />
    );
  }

  return (
    <div className="screen">


      {/* Header */}
      <header className="screen-header">
        <div>
          <h2 className="brand-title">RIDE CTRL</h2>
          <p className="text-secondary" style={{ fontSize: '13px' }}>
            Welcome back, {user?.name?.split(' ')[0] ?? 'Rider'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Ride button */}
          {rideActive ? (
            <button id="btn-stop-ride" className="btn btn-danger" style={{ padding: '8px 14px', fontSize: '13px' }} onClick={stopRide}>
              <Square size={14} style={{ marginRight: 6 }} /> Stop
            </button>
          ) : (
            <button id="btn-start-ride" className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '13px' }} onClick={startRide}>
              <Play size={14} style={{ marginRight: 6 }} /> Ride
            </button>
          )}
          {/* BLE button */}
          <button
            id="btn-ble-connect"
            className={`ble-btn ble-btn--${bleStatus}`}
            onClick={handleBleConnect}
            title={bleStatus === 'unsupported' ? 'BLE not supported in this browser' : 'Toggle BLE connection'}
          >
            <BleIcon size={18} />
          </button>
        </div>
      </header>

      {/* System State Banner */}
      <div className="state-banner" style={{ borderColor: stateColor, color: stateColor }}>
        <Shield size={14} />
        <span>{stateLabel}</span>
        <div className={`state-dot${systemState !== 'NORMAL' ? ' state-dot--pulse' : ''}`}
          style={{ background: stateColor }} />
      </div>

      {/* Telemetry Grid */}
      <div className="telemetry-grid">
        <div className="telem-card">
          <Gauge size={20} className="telem-icon" />
          <div className="telem-value">{telemetry.gForce.toFixed(2)}</div>
          <div className="telem-label">G-FORCE</div>
        </div>
        <div className="telem-card">
          <Navigation size={20} className="telem-icon" />
          <div className="telem-value">{telemetry.speed.toFixed(0)}</div>
          <div className="telem-label">KM/H</div>
        </div>
        <div className="telem-card">
          <Activity size={20} className="telem-icon" />
          <div className="telem-value">{Math.abs(telemetry.pitch).toFixed(0)}°</div>
          <div className="telem-label">PITCH</div>
        </div>
        <div className="telem-card">
          <Activity size={20} className="telem-icon" />
          <div className="telem-value">{Math.abs(telemetry.roll).toFixed(0)}°</div>
          <div className="telem-label">ROLL</div>
        </div>
      </div>

      {/* Safety Score */}
      <div className="card" style={{ margin: '0 16px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '1px' }}>SAFETY SCORE</span>
          <span style={{ fontSize: '24px', fontWeight: 700, color: safetyScore > 70 ? 'var(--accent-green)' : safetyScore > 40 ? 'var(--accent-orange)' : 'var(--accent-red)' }}>
            {safetyScore.toFixed(0)}
          </span>
        </div>
        <div className="score-bar-bg">
          <div className="score-bar-fill" style={{
            width: `${safetyScore}%`,
            background: safetyScore > 70 ? 'var(--accent-green)' : safetyScore > 40 ? 'var(--accent-orange)' : 'var(--accent-red)',
          }} />
        </div>
      </div>

      {/* Live Map */}
      <div className="card map-widget" style={{ margin: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px 8px' }}>
          <MapPin size={16} color="var(--accent-blue)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '1px' }}>LIVE LOCATION</span>
        </div>
        <div style={{ height: 180, borderRadius: '0 0 16px 16px', overflow: 'hidden' }}>
          <MapContainer center={[location.lat, location.lng]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <Marker position={[location.lat, location.lng]}>
              <Popup>Your Location</Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>

      {/* Hardware Simulator (collapsible) */}
      <div className="card" style={{ margin: '16px 16px 16px' }}>
        <button
          id="btn-toggle-simulator"
          className="sim-toggle"
          onClick={() => setSimOpen(o => !o)}
        >
          <span>HARDWARE SIMULATOR</span>
          <span style={{ fontSize: '12px', opacity: 0.6 }}>{simOpen ? '▲' : '▼'}</span>
        </button>
        {simOpen && (
          <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button id="btn-sim-pothole" className="btn" style={{ background: 'var(--accent-orange)', color: 'white', fontSize: 13 }} onClick={triggerPothole}>Pothole</button>
            <button id="btn-sim-braking" className="btn btn-secondary" style={{ fontSize: 13 }} onClick={triggerBraking}>Hard Braking</button>
            <button id="btn-sim-crash" className="btn btn-danger" style={{ gridColumn: '1 / -1', fontSize: 13 }} onClick={() => { triggerCrash(); if (rideActive) setRideEvents(e => [...e, 'Crash Triggered']); }}>
              Simulate Crash (Trigger SOS)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
