import React, { useState } from 'react';
import { UserPlus, Trash2, Phone, User, Heart, Bluetooth, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { bleService } from '../services/bleService';
import type { Contact } from '../types';

const RELATIONS: Contact['relation'][] = ['Family', 'Friend', 'Doctor', 'Other'];

const relationColor: Record<Contact['relation'], string> = {
  Family:  '#ff453a',
  Friend:  '#0a84ff',
  Doctor:  '#30d158',
  Other:   '#8e8e93',
};

const relationIcon: Record<Contact['relation'], React.ReactNode> = {
  Family:  <Heart size={14} />,
  Friend:  <User size={14} />,
  Doctor:  <Heart size={14} />,
  Other:   <User size={14} />,
};

const EMPTY: Omit<Contact, 'id'> = { name: '', phone: '', relation: 'Family' };

export const ContactsScreen: React.FC = () => {
  const { contacts, addContact, removeContact, bleStatus } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Contact, 'id'>>(EMPTY);
  const [formError, setFormError] = useState('');
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'done' | 'fail'>('idle');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    if (!/^\+?[0-9\s\-]{7,15}$/.test(form.phone)) { setFormError('Enter a valid phone number.'); return; }
    if (contacts.length >= 5) { setFormError('Maximum 5 contacts allowed.'); return; }
    addContact(form);
    setForm(EMPTY);
    setShowForm(false);
    setFormError('');
    setSyncState('idle');
  };

  const handleSync = async () => {
    setSyncState('syncing');
    const ok = await bleService.sendContacts(contacts.map(c => ({ name: c.name, phone: c.phone })));
    setSyncState(ok ? 'done' : 'fail');
    setTimeout(() => setSyncState('idle'), 3000);
  };

  return (
    <div className="screen">
      <header className="screen-header">
        <div>
          <h2 className="screen-title">Emergency Contacts</h2>
          <p className="text-secondary" style={{ fontSize: '13px' }}>{contacts.length}/5 contacts saved</p>
        </div>
        <button
          id="btn-add-contact"
          className="btn btn-primary"
          style={{ padding: '8px 14px', fontSize: '13px' }}
          onClick={() => { setShowForm(f => !f); setFormError(''); }}
        >
          {showForm ? <X size={16} /> : <><UserPlus size={16} style={{ marginRight: 6 }} />Add</>}
        </button>
      </header>

      {/* Add Contact Form */}
      {showForm && (
        <form onSubmit={handleAdd} className="glass-panel form-card" style={{ margin: '0 16px 16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: 12 }}>New Contact</h3>

          <div className="form-field">
            <User size={15} className="form-field-icon" />
            <input id="contact-name" className="form-input" placeholder="Full Name" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>

          <div className="form-field">
            <Phone size={15} className="form-field-icon" />
            <input id="contact-phone" className="form-input" placeholder="Phone Number (+91...)" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
          </div>

          <div className="relation-picker">
            {RELATIONS.map(r => (
              <button
                key={r}
                type="button"
                className={`relation-chip${form.relation === r ? ' relation-chip--active' : ''}`}
                style={{ '--chip-color': relationColor[r] } as React.CSSProperties}
                onClick={() => setForm(f => ({ ...f, relation: r }))}
              >
                {r}
              </button>
            ))}
          </div>

          {formError && (
            <div className="auth-error" style={{ marginBottom: 8 }}>
              <AlertTriangle size={13} /><span>{formError}</span>
            </div>
          )}

          <button id="btn-save-contact" type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Save Contact
          </button>
        </form>
      )}

      {/* Contact List */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1, marginBottom: 16 }}>
        {contacts.length === 0 ? (
          <div className="empty-state">
            <Phone size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ color: 'var(--text-secondary)' }}>No contacts added yet.</p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Add up to 5 emergency contacts to receive SOS alerts.</p>
          </div>
        ) : (
          contacts.map((c, i) => (
            <div key={c.id} className="contact-card glass-panel" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="contact-avatar" style={{ background: relationColor[c.relation] + '22', border: `1px solid ${relationColor[c.relation]}55` }}>
                <span style={{ color: relationColor[c.relation] }}>{relationIcon[c.relation]}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: relationColor[c.relation] }}>{i + 1}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>{c.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <Phone size={12} /> {c.phone}
                </div>
                <div className="relation-badge" style={{ background: relationColor[c.relation] + '22', color: relationColor[c.relation] }}>
                  {c.relation}
                </div>
              </div>
              <button
                id={`btn-delete-contact-${c.id}`}
                className="btn-icon btn-icon--danger"
                onClick={() => removeContact(c.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Sync Button */}
      {contacts.length > 0 && (
        <div style={{ padding: '0 16px 90px' }}>
          <button
            id="btn-sync-contacts"
            className={`btn sync-btn sync-btn--${syncState}`}
            onClick={handleSync}
            disabled={syncState === 'syncing'}
            style={{ width: '100%' }}
          >
            {syncState === 'idle' && <><Bluetooth size={16} style={{ marginRight: 8 }} />Sync to ESP32</>}
            {syncState === 'syncing' && <><span className="spin-icon">⟳</span> Syncing...</>}
            {syncState === 'done' && <><CheckCircle size={16} style={{ marginRight: 8 }} />Synced Successfully</>}
            {syncState === 'fail' && <><AlertTriangle size={16} style={{ marginRight: 8 }} />Sync Failed — Retry</>}
          </button>
          {bleStatus === 'disconnected' && (
            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-tertiary)', marginTop: 8 }}>
              Connect to RIDE CTRL device via Dashboard to sync
            </p>
          )}
        </div>
      )}
    </div>
  );
};
