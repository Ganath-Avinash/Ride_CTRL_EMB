import { lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthScreen } from './screens/AuthScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { BottomNav } from './components/BottomNav';

// Lazy-load heavy screens — they split into their own JS chunks
const ContactsScreen = lazy(() => import('./screens/ContactsScreen').then(m => ({ default: m.ContactsScreen })));
const GarageScreen   = lazy(() => import('./screens/GarageScreen').then(m => ({ default: m.GarageScreen })));
const ProfileScreen  = lazy(() => import('./screens/ProfileScreen').then(m => ({ default: m.ProfileScreen })));

// Minimal spinner shown while lazy screens load for the first time
const ScreenFallback = () => (
  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.4 }}>
    <div style={{
      width: 24, height: 24,
      border: '2px solid var(--border-strong)',
      borderTopColor: 'var(--accent-red)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
  </div>
);

type LazyRoute = 'contacts' | 'garage' | 'profile';
const LAZY_SCREENS: Record<LazyRoute, ReturnType<typeof lazy>> = {
  contacts: ContactsScreen,
  garage:   GarageScreen,
  profile:  ProfileScreen,
};

function AppShell() {
  const { route, user, settings } = useApp();

  if (!user || route === 'auth') {
    return (
      <div className="auth-shell">
        <AuthScreen />
      </div>
    );
  }

  const LazyScreen = LAZY_SCREENS[route as LazyRoute];

  return (
    <div className="app-container" data-amoled={settings.amoledMode ? 'true' : undefined}>
      <div className="screen-wrapper">
        {LazyScreen ? (
          <Suspense fallback={<ScreenFallback />}>
            <LazyScreen />
          </Suspense>
        ) : (
          <DashboardScreen />
        )}
      </div>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
