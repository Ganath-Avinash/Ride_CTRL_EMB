import { AppProvider, useApp } from './context/AppContext';
import { AuthScreen } from './screens/AuthScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { ContactsScreen } from './screens/ContactsScreen';
import { GarageScreen } from './screens/GarageScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { BottomNav } from './components/BottomNav';

const SCREENS = {
  dashboard: DashboardScreen,
  contacts:  ContactsScreen,
  garage:    GarageScreen,
  profile:   ProfileScreen,
};

function AppShell() {
  const { route, user, settings } = useApp();

  if (!user || route === 'auth') {
    return <AuthScreen />;
  }

  const Screen = SCREENS[route as keyof typeof SCREENS] ?? DashboardScreen;

  return (
    <div className="app-container" data-amoled={settings.amoledMode ? 'true' : undefined}>
      <div className="screen-wrapper">
        <Screen />
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
