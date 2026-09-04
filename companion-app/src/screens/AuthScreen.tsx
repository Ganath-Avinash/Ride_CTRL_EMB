import React, { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../services/firebaseConfig';
import { useApp } from '../context/AppContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { Mail, Lock, User, AlertTriangle } from 'lucide-react';
import Stepper, { Step } from '../components/Stepper';

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

  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured || !auth) {
      setError('Firebase is not configured. Update src/services/firebaseConfig.ts.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      setUser({
        uid: fbUser.uid,
        name: fbUser.displayName ?? 'Rider',
        email: fbUser.email ?? '',
        photoURL: fbUser.photoURL ?? undefined,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message.replace('Firebase: ', '') : 'Sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured || !auth) {
      setError('Firebase is not configured.');
      return;
    }
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
          photoURL: cred.user.photoURL ?? undefined,
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
      <div className="auth-top-bar">
        <div className="auth-logo-icon">
          <img src="/imgs/helmey.png" alt="SentryX Helmet" />
        </div>
        <ThemeToggle compact />
      </div>

      <div className="auth-content">
        {/* Logo / Branding */}
        <div className="auth-logo">
          <h1 className="auth-title">SentryX</h1>
          <p className="auth-subtitle">Two-Wheeler Safety System</p>
          <p className="auth-tagline">Detect. Alert. Respond.</p>
        </div>

        {/* Firebase not configured warning */}
        {!isFirebaseConfigured && (
          <div className="auth-warning" style={{ marginBottom: 16 }}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>Firebase not configured — update <code>firebaseConfig.ts</code>.</span>
          </div>
        )}

        <div className="auth-form-section">
          {/* Google Sign-In */}
          <button
            id="btn-google-signin"
            className="btn-google"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <GoogleG />
            <span>Continue with Google</span>
          </button>

          <div className="auth-divider"><span>or</span></div>

          {/* Email/Password form */}
          <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode === 'signup' && (
              <div className="form-field">
                <User size={16} className="form-field-icon" />
                <input
                  id="auth-name"
                  className="form-input"
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-field">
              <Mail size={16} className="form-field-icon" />
              <input
                id="auth-email"
                className="form-input"
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <Lock size={16} className="form-field-icon" />
              <input
                id="auth-password"
                className="form-input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
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
              style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-md)', fontSize: '15px', marginTop: 4 }}
            >
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="auth-toggle">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              id="btn-toggle-auth-mode"
              className="auth-toggle-btn"
              onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(''); }}
            >
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>

          <button
            type="button"
            className="btn-tour-pill"
            onClick={() => setShowTour(true)}
          >
            What SentryX Does
          </button>
        </div>
      </div>

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
