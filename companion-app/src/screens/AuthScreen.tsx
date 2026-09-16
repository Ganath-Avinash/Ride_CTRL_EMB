import React, { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signInWithCredential, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { auth, googleProvider, isFirebaseConfigured } from '../services/firebaseConfig';
import { useApp } from '../context/AppContext';
import { Mail, Lock, User, AlertTriangle, Shield, Cpu, Activity, ChevronRight } from 'lucide-react';
import Stepper, { Step } from '../components/Stepper';
import MagicRings from '../components/MagicRings';
import SplitText from '../components/SplitText';

type AuthMode = 'signin' | 'signup';

// Minimal Google G SVG
const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

export const AuthScreen: React.FC = () => {
  const { setUser } = useApp();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [showTour, setShowTour] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      try { GoogleAuth.initialize(); } catch (e) { console.warn('GoogleAuth.initialize:', e); }
    }
  }, []);

  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured || !auth) {
      setError('Firebase is not configured. Update src/services/firebaseConfig.ts.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (Capacitor.isNativePlatform()) {
        const googleUser = await GoogleAuth.signIn();
        const idToken = googleUser.authentication?.idToken;
        if (!idToken) throw new Error('Google Sign-In failed: No ID Token returned.');
        const credential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(auth, credential);
        const fbUser = result.user;
        setUser({ 
          uid: fbUser.uid, 
          name: fbUser.displayName ?? googleUser.givenName ?? 'Rider', 
          email: fbUser.email ?? googleUser.email ?? '', 
          photoURL: fbUser.photoURL ?? googleUser.imageUrl ?? undefined 
        });
      } else {
        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;
        setUser({ 
          uid: fbUser.uid, 
          name: fbUser.displayName ?? 'Rider', 
          email: fbUser.email ?? '', 
          photoURL: fbUser.photoURL ?? undefined 
        });
      }
    } catch (e: any) {
      const msg = e?.message || e?.error || (typeof e === 'string' ? e : JSON.stringify(e));
      setError(msg ? msg.replace('Firebase: ', '') : 'Sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured || !auth) { setError('Firebase is not configured.'); return; }
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        setUser({ uid: cred.user.uid, name, email });
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        setUser({ 
          uid: cred.user.uid, 
          name: cred.user.displayName ?? email.split('@')[0], 
          email: cred.user.email ?? email, 
          photoURL: cred.user.photoURL ?? undefined 
        });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message.replace('Firebase: ', '') : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">

      {/* ── Background animation ─────────────────────────── */}
      <div className="auth-bg">
        <MagicRings
          color="#ef4444"
          colorTwo="#8b5cf6"
          ringCount={6}
          speed={0.5}
          lineThickness={1.2}
          baseRadius={0.22}
          radiusStep={0.12}
          opacity={0.45}
          noiseAmount={0.1}
          ringGap={1.4}
          fadeIn={0.8}
          followMouse={false}
        />
      </div>

      {/* ── Main Content ─────────────────────────────────── */}
      <div className="auth-content" style={{ padding: '24px 20px 36px' }}>

        {/* Hero Branding Section */}
        <div className="auth-hero-branding" style={{ textAlign: 'center', margin: '20px 0 28px' }}>
          <div className="auth-logo-icon" style={{ margin: '0 auto 14px', width: 64, height: 64, borderRadius: 18, background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: '0 0 24px rgba(239, 68, 68, 0.25)' }}>
            <img src="/imgs/helmey.png" alt="SentryX" style={{ width: 44, height: 44 }} />
          </div>

          <div style={{ display: 'inline-block' }}>
            <SplitText
              text="SentryX"
              className="auth-title"
              delay={50}
              duration={0.6}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 18 }}
              to={{ opacity: 1, y: 0 }}
              textAlign="center"
            />
          </div>

          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 4 }}>
            IoT Two-Wheeler Safety System
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
            Detect. Alert. Respond.
          </p>

          {/* Value Badges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '3px 10px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              🤖 TinyML Crash AI
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#60a5fa', background: 'rgba(59, 130, 246, 0.1)', padding: '3px 10px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              📡 Auto GSM SOS
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#c084fc', background: 'rgba(168, 85, 247, 0.1)', padding: '3px 10px', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
              ⚡ BLE Telemetry
            </span>
          </div>
        </div>

        {/* Elevated Glass Form Card */}
        <div className="card" style={{ padding: '24px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: '20px', boxShadow: 'var(--shadow-lg)' }}>

          {/* Mode Switcher Tabs */}
          <div className="auth-mode-tabs" style={{ marginBottom: 20 }}>
            <button
              type="button"
              className={`auth-mode-tab${mode === 'signin' ? ' active' : ''}`}
              onClick={() => { setMode('signin'); setError(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-mode-tab${mode === 'signup' ? ' active' : ''}`}
              onClick={() => { setMode('signup'); setError(''); }}
            >
              Create Account
            </button>
          </div>

          {/* Firebase Warning if unconfigured */}
          {!isFirebaseConfigured && (
            <div className="auth-warning" style={{ marginBottom: 16 }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <span>Firebase not configured — update <code>firebaseConfig.ts</code>.</span>
            </div>
          )}

          {/* Google Sign-In */}
          <button
            id="btn-google-signin"
            className="btn-google"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{ marginBottom: 16 }}
          >
            <GoogleG />
            <span>Continue with Google</span>
          </button>

          <div className="auth-divider" style={{ marginBottom: 16 }}><span>or email</span></div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'signup' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Full Name</label>
                <div className="form-field">
                  <User size={16} className="form-field-icon" />
                  <input
                    id="auth-name"
                    className="form-input"
                    type="text"
                    placeholder="e.g. Alex Rider"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Email Address</label>
              <div className="form-field">
                <Mail size={16} className="form-field-icon" />
                <input
                  id="auth-email"
                  className="form-input"
                  type="email"
                  placeholder="rider@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Password</label>
              <div className="form-field">
                <Lock size={16} className="form-field-icon" />
                <input
                  id="auth-password"
                  className="form-input"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="auth-error">
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <button
              id="btn-auth-submit"
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-md)', fontSize: '15px', marginTop: 4, background: 'var(--accent-red)', color: '#ffffff' }}
            >
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In to SentryX' : 'Create Free Account'}
            </button>
          </form>

          {/* Toggle Sign In / Sign Up */}
          <p className="auth-toggle" style={{ marginTop: 16 }}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              id="btn-toggle-auth-mode"
              className="auth-toggle-btn"
              onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(''); }}
              style={{ fontWeight: 700, color: 'var(--accent-red)' }}
            >
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        {/* Feature Highlights Section */}
        <div className="card" style={{ marginTop: 16, padding: '16px 18px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>App Capabilities</span>
            <button
              type="button"
              onClick={() => setShowTour(true)}
              style={{ background: 'none', border: 'none', color: 'var(--accent-red)', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}
            >
              Learn More <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
            <div style={{ padding: '8px 4px', background: 'var(--bg-tertiary)', borderRadius: 10 }}>
              <Cpu size={18} color="var(--accent-red)" style={{ marginBottom: 4 }} />
              <div style={{ fontSize: '11px', fontWeight: 600 }}>TinyML AI</div>
            </div>
            <div style={{ padding: '8px 4px', background: 'var(--bg-tertiary)', borderRadius: 10 }}>
              <Shield size={18} color="var(--accent-blue)" style={{ marginBottom: 4 }} />
              <div style={{ fontSize: '11px', fontWeight: 600 }}>Auto SOS</div>
            </div>
            <div style={{ padding: '8px 4px', background: 'var(--bg-tertiary)', borderRadius: 10 }}>
              <Activity size={18} color="var(--accent-green)" style={{ marginBottom: 4 }} />
              <div style={{ fontSize: '11px', fontWeight: 600 }}>Telemetry</div>
            </div>
          </div>
        </div>

      </div>

      {/* Stepper Tour Modal */}
      {showTour && (
        <div className="stepper-modal-overlay" onClick={() => setShowTour(false)}>
          <div className="stepper-modal-wrapper" onClick={e => e.stopPropagation()}>
            <Stepper
              title="What SentryX Does"
              onClose={() => setShowTour(false)}
              initialStep={1}
              onFinalStepCompleted={() => setShowTour(false)}
              backButtonText="Previous"
              nextButtonText="Next"
            >
              <Step>
                <div className="stepper-card-feature-badge">Step 1 · Crash Detection</div>
                <h2>Intelligent Crash AI</h2>
                <p>6-Axis IMU sensors pair with an on-device TinyML machine learning model on the ESP32 to instantly classify real crashes from potholes or hard braking.</p>
              </Step>
              <Step>
                <div className="stepper-card-feature-badge">Step 2 · Alerts</div>
                <h2>Prompts & Grace Period</h2>
                <p>DFPlayer Mini triggers immediate localized audio alerts with a 10s–60s countdown, giving unharmed riders time to cancel before alerting emergency services.</p>
              </Step>
              <Step>
                <div className="stepper-card-feature-badge">Step 3 · Emergency SOS</div>
                <h2>Automated GSM & GPS SOS</h2>
                <p>If unresponsive, SIM800L sends urgent SOS SMS messages with live GPS map coordinates to pre-configured family and emergency contacts.</p>
              </Step>
              <Step>
                <div className="stepper-card-feature-badge">Step 4 · Telemetry Sync</div>
                <h2>Live Telemetry & Cloud Sync</h2>
                <p>Pairs seamlessly with this companion app over low-latency Bluetooth BLE for live G-Force tracking, trip analytics, and garage vehicle health.</p>
              </Step>
            </Stepper>
          </div>
        </div>
      )}
    </div>
  );
};
