import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AppRoute, AppUser, Vehicle, Contact, RideLog, AppSettings, BleStatus } from '../types';
import { api } from '../services/api';

export type SyncStatus = 'idle' | 'syncing' | 'saved' | 'offline';

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
  uploadVehicleDocument: (fileType: 'license' | 'insurance' | 'puc', file: File) => Promise<{ success: boolean; fileId?: string; filename?: string }>;

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

  // Cloud Sync
  syncStatus: SyncStatus;
  refreshFromCloud: () => Promise<void>;
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
  licenseFileId: '',
  insuranceFileName: '',
  insuranceFileId: '',
  pucFileName: '',
  pucFileId: '',
  lastServiceKm: 0,
  serviceIntervalKm: 3000,
  insuranceExpiry: '',
  pucExpiry: '',
};

const defaultSettings: AppSettings = {
  sosDuration: 30,
  soundAlerts: true,
  amoledMode: false,
  theme: 'system',
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
  } catch { /* storage quota exceeded */ }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<AppRoute>('auth');
  const [user, setUserState] = useState<AppUser | null>(() => load('rc_user', null));
  const [vehicle, setVehicleState] = useState<Vehicle>(() => {
    const saved = load<Partial<Vehicle>>('rc_vehicle', {});
    return { ...defaultVehicle, ...saved };
  });
  const [contacts, setContacts] = useState<Contact[]>(() => load('rc_contacts', []));
  const [rideLogs, setRideLogs] = useState<RideLog[]>(() => load('rc_rides', []));
  const [settings, setSettings] = useState<AppSettings>(() => load('rc_settings', defaultSettings));
  const [bleStatus, setBleStatus] = useState<BleStatus>(
    typeof navigator !== 'undefined' && 'bluetooth' in navigator ? 'disconnected' : 'unsupported'
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  // Auto-navigate based on auth state
  useEffect(() => {
    if (user) setRoute('dashboard');
    else setRoute('auth');
  }, [user]);

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', settings.theme);
    }
  }, [settings.theme]);

  // Synchronize state from MongoDB Atlas whenever user logs in
  const syncFromMongoDB = useCallback(async (uid: string) => {
    setSyncStatus('syncing');
    try {
      const res = await api.getUser(uid);
      if (res && res.success && res.user) {
        const cloudUser = res.user;
        if (cloudUser.vehicle) {
          const mergedVehicle = { ...defaultVehicle, ...cloudUser.vehicle };
          setVehicleState(mergedVehicle);
          save('rc_vehicle', mergedVehicle);
        }
        if (Array.isArray(cloudUser.contacts)) {
          setContacts(cloudUser.contacts);
          save('rc_contacts', cloudUser.contacts);
        }
        if (Array.isArray(cloudUser.rides)) {
          setRideLogs(cloudUser.rides);
          save('rc_rides', cloudUser.rides);
        }
        if (cloudUser.settings) {
          const mergedSettings = { ...defaultSettings, ...cloudUser.settings };
          setSettings(mergedSettings);
          save('rc_settings', mergedSettings);
        }
        setSyncStatus('saved');
      } else {
        // First-time user: seed initial profile to MongoDB
        await api.syncUser({
          uid,
          name: user?.name || '',
          email: user?.email || '',
          photoURL: user?.photoURL || '',
          vehicle,
          contacts,
          rides: rideLogs,
          settings
        });
        setSyncStatus('saved');
      }
    } catch {
      setSyncStatus('offline');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [user?.name, user?.email, user?.photoURL, vehicle, contacts, rideLogs, settings]);

  // Trigger sync when user authentication is established
  useEffect(() => {
    if (user?.uid) {
      syncFromMongoDB(user.uid);
    }
  }, [user?.uid]);

  const refreshFromCloud = useCallback(async () => {
    if (user?.uid) {
      await syncFromMongoDB(user.uid);
    }
  }, [user?.uid, syncFromMongoDB]);

  const setUser = useCallback((u: AppUser | null) => {
    setUserState(u);
    save('rc_user', u);
    if (!u) {
      // Clear or reset local state on sign out if desired
      setSyncStatus('idle');
    }
  }, []);

  const setVehicle = useCallback((v: Vehicle) => {
    setVehicleState(v);
    save('rc_vehicle', v);

    if (user?.uid) {
      setSyncStatus('syncing');
      api.updateVehicle(user.uid, v).then(res => {
        setSyncStatus(res?.success ? 'saved' : 'offline');
        setTimeout(() => setSyncStatus('idle'), 2500);
      });
    }
  }, [user?.uid]);

  const uploadVehicleDocument = useCallback(async (
    fileType: 'license' | 'insurance' | 'puc',
    file: File
  ): Promise<{ success: boolean; fileId?: string; filename?: string }> => {
    if (!user?.uid) {
      return { success: false };
    }

    setSyncStatus('syncing');
    const res = await api.uploadDocument(user.uid, fileType, file);

    if (res && res.success) {
      setVehicleState(prev => {
        const updated: Vehicle = {
          ...prev,
          ...(fileType === 'license' && { licenseFileName: res.filename, licenseFileId: res.fileId }),
          ...(fileType === 'insurance' && { insuranceFileName: res.filename, insuranceFileId: res.fileId }),
          ...(fileType === 'puc' && { pucFileName: res.filename, pucFileId: res.fileId }),
        };
        save('rc_vehicle', updated);
        return updated;
      });
      setSyncStatus('saved');
      setTimeout(() => setSyncStatus('idle'), 2500);
      return { success: true, fileId: res.fileId, filename: res.filename };
    } else {
      setSyncStatus('offline');
      setTimeout(() => setSyncStatus('idle'), 2500);
      return { success: false };
    }
  }, [user?.uid]);

  const addContact = useCallback((c: Omit<Contact, 'id'>) => {
    setContacts(prev => {
      const updated = [...prev, { ...c, id: crypto.randomUUID() }];
      save('rc_contacts', updated);

      if (user?.uid) {
        setSyncStatus('syncing');
        api.updateContacts(user.uid, updated).then(res => {
          setSyncStatus(res?.success ? 'saved' : 'offline');
          setTimeout(() => setSyncStatus('idle'), 2500);
        });
      }

      return updated;
    });
  }, [user?.uid]);

  const updateContact = useCallback((c: Contact) => {
    setContacts(prev => {
      const updated = prev.map(x => x.id === c.id ? c : x);
      save('rc_contacts', updated);

      if (user?.uid) {
        setSyncStatus('syncing');
        api.updateContacts(user.uid, updated).then(res => {
          setSyncStatus(res?.success ? 'saved' : 'offline');
          setTimeout(() => setSyncStatus('idle'), 2500);
        });
      }

      return updated;
    });
  }, [user?.uid]);

  const removeContact = useCallback((id: string) => {
    setContacts(prev => {
      const updated = prev.filter(x => x.id !== id);
      save('rc_contacts', updated);

      if (user?.uid) {
        setSyncStatus('syncing');
        api.updateContacts(user.uid, updated).then(res => {
          setSyncStatus(res?.success ? 'saved' : 'offline');
          setTimeout(() => setSyncStatus('idle'), 2500);
        });
      }

      return updated;
    });
  }, [user?.uid]);

  const addRideLog = useCallback((log: RideLog) => {
    setRideLogs(prev => {
      const updated = [log, ...prev].slice(0, 50); // keep last 50 rides
      save('rc_rides', updated);

      if (user?.uid) {
        api.addRide(user.uid, log);
      }

      return updated;
    });
  }, [user?.uid]);

  const updateSettings = useCallback((s: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...s };
      save('rc_settings', updated);

      if (user?.uid) {
        api.updateSettings(user.uid, updated);
      }

      return updated;
    });
  }, [user?.uid]);

  return (
    <AppCtx.Provider value={{
      route, navigate: setRoute,
      user, setUser,
      vehicle, setVehicle, uploadVehicleDocument,
      contacts, addContact, updateContact, removeContact,
      rideLogs, addRideLog,
      settings, updateSettings,
      bleStatus, setBleStatus,
      syncStatus, refreshFromCloud
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
