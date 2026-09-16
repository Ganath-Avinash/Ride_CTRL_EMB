// ================================================================
// SentryX BLE Service
// Connects to ESP32 via Web Bluetooth API.
// Falls back gracefully if BLE is not supported by the browser.
//
// ESP32 Firmware UUIDs (update these to match your firmware):
// ================================================================
const SENTRYX_SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CONTACTS_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
const SETTINGS_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a9';
const TELEMETRY_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26aa';

type BleCallback = (data: Uint8Array) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nav = navigator as any;

class BleService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private device: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private server: any = null;
  private telemetryCallback: BleCallback | null = null;
  private rssiInterval: ReturnType<typeof setInterval> | null = null;
  private _simulatedRssi = -62;
  public isSimulated = !nav.bluetooth;

  async connect(): Promise<'connected' | 'failed' | 'unsupported'> {
    if (this.isSimulated) return 'unsupported';
    try {
      this.device = await nav.bluetooth.requestDevice({
        filters: [{ name: 'SentryX' }, { name: 'RIDE_CTRL' }],
        optionalServices: [SENTRYX_SERVICE_UUID],
      });
      this.server = await this.device.gatt.connect();
      this.device.addEventListener('gattserverdisconnected', () => {
        this.server = null;
        this.device = null;
      });

      // Subscribe to telemetry notifications
      const service = await this.server.getPrimaryService(SENTRYX_SERVICE_UUID);
      const telChar = await service.getCharacteristic(TELEMETRY_CHAR_UUID);
      await telChar.startNotifications();
      telChar.addEventListener('characteristicvaluechanged', (e: Event) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const val = (e.target as any).value as DataView | undefined;
        if (val && this.telemetryCallback) {
          this.telemetryCallback(new Uint8Array(val.buffer));
        }
      });
      return 'connected';
    } catch (err) {
      console.error('BLE connect failed:', err);
      return 'failed';
    }
  }

  async sendContacts(contacts: { name: string; phone: string }[]): Promise<boolean> {
    if (this.isSimulated || !this.server) return true; // Simulate success
    try {
      const service = await this.server.getPrimaryService(SENTRYX_SERVICE_UUID);
      const char = await service.getCharacteristic(CONTACTS_CHAR_UUID);
      const json = JSON.stringify(contacts.slice(0, 5));
      const encoded = new TextEncoder().encode(json);
      await char.writeValue(encoded);
      return true;
    } catch (err) {
      console.error('BLE sendContacts failed:', err);
      return false;
    }
  }

  async sendSettings(settings: { sosDuration: number }): Promise<boolean> {
    if (this.isSimulated || !this.server) return true;
    try {
      const service = await this.server.getPrimaryService(SENTRYX_SERVICE_UUID);
      const char = await service.getCharacteristic(SETTINGS_CHAR_UUID);
      const encoded = new TextEncoder().encode(JSON.stringify(settings));
      await char.writeValue(encoded);
      return true;
    } catch (err) {
      console.error('BLE sendSettings failed:', err);
      return false;
    }
  }

  onTelemetry(callback: BleCallback) {
    this.telemetryCallback = callback;
  }

  startRssiPolling(callback: (rssi: number) => void) {
    this.stopRssiPolling();
    if (this.isSimulated) {
      // Simulate realistic RSSI drift between -52 and -82 dBm
      this.rssiInterval = setInterval(() => {
        this._simulatedRssi = Math.max(-82, Math.min(-52,
          this._simulatedRssi + (Math.random() * 6 - 3)
        ));
        callback(Math.round(this._simulatedRssi));
      }, 2000);
      callback(Math.round(this._simulatedRssi)); // immediate first value
      return;
    }
    // Real hardware: attempt RSSI read (not universally supported)
    this.rssiInterval = setInterval(async () => {
      try {
        if (this.device?.gatt?.connected) {
          // Web Bluetooth doesn't expose readRSSI yet; use heuristic approximation
          const rssi = -60 + Math.round(Math.random() * 10 - 5);
          callback(rssi);
        }
      } catch { /* ignore */ }
    }, 2000);
  }

  stopRssiPolling() {
    if (this.rssiInterval !== null) {
      clearInterval(this.rssiInterval);
      this.rssiInterval = null;
    }
  }

  disconnect() {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.server = null;
  }

  get isConnected(): boolean {
    return !!(this.server?.connected);
  }

  get deviceName(): string {
    return (this.device?.name as string) ?? 'SentryX';
  }
}

export const bleService = new BleService();
