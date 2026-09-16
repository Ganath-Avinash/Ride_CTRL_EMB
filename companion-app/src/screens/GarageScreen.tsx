import React, { useState, useEffect } from 'react';
import { 
  Bike, 
  FileText, 
  Upload, 
  CheckCircle, 
  Cpu, 
  Wifi, 
  ChevronRight, 
  Save, 
  Calendar, 
  Wrench, 
  Droplets,
  ExternalLink,
  Loader2,
  Cloud,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import type { Vehicle } from '../types';

// ── Helpers ────────────────────────────────────────────────
function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function ExpiryBadge({ dateStr }: { dateStr: string }) {
  const days = daysUntil(dateStr);
  if (days === null) return null;
  const cls = days < 0 ? 'expiry-badge expiry-badge--expired'
    : days <= 30 ? 'expiry-badge expiry-badge--warn'
    : 'expiry-badge expiry-badge--ok';
  const label = days < 0 ? 'Expired' : days === 0 ? 'Today' : `${days}d left`;
  return <span className={cls}>{label}</span>;
}

const MAKES = ['Bajaj', 'Royal Enfield', 'Honda', 'Hero', 'TVS', 'Yamaha', 'KTM', 'Suzuki', 'BMW', 'Triumph', 'Other'];
const COLORS = ['Black', 'White', 'Red', 'Blue', 'Grey', 'Orange', 'Green', 'Yellow', 'Brown', 'Custom'];

export const GarageScreen: React.FC = () => {
  const { vehicle, setVehicle, uploadVehicleDocument, bleStatus, syncStatus, user } = useApp();
  const [form, setForm] = useState<Vehicle>(vehicle);
  const [saved, setSaved] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<'license' | 'insurance' | 'puc' | null>(null);

  // Sync form if global vehicle state updates from MongoDB
  useEffect(() => {
    setForm(vehicle);
  }, [vehicle]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setVehicle(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleDocumentUpload = async (
    fileType: 'license' | 'insurance' | 'puc',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(fileType);
    try {
      const res = await uploadVehicleDocument(fileType, file);
      if (res && res.success) {
        setForm(f => ({
          ...f,
          ...(fileType === 'license' && { licenseFileName: res.filename || file.name, licenseFileId: res.fileId }),
          ...(fileType === 'insurance' && { insuranceFileName: res.filename || file.name, insuranceFileId: res.fileId }),
          ...(fileType === 'puc' && { pucFileName: res.filename || file.name, pucFileId: res.fileId }),
        }));
      } else {
        // Fallback local filename if backend is offline
        setForm(f => ({
          ...f,
          ...(fileType === 'license' && { licenseFileName: file.name }),
          ...(fileType === 'insurance' && { insuranceFileName: file.name }),
          ...(fileType === 'puc' && { pucFileName: file.name }),
        }));
      }
    } finally {
      setUploadingDoc(null);
      // Reset input value so same file can be re-selected if needed
      e.target.value = '';
    }
  };

  const handleViewDocument = (fileType: 'license' | 'insurance' | 'puc') => {
    let fileId: string | undefined;
    let filename: string | undefined;

    if (fileType === 'license') {
      fileId = form.licenseFileId;
      filename = form.licenseFileName;
    } else if (fileType === 'insurance') {
      fileId = form.insuranceFileId;
      filename = form.insuranceFileName;
    } else if (fileType === 'puc') {
      fileId = form.pucFileId;
      filename = form.pucFileName;
    }

    if (fileId) {
      const url = api.getDocumentUrl(fileId);
      api.openDocument(url, filename);
    } else if (user?.uid) {
      const url = api.getUserDocumentUrl(user.uid, fileType);
      api.openDocument(url, filename);
    } else {
      alert('Document file is not yet uploaded to the cloud.');
    }
  };

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 className="screen-title">My Garage</h2>
            {syncStatus === 'syncing' ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '11px', color: 'var(--accent-blue)', background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                <Loader2 size={10} className="animate-spin" /> Syncing
              </span>
            ) : syncStatus === 'saved' ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '11px', color: 'var(--accent-green)', background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                <Cloud size={10} /> Atlas Saved
              </span>
            ) : null}
          </div>
          <p className="text-secondary" style={{ fontSize: '13px' }}>Vehicle profile & cloud document storage</p>
        </div>
      </header>

      {/* Bike Avatar Card */}
      <div className="card bike-avatar-card" style={{ margin: '0 16px 20px' }}>
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
      <form onSubmit={handleSave} style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* Vehicle Specifications Card */}
        <div className="card" style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: '18px' }}>
          <div className="form-section-label" style={{ margin: 0, fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>VEHICLE SPECIFICATIONS</div>

          {/* Custom Name */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Bike Nickname</label>
            <div className="form-field">
              <Bike size={16} className="form-field-icon" />
              <input id="vehicle-name" className="form-input" placeholder="e.g. Black Panther"
                value={form.customName} onChange={e => setForm(f => ({ ...f, customName: e.target.value }))} />
            </div>
          </div>

          {/* Make + Model */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Make</label>
              <select id="vehicle-make" className="form-input form-select" value={form.make}
                onChange={e => setForm(f => ({ ...f, make: e.target.value }))}>
                <option value="">Select Make</option>
                {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Model</label>
              <input id="vehicle-model" className="form-input" placeholder="e.g. Pulsar 220" value={form.model}
                onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
            </div>
          </div>

          {/* Year + Engine CC */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Model Year</label>
              <input id="vehicle-year" className="form-input" placeholder="e.g. 2022" maxLength={4}
                value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Engine (cc)</label>
              <input id="vehicle-cc" className="form-input" placeholder="e.g. 220" value={form.engineCC}
                onChange={e => setForm(f => ({ ...f, engineCC: e.target.value }))} />
            </div>
          </div>

          {/* Registration Number */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Registration Number</label>
            <div className="form-field">
              <FileText size={16} className="form-field-icon" />
              <input id="vehicle-reg" className="form-input" placeholder="e.g. KA01AB1234"
                value={form.regNumber} onChange={e => setForm(f => ({ ...f, regNumber: e.target.value.toUpperCase() }))} />
            </div>
          </div>

          {/* Color */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Vehicle Color</label>
            <select id="vehicle-color" className="form-input form-select" value={form.color}
              onChange={e => setForm(f => ({ ...f, color: e.target.value }))}>
              <option value="">Select Color</option>
              {COLORS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* ── Documents & Cloud Storage (GridFS) ───────────── */}
        <div className="form-section-label" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ShieldCheck size={16} color="var(--accent-red)" />
          Documents & Cloud Storage (MongoDB)
        </div>

        {/* 1. Driving License */}
        <div className="card" style={{ padding: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Driving License</span>
            {form.licenseFileName && (
              <span style={{ fontSize: '11px', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={12} /> Stored
              </span>
            )}
          </div>

          {form.licenseFileName ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <FileText size={16} color="var(--accent-blue)" />
                <span style={{ fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {form.licenseFileName}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => handleViewDocument('license')}
                >
                  <ExternalLink size={13} /> View / Open PDF
                </button>
                <label className="btn btn-secondary" style={{ fontSize: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', margin: 0 }}>
                  <Upload size={13} /> Replace
                  <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={(e) => handleDocumentUpload('license', e)} />
                </label>
              </div>
            </div>
          ) : (
            <label className="dl-upload-zone" style={{ cursor: 'pointer', margin: 0 }}>
              {uploadingDoc === 'license' ? (
                <>
                  <Loader2 size={22} className="animate-spin" color="var(--accent-blue)" />
                  <span style={{ fontWeight: 600 }}>Uploading to Atlas GridFS...</span>
                </>
              ) : (
                <>
                  <Upload size={22} color="var(--text-tertiary)" />
                  <span style={{ fontWeight: 600 }}>Upload Driving License (PDF / Image)</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Stores in MongoDB Atlas GridFS</span>
                </>
              )}
              <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={(e) => handleDocumentUpload('license', e)} disabled={uploadingDoc !== null} />
            </label>
          )}
        </div>

        {/* 2. Insurance Policy */}
        <div className="card" style={{ padding: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', fontWeight: 600 }}>
              <Calendar size={14} /> Insurance Policy
            </div>
            <ExpiryBadge dateStr={form.insuranceExpiry} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: 4, display: 'block' }}>Expiry Date</span>
            <input
              id="vehicle-insurance-expiry"
              type="date"
              className="form-input"
              value={form.insuranceExpiry}
              onChange={e => setForm(f => ({ ...f, insuranceExpiry: e.target.value }))}
            />
          </div>

          {form.insuranceFileName ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <FileText size={16} color="var(--accent-green)" />
                <span style={{ fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {form.insuranceFileName}
                </span>
                <CheckCircle size={14} color="var(--accent-green)" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => handleViewDocument('insurance')}
                >
                  <ExternalLink size={13} /> View Insurance PDF
                </button>
                <label className="btn btn-secondary" style={{ fontSize: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', margin: 0 }}>
                  <Upload size={13} /> Replace
                  <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={(e) => handleDocumentUpload('insurance', e)} />
                </label>
              </div>
            </div>
          ) : (
            <label className="dl-upload-zone" style={{ cursor: 'pointer', margin: 0, padding: '12px' }}>
              {uploadingDoc === 'insurance' ? (
                <>
                  <Loader2 size={18} className="animate-spin" color="var(--accent-blue)" />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Uploading Insurance Doc...</span>
                </>
              ) : (
                <>
                  <Upload size={18} color="var(--text-tertiary)" />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Upload Insurance Copy (PDF)</span>
                </>
              )}
              <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={(e) => handleDocumentUpload('insurance', e)} disabled={uploadingDoc !== null} />
            </label>
          )}
        </div>

        {/* 3. PUC Certificate */}
        <div className="card" style={{ padding: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', fontWeight: 600 }}>
              <FileText size={14} /> PUC Certificate
            </div>
            <ExpiryBadge dateStr={form.pucExpiry} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: 4, display: 'block' }}>Expiry Date</span>
            <input
              id="vehicle-puc-expiry"
              type="date"
              className="form-input"
              value={form.pucExpiry}
              onChange={e => setForm(f => ({ ...f, pucExpiry: e.target.value }))}
            />
          </div>

          {form.pucFileName ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <FileText size={16} color="var(--accent-green)" />
                <span style={{ fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {form.pucFileName}
                </span>
                <CheckCircle size={14} color="var(--accent-green)" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => handleViewDocument('puc')}
                >
                  <ExternalLink size={13} /> View PUC PDF
                </button>
                <label className="btn btn-secondary" style={{ fontSize: '12px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', margin: 0 }}>
                  <Upload size={13} /> Replace
                  <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={(e) => handleDocumentUpload('puc', e)} />
                </label>
              </div>
            </div>
          ) : (
            <label className="dl-upload-zone" style={{ cursor: 'pointer', margin: 0, padding: '12px' }}>
              {uploadingDoc === 'puc' ? (
                <>
                  <Loader2 size={18} className="animate-spin" color="var(--accent-blue)" />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Uploading PUC Doc...</span>
                </>
              ) : (
                <>
                  <Upload size={18} color="var(--text-tertiary)" />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>Upload PUC Certificate (PDF)</span>
                </>
              )}
              <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={(e) => handleDocumentUpload('puc', e)} disabled={uploadingDoc !== null} />
            </label>
          )}
        </div>

        {/* ── Service Tracker ────────────────────────────── */}
        <div className="form-section-label" style={{ marginTop: 4 }}>Service Tracker</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {/* Last Service Odometer */}
          <div className="form-field">
            <Wrench size={15} className="form-field-icon" />
            <input
              id="vehicle-last-service-km"
              className="form-input"
              type="number"
              placeholder="Last service km"
              min={0}
              value={form.lastServiceKm || ''}
              onChange={e => setForm(f => ({ ...f, lastServiceKm: parseFloat(e.target.value) || 0 }))}
            />
          </div>
          {/* Service Interval */}
          <div className="form-field">
            <Droplets size={15} className="form-field-icon" />
            <select
              id="vehicle-service-interval"
              className="form-input form-select"
              value={form.serviceIntervalKm}
              onChange={e => setForm(f => ({ ...f, serviceIntervalKm: parseInt(e.target.value) }))}
            >
              <option value={1000}>Every 1 000 km</option>
              <option value={2000}>Every 2 000 km</option>
              <option value={3000}>Every 3 000 km</option>
              <option value={5000}>Every 5 000 km</option>
              <option value={10000}>Every 10 000 km</option>
            </select>
          </div>
        </div>

        {/* Save Button */}
        <button id="btn-save-vehicle" type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4 }}>
          {saved ? <><CheckCircle size={16} style={{ marginRight: 8 }} />Saved to Cloud!</> : <><Save size={16} style={{ marginRight: 8 }} />Save Vehicle Details</>}
        </button>
      </form>

      {/* Device Info Card */}
      <div className="card" style={{ margin: '20px 16px 90px', padding: '16px' }}>
        <div className="form-section-label" style={{ marginBottom: 12 }}>Device Info</div>
        <div className="device-info-row">
          <Cpu size={16} color="var(--accent-blue)" />
          <span style={{ color: 'var(--text-secondary)' }}>Device</span>
          <span style={{ marginLeft: 'auto', fontWeight: 600 }}>SentryX v1.0</span>
        </div>
        <div className="device-info-row">
          <Wifi size={16} color={bleStatus === 'connected' ? 'var(--accent-green)' : 'var(--text-tertiary)'} />
          <span style={{ color: 'var(--text-secondary)' }}>BLE Status</span>
          <span style={{ marginLeft: 'auto', fontWeight: 600, color: bleStatus === 'connected' ? 'var(--accent-green)' : 'var(--text-tertiary)' }}>
            {bleStatus.charAt(0).toUpperCase() + bleStatus.slice(1)}
          </span>
        </div>
        <div className="device-info-row">
          <Cloud size={16} color="var(--accent-blue)" />
          <span style={{ color: 'var(--text-secondary)' }}>Database</span>
          <span style={{ marginLeft: 'auto', fontWeight: 600 }}>MongoDB Atlas</span>
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
