import React, { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../services/firebaseConfig';
import { useApp } from '../context/AppContext';
import { Shield, Mail, Lock, User, AlertTriangle, MonitorSmartphone } from 'lucide-react';

type AuthMode = 'signin' | 'signup';

export const AuthScreen: React.FC = () => {
  const { setUser } = useApp();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured || !auth) {
      setError('Firebase is not configured. Please update src/services/firebaseConfig.ts with your project credentials.');
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
      setError(e instanceof Error ? e.message : 'Sign-in failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured || !auth) {
      setError('Firebase is not configured. Please update src/services/firebaseConfig.ts with your project credentials.');
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
      setError(e instanceof Error ? e.message.replace('Firebase: ', '') : 'Auth failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      {/* Animated background */}
      <div className="auth-bg">
        <div className="auth-grid" />
        <div className="auth-glow" />
      </div>

      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-ring">
            <Shield size={36} color="#ff453a" />
          </div>
          <h1 className="auth-title">RIDE CTRL</h1>
          <p className="auth-subtitle">Two-Wheeler Safety System</p>
        </div>

        {/* Firebase not configured warning */}
        {!isFirebaseConfigured && (
          <div className="auth-warning">
            <AlertTriangle size={16} />
            <span>Firebase not configured — update <code>firebaseConfig.ts</code> with your credentials.</span>
          </div>
        )}

        {/* Google Sign-In */}
        <button
          id="btn-google-signin"
          className="btn-google"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <MonitorSmartphone size={20} />
          <span>Continue with Google</span>
        </button>

        <div className="auth-divider"><span>or</span></div>

        {/* Email/Password form */}
        <form onSubmit={handleEmailAuth} className="auth-form">
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
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          <button id="btn-auth-submit" className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="auth-toggle">
          {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
          <button
            id="btn-toggle-auth-mode"
            className="auth-toggle-btn"
            onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(''); }}
          >
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};
