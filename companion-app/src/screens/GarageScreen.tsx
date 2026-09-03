import React, { useState } from 'react';
import { Bike, FileText, Upload, CheckCircle, Cpu, Wifi, ChevronRight, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Vehicle } from '../types';

const MAKES = ['Bajaj', 'Royal Enfield', 'Honda', 'Hero', 'TVS', 'Yamaha', 'KTM', 'Suzuki', 'BMW', 'Triumph', 'Other'];
const COLORS = ['Black', 'White', 'Red', 'Blue', 'Grey', 'Orange', 'Green', 'Yellow', 'Brown', 'Custom'];

export const GarageScreen: React.FC = () => {
  const { vehicle, setVehicle, bleStatus } = useApp();
  const [form, setForm] = useState<Vehicle>(vehicle);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setVehicle(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm(f => ({ ...f, licenseFileName: file.name }));
    }
  };


  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <h2 className="screen-title">My Garage</h2>
          <p className="text-secondary" style={{ fontSize: '13px' }}>Vehicle profile & device info</p>
        </div>
      </header>

      {/* Bike Avatar Card */}
      <div className="glass-panel bike-avatar-card" style={{ margin: '0 16px 20px' }}>
        <div className="bike-avatar-ring">
          <Bike size={42} color="var(--accent-red)" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            {form.customName || 'Unnamed Bike'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {form.make && form.model ? `${form.make} ${form.model}` : 'Add details below'}
            {form.year ? ` · ${form.year}` : ''}
          </p>
          {form.regNumber && (
            <div className="reg-badge">{form.regNumber}</div>
          )}
        </div>
        <div className="bike-avatar-stats">
          <div className="bike-stat">
            <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>ENGINE</span>
            <span style={{ fontWeight: 600 }}>{form.engineCC || '—'} cc</span>
          </div>
          <div className="bike-stat-divider" />
          <div className="bike-stat">
            <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>COLOR</span>
            <span style={{ fontWeight: 600 }}>{form.color || '—'}</span>
          </div>
        </div>
      </div>

      {/* Vehicle Details Form */}
      <form onSubmit={handleSave} style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="form-section-label">Vehicle Details</div>

        {/* Custom Name */}
        <div className="form-field">
          <Bike size={15} className="form-field-icon" />
          <input id="vehicle-name" className="form-input" placeholder="Bike Nickname (e.g. Black Panther)"
            value={form.customName} onChange={e => setForm(f => ({ ...f, customName: e.target.value }))} />
        </div>

        {/* Make + Model */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <select id="vehicle-make" className="form-input form-select" value={form.make}
            onChange={e => setForm(f => ({ ...f, make: e.target.value }))}>
            <option value="">Make</option>
            {MAKES.map(m => <option key={m}>{m}</option>)}
          </select>
          <input id="vehicle-model" className="form-input" placeholder="Model" value={form.model}
            onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
        </div>

        {/* Year + Engine CC */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input id="vehicle-year" className="form-input" placeholder="Year (e.g. 2022)" maxLength={4}
            value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
          <input id="vehicle-cc" className="form-input" placeholder="Engine CC" value={form.engineCC}
            onChange={e => setForm(f => ({ ...f, engineCC: e.target.value }))} />
        </div>

        {/* Registration Number */}
        <div className="form-field">
          <FileText size={15} className="form-field-icon" />
          <input id="vehicle-reg" className="form-input" placeholder="Reg. No. (e.g. KA01AB1234)"
            value={form.regNumber} onChange={e => setForm(f => ({ ...f, regNumber: e.target.value.toUpperCase() }))} />
        </div>

        {/* Color */}
        <select id="vehicle-color" className="form-input form-select" value={form.color}
          onChange={e => setForm(f => ({ ...f, color: e.target.value }))}>
          <option value="">Color</option>
          {COLORS.map(c => <option key={c}>{c}</option>)}
        </select>

        {/* Driving License (UI only) */}
        <div className="form-section-label" style={{ marginTop: 4 }}>Driving License</div>
        <label id="license-upload" className="dl-upload-zone" htmlFor="dl-file-input">
          {form.licenseFileName ? (
            <>
              <CheckCircle size={22} color="var(--accent-green)" />
              <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{form.licenseFileName}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Tap to replace</span>
            </>
          ) : (
            <>
              <Upload size={22} color="var(--text-tertiary)" />
              <span style={{ fontWeight: 600 }}>Upload DL Copy</span>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>JPG, PNG or PDF</span>
            </>
          )}
          <input id="dl-file-input" type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleLicenseChange} />
        </label>

        {/* Save Button */}
        <button id="btn-save-vehicle" type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4 }}>
          {saved ? <><CheckCircle size={16} style={{ marginRight: 8 }} />Saved!</> : <><Save size={16} style={{ marginRight: 8 }} />Save Vehicle Details</>}
        </button>
      </form>

      {/* Device Info Card */}
      <div className="glass-panel" style={{ margin: '20px 16px 90px', padding: '16px' }}>
        <div className="form-section-label" style={{ marginBottom: 12 }}>Device Info</div>
        <div className="device-info-row">
          <Cpu size={16} color="var(--accent-blue)" />
          <span style={{ color: 'var(--text-secondary)' }}>Device</span>
          <span style={{ marginLeft: 'auto', fontWeight: 600 }}>RIDE CTRL v1.0</span>
        </div>
        <div className="device-info-row">
          <Wifi size={16} color={bleStatus === 'connected' ? 'var(--accent-green)' : 'var(--text-tertiary)'} />
          <span style={{ color: 'var(--text-secondary)' }}>BLE Status</span>
          <span style={{ marginLeft: 'auto', fontWeight: 600, color: bleStatus === 'connected' ? 'var(--accent-green)' : 'var(--text-tertiary)' }}>
            {bleStatus.charAt(0).toUpperCase() + bleStatus.slice(1)}
          </span>
        </div>
        <div className="device-info-row">
          <FileText size={16} color="var(--text-tertiary)" />
          <span style={{ color: 'var(--text-secondary)' }}>Firmware</span>
          <span style={{ marginLeft: 'auto', fontWeight: 600 }}>ESP32 · 1.0.0</span>
          <ChevronRight size={14} style={{ opacity: 0.4, marginLeft: 4 }} />
        </div>
      </div>
    </div>
  );
};
