export type AppRoute = 'auth' | 'dashboard' | 'contacts' | 'garage' | 'profile';
export type BleStatus = 'disconnected' | 'connecting' | 'connected' | 'unsupported';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
}

export interface Vehicle {
  customName: string;
  make: string;
  model: string;
  year: string;
  regNumber: string;
  engineCC: string;
  color: string;
  licenseFileName: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  relation: 'Family' | 'Friend' | 'Doctor' | 'Other';
}

export interface RideLog {
  id: string;
  startTime: number;
  endTime: number;
  maxGForce: number;
  distanceKm: number;
  events: string[];
}

export interface AppSettings {
  sosDuration: 10 | 30 | 60;
  soundAlerts: boolean;
  amoledMode: boolean;
  theme: 'light' | 'dark' | 'system';
}

