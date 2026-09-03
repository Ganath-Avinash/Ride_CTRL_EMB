import React, { useState } from 'react';
import { LogOut, Clock, AlertTriangle, Volume2, VolumeX, ChevronRight, Shield, GitBranch, Smartphone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ThemeToggle } from '../components/ThemeToggle';
import type { RideLog } from '../types';

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const gColor = (g: number) => g > 3 ? 'var(--accent-red)' : g > 2 ? 'var(--accent-orange)' : 'var(--accent-green)';

export const ProfileScreen: React.FC = () => {
  const { user, setUser, settings, updateSettings, rideLogs, vehicle } = useApp();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleLogout = () => {
    if (!confirmLogout) { setConfirmLogout(true); setTimeout(() => setConfirmLogout(false), 3000); return; }
    setUser(null);
  };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const totalRides = rideLogs.length;
  const totalDistance = rideLogs.reduce((s, r) => s + r.distanceKm, 0).toFixed(1);
  const maxGEver = rideLogs.length ? Math.max(...rideLogs.map(r => r.maxGForce)).toFixed(2) : '—';

  return (
    <div className="screen">
      <header className="screen-header">
        <h2 className="screen-title">Profile</h2>
      </header>

      {/* User Card */}
      <div className="glass-panel profile-card" style={{ margin: '0 16px 20px' }}>
        <div className="profile-avatar">
          {user?.photoURL
            ? <img src={user.photoURL} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '26px', fontWeight: 700 }}>{initials}</span>}
        </div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700 }}>{user?.name}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{user?.email}</p>
          {vehicle.customName && (
            <p style={{ color: 'var(--accent-red)', fontSize: '13px', marginTop: 4, fontWeight: 600 }}>
              🏍 {vehicle.customName}
            </p>
          )}
        </div>
        {/* Stats Row */}
        <div className="profile-stats">
          <div className="profile-stat">
            <span style={{ fontSize: '22px', fontWeight: 700 }}>{totalRides}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>RIDES</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <span style={{ fontSize: '22px', fontWeight: 700 }}>{totalDistance}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>KM</span>
          </div>
          <div className="profile-stat-divider" />
          <div className="profile-stat">
            <span style={{ fontSize: '22px', fontWeight: 700 }}>{maxGEver}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>MAX-G</span>
          </div>
        </div>
      </div>

      {/* Ride History */}
      <div style={{ padding: '0 16px', marginBottom: 20 }}>
        <div className="form-section-label" style={{ marginBottom: 12 }}>Ride History</div>
        {rideLogs.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <Clock size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No rides yet. Start a ride from the Dashboard.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rideLogs.slice(0, 10).map((log: RideLog, i) => (
              <div key={log.id} className="glass-panel ride-log-card" style={{ animationDelay: `${i * 40}ms` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{formatDate(log.startTime)}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: 2 }}>
                      {formatDuration(log.endTime - log.startTime)} · {log.distanceKm} km
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: gColor(log.maxGForce) }}>
                      {log.maxGForce}G
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>peak</div>
                  </div>
                </div>
                {log.events.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {log.events.map((ev, j) => (
                      <span key={j} className="event-badge">
                        <AlertTriangle size={10} style={{ marginRight: 3 }} />{ev}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings */}
      <div style={{ padding: '0 16px', marginBottom: 20 }}>
        <div className="form-section-label" style={{ marginBottom: 12 }}>App Settings</div>

        <div className="settings-card card">
          {/* SOS Duration */}
          <div className="settings-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={18} color="var(--accent-red)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>SOS Countdown</div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Time before SOS is sent</div>
              </div>
            </div>
            <div className="sos-picker">
              {([10, 30, 60] as const).map(s => (
                <button
                  key={s}
                  id={`btn-sos-${s}`}
                  className={`sos-chip${settings.sosDuration === s ? ' sos-chip--active' : ''}`}
                  onClick={() => updateSettings({ sosDuration: s })}
                >
                  {s}s
                </button>
              ))}
            </div>
          </div>

          <div className="settings-divider" />

          {/* Sound Alerts */}
          <div className="settings-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {settings.soundAlerts ? <Volume2 size={18} color="var(--accent-blue)" /> : <VolumeX size={18} color="var(--text-tertiary)" />}
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>Sound Alerts</div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Audio cues for events</div>
              </div>
            </div>
            <button
              id="btn-toggle-sound"
              className={`toggle-switch${settings.soundAlerts ? ' toggle-switch--on' : ''}`}
              onClick={() => updateSettings({ soundAlerts: !settings.soundAlerts })}
            >
              <div className="toggle-knob" />
            </button>
          </div>

          <div className="settings-divider" />


          {/* Theme */}
          <div className="settings-divider" />
          <div className="settings-row">
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Appearance</div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Light · System · Dark</div>
            </div>
            <ThemeToggle compact />
          </div>
        </div>
      </div>

      {/* About */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div className="form-section-label" style={{ marginBottom: 12 }}>About</div>
        <div className="settings-card card">
          <div className="settings-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Smartphone size={18} color="var(--text-secondary)" />
              <span style={{ fontWeight: 600, fontSize: '14px' }}>App Version</span>
            </div>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>1.0.0</span>
          </div>
          <div className="settings-divider" />
          <a href="https://github.com/Ganath-Avinash/Ride_CTRL_EMB" target="_blank" rel="noreferrer" className="settings-row" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <GitBranch size={18} color="var(--text-secondary)" />
              <span style={{ fontWeight: 600, fontSize: '14px' }}>GitHub Repository</span>
            </div>
            <ChevronRight size={16} style={{ opacity: 0.4 }} />
          </a>
        </div>
      </div>

      {/* Logout */}
      <div style={{ padding: '0 16px 100px' }}>
        <button
          id="btn-logout"
          className={`btn ${confirmLogout ? 'btn-danger' : 'btn-logout'}`}
          style={{ width: '100%' }}
          onClick={handleLogout}
        >
          <LogOut size={16} style={{ marginRight: 8 }} />
          {confirmLogout ? 'Tap again to confirm logout' : 'Sign Out'}
        </button>
      </div>
    </div>
  );
};
