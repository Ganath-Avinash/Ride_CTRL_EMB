import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AppRoute, AppUser, Vehicle, Contact, RideLog, AppSettings, BleStatus } from '../types';

interface AppContextType {
  // Navigation
  route: AppRoute;
  navigate: (r: AppRoute) => void;

  // Auth
  user: AppUser | null;
  setUser: (u: AppUser | null) => void;

  // Vehicle
  vehicle: Vehicle;
  setVehicle: (v: Vehicle) => void;

  // Contacts
  contacts: Contact[];
  addContact: (c: Omit<Contact, 'id'>) => void;
  updateContact: (c: Contact) => void;
  removeContact: (id: string) => void;

  // Ride logs
  rideLogs: RideLog[];
  addRideLog: (log: RideLog) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;

  // BLE
  bleStatus: BleStatus;
  setBleStatus: (s: BleStatus) => void;
}

const defaultVehicle: Vehicle = {
  customName: '',
  make: '',
  model: '',
  year: '',
  regNumber: '',
  engineCC: '',
  color: '',
  licenseFileName: '',
};

const defaultSettings: AppSettings = {
  sosDuration: 30,
  soundAlerts: true,
  amoledMode: false,
};

const AppCtx = createContext<AppContextType | null>(null);

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota exceeded — ignore */ }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<AppRoute>('auth');
  const [user, setUserState] = useState<AppUser | null>(() => load('rc_user', null));
  const [vehicle, setVehicleState] = useState<Vehicle>(() => load('rc_vehicle', defaultVehicle));
  const [contacts, setContacts] = useState<Contact[]>(() => load('rc_contacts', []));
  const [rideLogs, setRideLogs] = useState<RideLog[]>(() => load('rc_rides', []));
  const [settings, setSettings] = useState<AppSettings>(() => load('rc_settings', defaultSettings));
  const [bleStatus, setBleStatus] = useState<BleStatus>(
    typeof navigator !== 'undefined' && 'bluetooth' in navigator ? 'disconnected' : 'unsupported'
  );

  // Auto-navigate based on auth state
  useEffect(() => {
    if (user) setRoute('dashboard');
    else setRoute('auth');
  }, [user]);

  const setUser = useCallback((u: AppUser | null) => {
    setUserState(u);
    save('rc_user', u);
  }, []);

  const setVehicle = useCallback((v: Vehicle) => {
    setVehicleState(v);
    save('rc_vehicle', v);
  }, []);

  const addContact = useCallback((c: Omit<Contact, 'id'>) => {
    setContacts(prev => {
      const updated = [...prev, { ...c, id: crypto.randomUUID() }];
      save('rc_contacts', updated);
      return updated;
    });
  }, []);

  const updateContact = useCallback((c: Contact) => {
    setContacts(prev => {
      const updated = prev.map(x => x.id === c.id ? c : x);
      save('rc_contacts', updated);
      return updated;
    });
  }, []);

  const removeContact = useCallback((id: string) => {
    setContacts(prev => {
      const updated = prev.filter(x => x.id !== id);
      save('rc_contacts', updated);
      return updated;
    });
  }, []);

  const addRideLog = useCallback((log: RideLog) => {
    setRideLogs(prev => {
      const updated = [log, ...prev].slice(0, 50); // keep last 50 rides
      save('rc_rides', updated);
      return updated;
    });
  }, []);

  const updateSettings = useCallback((s: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...s };
      save('rc_settings', updated);
      return updated;
    });
  }, []);

  return (
    <AppCtx.Provider value={{
      route, navigate: setRoute,
      user, setUser,
      vehicle, setVehicle,
      contacts, addContact, updateContact, removeContact,
      rideLogs, addRideLog,
      settings, updateSettings,
      bleStatus, setBleStatus,
    }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
