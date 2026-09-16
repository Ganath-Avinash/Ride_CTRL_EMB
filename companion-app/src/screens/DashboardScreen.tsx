import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  Activity, Gauge, Navigation, Bluetooth, BluetoothOff, BluetoothSearching,
  Play, Square, MapPin, Shield, Wrench, FileText, Moon,
} from 'lucide-react';
import { useHardwareSimulator } from '../simulator/useHardwareSimulator';
import { EmergencyHUD } from '../components/EmergencyHUD';
import { useApp } from '../context/AppContext';
import { bleService } from '../services/bleService';
import SplitText from '../components/SplitText';
import GradientWaves from '../components/GradientWaves';
import MorphSlider from '../components/MorphSlider';
import type { RideLog } from '../types';

const safetyStats = [
  {
    image: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=1600&auto=format&fit=crop&q=80',
    caption: '🌍  1.35 million road deaths per year — WHO 2023',
  },
  {
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&auto=format&fit=crop&q=80',
    caption: '🇮🇳  India reports 4.5 lakh accidents annually',
  },
  {
    image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1600&auto=format&fit=crop&q=80',
    caption: '⛑️  Helmets reduce fatality risk by 42% — NHTSA',
  },
  {
    image: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?w=1600&auto=format&fit=crop&q=80',
    caption: '⚡  <10 min response time increases survival by 40%',
  },
];

// Fix Leaflet default marker icon in Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Helpers ─────────────────────────────────────────────────
function formatTimer(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

// ── RSSI Signal Bars ─────────────────────────────────────────
function RssiBars({ rssi }: { rssi: number | null }) {
  if (rssi === null) return null;
  // 3 bars: strong ≥-65, medium ≥-75, weak <-75
  const strength = rssi >= -65 ? 3 : rssi >= -75 ? 2 : 1;
  const weakSignal = strength === 1;
  return (
    <div className="rssi-bars" title={`Signal: ${rssi} dBm`}>
      {[1, 2, 3].map(b => (
        <div
          key={b}
          className="rssi-bar"
          style={{
            height: `${4 + b * 4}px`,
            background: b <= strength
              ? (weakSignal ? 'var(--accent-red)' : 'var(--text-primary)')
              : 'var(--bg-tertiary)',
          }}
        />
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export const DashboardScreen: React.FC = () => {
  const { user, bleStatus, setBleStatus, addRideLog, rideLogs, vehicle } = useApp();
  const {
    telemetry, systemState, countdown,
    triggerCrash, triggerPothole, triggerBraking, cancelAlert,
  } = useHardwareSimulator();

  // ── Ride state ──────────────────────────────────────────────
  const [rideActive, setRideActive]   = useState(false);
  const [rideStart,  setRideStart]    = useState<number | null>(null);
  const [rideMaxG,   setRideMaxG]     = useState(0);
  const [rideEvents, setRideEvents]   = useState<string[]>([]);
  const [rideElapsed, setRideElapsed] = useState(0);   // seconds
  const rideMaxGRef   = useRef(rideMaxG);
  const rideEventsRef = useRef(rideEvents);
  rideMaxGRef.current   = rideMaxG;
  rideEventsRef.current = rideEvents;

  // ── UI state ────────────────────────────────────────────────
  const [simOpen,  setSimOpen]  = useState(false);
  const [bleRssi,  setBleRssi]  = useState<number | null>(null);
  const [location] = useState({ lat: 13.0827, lng: 80.2707 });

  // WakeLock ref (DND auto-mode)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wakeLockRef = useRef<any>(null);

  const isEmergency = systemState === 'CRASH_PENDING'
    || systemState === 'CRASH_CONFIRMED'
    || systemState === 'SOS_SENT';

  // ── Ride timer ──────────────────────────────────────────────
  useEffect(() => {
    if (!rideActive) { setRideElapsed(0); return; }
    const t = setInterval(() => setRideElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [rideActive]);

  // ── Track max-G + events during active ride ─────────────────
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

  // ── BLE RSSI polling ────────────────────────────────────────
  useEffect(() => {
    if (bleStatus !== 'connected') {
      bleService.stopRssiPolling();
      setBleRssi(null);
      return;
    }
    bleService.startRssiPolling(setBleRssi);
    return () => {
      bleService.stopRssiPolling();
      setBleRssi(null);
    };
  }, [bleStatus]);

  // ── BLE connect handler ─────────────────────────────────────
  const handleBleConnect = async () => {
    if (bleStatus === 'connected') {
      bleService.disconnect();
      setBleStatus('disconnected');
      return;
    }
    setBleStatus('connecting');
    const res = await bleService.connect();
    setBleStatus(res === 'connected' ? 'connected' : res === 'unsupported' ? 'unsupported' : 'disconnected');
  };

  // ── Start ride (acquire WakeLock = DND mode) ────────────────
  const startRide = useCallback(async () => {
    setRideActive(true);
    setRideStart(Date.now());
    setRideMaxG(1.0);
    setRideElapsed(0);
    setRideEvents([]);
    // Acquire screen wake lock to suppress auto-dim while riding
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav = navigator as any;
      if (nav.wakeLock) {
        wakeLockRef.current = await nav.wakeLock.request('screen');
      }
    } catch { /* WakeLock unsupported or denied — silently continue */ }
  }, []);

  // ── Stop ride (release WakeLock) ────────────────────────────
  const stopRide = useCallback(() => {
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
    // Release WakeLock
    try { wakeLockRef.current?.release(); } catch { /* ignore */ }
    wakeLockRef.current = null;
    setRideActive(false);
    setRideStart(null);
  }, [rideStart, telemetry.speed, addRideLog]);

  // ── Safety score ────────────────────────────────────────────
  const safetyScore = Math.max(0, Math.min(100,
    100 - (telemetry.gForce - 1) * 20 - Math.abs(telemetry.roll) * 0.5
  ));

  // ── Reminder computations ───────────────────────────────────
  const totalKm = rideLogs.reduce((s, r) => s + r.distanceKm, 0);
  const kmSinceService = totalKm - (vehicle.lastServiceKm || 0);
  const kmToService = vehicle.serviceIntervalKm > 0
    ? vehicle.serviceIntervalKm - kmSinceService
    : null;
  const showServiceWarn = kmToService !== null && kmToService <= 200;

  const insuranceDays = daysUntil(vehicle.insuranceExpiry);
  const pucDays       = daysUntil(vehicle.pucExpiry);
  const showInsuranceWarn = insuranceDays !== null && insuranceDays <= 30;
  const showPucWarn       = pucDays       !== null && pucDays       <= 30;
  const hasReminders = showServiceWarn || showInsuranceWarn || showPucWarn;

  // ── Derived UI ──────────────────────────────────────────────
  const BleIcon = bleStatus === 'connected' ? Bluetooth
    : bleStatus === 'connecting' ? BluetoothSearching
    : BluetoothOff;

  const stateColor = systemState === 'NORMAL' ? 'var(--accent-green)'
    : systemState === 'POTHOLE'       ? 'var(--accent-orange)'
    : systemState === 'HARD_BRAKING'  ? 'var(--accent-yellow)'
    : 'var(--accent-red)';

  const stateLabel = systemState === 'NORMAL'         ? 'SYSTEM ANALYTICS & STATUS'
    : systemState === 'POTHOLE'        ? 'POTHOLE DETECTED'
    : systemState === 'HARD_BRAKING'   ? 'HARD BRAKING'
    : systemState === 'CRASH_PENDING'  ? 'CRASH DETECTED — SOS PENDING'
    : systemState === 'CRASH_CONFIRMED'? 'CRASH CONFIRMED — ALERTING'
    : 'SOS SENT';

  // ── Emergency overlay ───────────────────────────────────────
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
    <div className="screen" style={{ position: 'relative', minHeight: '100%' }}>

      {/* ── Background waves effect ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.32, overflow: 'hidden' }}>
        <GradientWaves
          horizonColor="#050508"
          waveColor="#dc2626"
          crestColor="#7c3aed"
          speed={0.2}
          amplitude={1.8}
          waveScale={0.5}
          brightness={0.8}
          opacity={0.6}
          mouseInteraction={false}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* ── Header ── */}
        <header className="screen-header">
          {/* Left: brand + greeting */}
          <div className="screen-header-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-red)', boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)', flexShrink: 0 }} />
              <SplitText
                text="SentryX"
                className="brand-title"
                delay={40}
                duration={0.5}
                ease="power3.out"
                splitType="chars"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <p className="screen-subtitle">
                {rideActive ? 'Ride in progress' : `Hey, ${user?.name?.split(' ')[0] ?? 'Rider'}`}
              </p>
              {rideActive && (
                <span className="dnd-status-dot">
                  <Moon size={9} style={{ color: 'var(--accent-purple)', flexShrink: 0 }} />
                </span>
              )}
            </div>
          </div>

        {/* Right: timer + actions */}
        <div className="screen-header-right">
          {/* Ride timer chip */}
          {rideActive && (
            <span className="ride-timer-chip">{formatTimer(rideElapsed)}</span>
          )}

          {/* Ride start / stop */}
          {rideActive ? (
            <button
              id="btn-stop-ride"
              className="btn btn-danger"
              style={{ padding: '8px 14px', fontSize: '13px' }}
              onClick={stopRide}
            >
              <Square size={14} style={{ marginRight: 6 }} /> Stop
            </button>
          ) : (
            <button
              id="btn-start-ride"
              className="btn btn-primary"
              style={{ padding: '8px 14px', fontSize: '13px' }}
              onClick={startRide}
            >
              <Play size={14} style={{ marginRight: 6 }} /> Ride
            </button>
          )}

          {/* BLE button + RSSI bars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {bleStatus === 'connected' && <RssiBars rssi={bleRssi} />}
            <button
              id="btn-ble-connect"
              className={`ble-btn ble-btn--${bleStatus}`}
              onClick={handleBleConnect}
              title={bleStatus === 'unsupported' ? 'BLE not supported in this browser' : 'Toggle BLE connection'}
            >
              <BleIcon size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── System State Banner ── */}
      <div className="state-banner" style={{ borderColor: stateColor, color: stateColor }}>
        <Shield size={14} />
        <span>{stateLabel}</span>
        <div
          className={`state-dot${systemState !== 'NORMAL' ? ' state-dot--pulse' : ''}`}
          style={{ background: stateColor }}
        />
      </div>

      {/* ── Reminder Banner (health + doc expiry) ── */}
      {hasReminders && (
        <div className="reminder-banner">
          {showServiceWarn && (
            <div className="reminder-item">
              <div
                className="reminder-dot"
                style={{ background: kmToService !== null && kmToService < 0 ? 'var(--accent-red)' : 'var(--accent-orange)' }}
              />
              <Wrench size={12} style={{ flexShrink: 0, color: 'var(--text-tertiary)' }} />
              <span>
                {kmToService !== null && kmToService < 0
                  ? `Service overdue by ${Math.round(Math.abs(kmToService))} km — visit a workshop`
                  : `Service due in ~${Math.round(kmToService!)} km`}
              </span>
            </div>
          )}
          {showInsuranceWarn && (
            <div className="reminder-item">
              <div
                className="reminder-dot"
                style={{ background: insuranceDays! < 0 ? 'var(--accent-red)' : 'var(--accent-orange)' }}
              />
              <FileText size={12} style={{ flexShrink: 0, color: 'var(--text-tertiary)' }} />
              <span>
                {insuranceDays! < 0
                  ? 'Insurance expired — renew immediately'
                  : `Insurance expires in ${insuranceDays} day${insuranceDays === 1 ? '' : 's'}`}
              </span>
            </div>
          )}
          {showPucWarn && (
            <div className="reminder-item">
              <div
                className="reminder-dot"
                style={{ background: pucDays! < 0 ? 'var(--accent-red)' : 'var(--accent-orange)' }}
              />
              <FileText size={12} style={{ flexShrink: 0, color: 'var(--text-tertiary)' }} />
              <span>
                {pucDays! < 0
                  ? 'PUC expired — renew immediately'
                  : `PUC expires in ${pucDays} day${pucDays === 1 ? '' : 's'}`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Telemetry Grid ── */}
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

      {/* ── Safety Score ── */}
      <div className="card" style={{ margin: '0 16px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '1px' }}>SAFETY SCORE</span>
          <span style={{
            fontSize: '24px', fontWeight: 700,
            color: safetyScore > 70 ? 'var(--accent-green)' : safetyScore > 40 ? 'var(--accent-orange)' : 'var(--accent-red)',
          }}>
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

      {/* ── Live Map ── */}
      <div className="card" style={{ margin: '16px 16px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px' }}>
          <MapPin size={16} color="var(--accent-blue)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '1px' }}>LIVE LOCATION</span>
        </div>
        <div style={{ height: 180, overflow: 'hidden' }}>
          <MapContainer
            center={[location.lat, location.lng]}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            attributionControl={false}
          >
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

      {/* ── Road Safety Awareness (MorphSlider) ── */}
      <div className="card" style={{ margin: '16px 16px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <Shield size={14} color="var(--accent-red)" />
            ROAD SAFETY AWARENESS
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', letterSpacing: '0.04em' }}>Live Realities</span>
        </div>
        <div style={{ height: 180, position: 'relative', overflow: 'hidden' }}>
          <MorphSlider
            items={safetyStats}
            transition="melt"
            intensity={0.4}
            aberration={0.2}
            drift={0.25}
            autoplay
            autoplayDelay={4}
            radius={0}
            overlayColor="#000000"
            showCaptions
            showControls={false}
            showIndicators
          />
        </div>
      </div>

      {/* ── Hardware Simulator (collapsible) ── */}
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
            <button
              id="btn-sim-crash"
              className="btn btn-danger"
              style={{ gridColumn: '1 / -1', fontSize: 13 }}
              onClick={() => {
                triggerCrash();
                if (rideActive) setRideEvents(e => [...e, 'Crash Triggered']);
              }}
            >
              Simulate Crash (Trigger SOS)
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
