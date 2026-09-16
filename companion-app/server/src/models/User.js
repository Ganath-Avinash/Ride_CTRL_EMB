import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, default: '' },
  phone: { type: String, default: '' },
  relation: { 
    type: String, 
    enum: ['Family', 'Friend', 'Doctor', 'Other'], 
    default: 'Other' 
  }
}, { _id: false });

const RideLogSchema = new mongoose.Schema({
  id: { type: String, required: true },
  startTime: { type: Number, default: Date.now },
  endTime: { type: Number, default: Date.now },
  maxGForce: { type: Number, default: 0 },
  distanceKm: { type: Number, default: 0 },
  events: [{ type: String }]
}, { _id: false });

const VehicleSchema = new mongoose.Schema({
  customName: { type: String, default: '' },
  make: { type: String, default: '' },
  model: { type: String, default: '' },
  year: { type: String, default: '' },
  regNumber: { type: String, default: '' },
  engineCC: { type: String, default: '' },
  color: { type: String, default: '' },
  
  // Document tracking with GridFS references
  licenseFileName: { type: String, default: '' },
  licenseFileId: { type: String, default: '' },
  insuranceFileName: { type: String, default: '' },
  insuranceFileId: { type: String, default: '' },
  pucFileName: { type: String, default: '' },
  pucFileId: { type: String, default: '' },

  // Service health tracking
  lastServiceKm: { type: Number, default: 0 },
  serviceIntervalKm: { type: Number, default: 3000 },

  // Expiry dates (YYYY-MM-DD)
  insuranceExpiry: { type: String, default: '' },
  pucExpiry: { type: String, default: '' }
}, { _id: false });

const SettingsSchema = new mongoose.Schema({
  sosDuration: { type: Number, enum: [10, 30, 60], default: 30 },
  soundAlerts: { type: Boolean, default: true },
  amoledMode: { type: Boolean, default: false },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true, index: true },
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  photoURL: { type: String, default: '' },
  vehicle: { type: VehicleSchema, default: () => ({}) },
  contacts: { type: [ContactSchema], default: [] },
  rides: { type: [RideLogSchema], default: [] },
  settings: { type: SettingsSchema, default: () => ({}) }
}, {
  timestamps: true
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
