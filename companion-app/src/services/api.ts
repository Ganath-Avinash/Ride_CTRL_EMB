/**
 * SentryX Backend API Client
 * Seamless communication with Node.js + Express + MongoDB Atlas Backend.
 * Designed for both Web browser and Android Capacitor App environments.
 */

import type { Vehicle, Contact, RideLog, AppSettings } from '../types';

export function getApiBaseUrl(): string {
  // 1. Allow dynamic override in localStorage (crucial for testing physical Android APKs on local Wi-Fi)
  const storedUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('sentryx_api_url') : null;
  if (storedUrl && storedUrl.trim()) {
    return storedUrl.replace(/\/+$/, '');
  }

  // 2. Vite environment variable
  if (import.meta.env.VITE_API_URL) {
    return (import.meta.env.VITE_API_URL as string).replace(/\/+$/, '');
  }

  // 3. Default dev server port
  return 'http://localhost:5001';
}

export function setCustomApiUrl(url: string | null) {
  if (typeof localStorage === 'undefined') return;
  if (!url || !url.trim()) {
    localStorage.removeItem('sentryx_api_url');
  } else {
    localStorage.setItem('sentryx_api_url', url.trim().replace(/\/+$/, ''));
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}, timeoutMs = 8000): Promise<T | null> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.json().catch(() => null);
      throw new Error(errBody?.message || `HTTP ${res.status}: ${res.statusText}`);
    }

    return (await res.json()) as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.warn(`⚠️ [API Timeout] ${endpoint} took longer than ${timeoutMs}ms`);
    } else {
      console.warn(`⚠️ [API Error] ${endpoint}:`, err.message || err);
    }
    return null;
  }
}

export interface BackendUserData {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  vehicle: Vehicle;
  contacts: Contact[];
  rides: RideLog[];
  settings: AppSettings;
}

export const api = {
  // Backend health & database connection test
  async checkHealth(): Promise<{ status: string; database: string } | null> {
    return request<{ status: string; database: string }>('/api/health', { method: 'GET' }, 4000);
  },

  // Fetch complete user document from MongoDB Atlas
  async getUser(uid: string): Promise<{ success: boolean; user: BackendUserData } | null> {
    return request<{ success: boolean; user: BackendUserData }>(`/api/user/${encodeURIComponent(uid)}`, {
      method: 'GET'
    });
  },

  // Upsert user profile & state
  async syncUser(payload: Partial<BackendUserData> & { uid: string }): Promise<{ success: boolean; user: BackendUserData } | null> {
    return request<{ success: boolean; user: BackendUserData }>('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  // Update vehicle details
  async updateVehicle(uid: string, vehicle: Vehicle): Promise<{ success: boolean; vehicle: Vehicle } | null> {
    return request<{ success: boolean; vehicle: Vehicle }>(`/api/user/${encodeURIComponent(uid)}/vehicle`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicle)
    });
  },

  // Update emergency contacts
  async updateContacts(uid: string, contacts: Contact[]): Promise<{ success: boolean; contacts: Contact[] } | null> {
    return request<{ success: boolean; contacts: Contact[] }>(`/api/user/${encodeURIComponent(uid)}/contacts`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts })
    });
  },

  // Add a completed ride log
  async addRide(uid: string, ride: RideLog): Promise<{ success: boolean; rides: RideLog[] } | null> {
    return request<{ success: boolean; rides: RideLog[] }>(`/api/user/${encodeURIComponent(uid)}/rides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ride)
    });
  },

  // Update app settings
  async updateSettings(uid: string, settings: AppSettings): Promise<{ success: boolean; settings: AppSettings } | null> {
    return request<{ success: boolean; settings: AppSettings }>(`/api/user/${encodeURIComponent(uid)}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
  },

  // Upload PDF or image document to MongoDB GridFS
  async uploadDocument(
    uid: string,
    fileType: 'license' | 'insurance' | 'puc',
    file: File
  ): Promise<{ success: boolean; fileId: string; filename: string; contentType: string; size: number } | null> {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/api/files/upload/${encodeURIComponent(uid)}/${fileType}`;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(url, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.message || `Upload failed with HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err: any) {
      console.error('❌ [Document Upload Error]:', err.message || err);
      return null;
    }
  },

  // Get stream/download URL by GridFS fileId
  getDocumentUrl(fileId: string, download = false): string {
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}/api/files/${encodeURIComponent(fileId)}${download ? '?download=true' : ''}`;
  },

  // Get stream/download URL for user's document type
  getUserDocumentUrl(uid: string, fileType: 'license' | 'insurance' | 'puc', download = false): string {
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}/api/files/user/${encodeURIComponent(uid)}/${fileType}${download ? '?download=true' : ''}`;
  },

  // Utility to view or download a document across Web & Capacitor Android
  openDocument(url: string, filename?: string) {
    if (typeof window === 'undefined') return;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    if (filename) a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 200);
  }
};
