import { User } from '../models/User.js';
import { isConnected } from '../db.js';

export async function getUser(req, res, next) {
  try {
    const { uid } = req.params;
    if (!uid) {
      return res.status(400).json({ success: false, message: 'Missing user uid parameter' });
    }

    if (!isConnected()) {
      return res.status(503).json({ 
        success: false, 
        offline: true, 
        message: 'MongoDB is currently not connected. Ensure MONGODB_URI is set in server/.env' 
      });
    }

    let user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
}

export async function upsertUser(req, res, next) {
  try {
    const { uid, name, email, photoURL, vehicle, contacts, rides, settings } = req.body;
    if (!uid) {
      return res.status(400).json({ success: false, message: 'User uid is required' });
    }

    if (!isConnected()) {
      return res.status(503).json({ 
        success: false, 
        offline: true, 
        message: 'MongoDB is currently not connected.' 
      });
    }

    const updateFields = {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(photoURL !== undefined && { photoURL }),
      ...(vehicle !== undefined && { vehicle }),
      ...(contacts !== undefined && { contacts }),
      ...(rides !== undefined && { rides }),
      ...(settings !== undefined && { settings })
    };

    const user = await User.findOneAndUpdate(
      { uid },
      { $set: updateFields },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
}

export async function updateVehicle(req, res, next) {
  try {
    const { uid } = req.params;
    const vehicle = req.body;

    if (!isConnected()) {
      return res.status(503).json({ success: false, offline: true, message: 'MongoDB not connected' });
    }

    const user = await User.findOneAndUpdate(
      { uid },
      { $set: { vehicle } },
      { new: true, upsert: true }
    );

    return res.json({ success: true, vehicle: user.vehicle });
  } catch (error) {
    next(error);
  }
}

export async function updateContacts(req, res, next) {
  try {
    const { uid } = req.params;
    const { contacts } = req.body;

    if (!Array.isArray(contacts)) {
      return res.status(400).json({ success: false, message: 'Contacts must be an array' });
    }

    if (!isConnected()) {
      return res.status(503).json({ success: false, offline: true, message: 'MongoDB not connected' });
    }

    const user = await User.findOneAndUpdate(
      { uid },
      { $set: { contacts } },
      { new: true, upsert: true }
    );

    return res.json({ success: true, contacts: user.contacts });
  } catch (error) {
    next(error);
  }
}

export async function addRide(req, res, next) {
  try {
    const { uid } = req.params;
    const ride = req.body;

    if (!ride || !ride.id) {
      return res.status(400).json({ success: false, message: 'Invalid ride log payload' });
    }

    if (!isConnected()) {
      return res.status(503).json({ success: false, offline: true, message: 'MongoDB not connected' });
    }

    // Prepend ride and keep up to 50 rides
    const user = await User.findOneAndUpdate(
      { uid },
      { 
        $push: { 
          rides: { 
            $each: [ride], 
            $position: 0, 
            $slice: 50 
          } 
        } 
      },
      { new: true, upsert: true }
    );

    return res.json({ success: true, rides: user.rides });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const { uid } = req.params;
    const settings = req.body;

    if (!isConnected()) {
      return res.status(503).json({ success: false, offline: true, message: 'MongoDB not connected' });
    }

    const user = await User.findOneAndUpdate(
      { uid },
      { $set: { settings } },
      { new: true, upsert: true }
    );

    return res.json({ success: true, settings: user.settings });
  } catch (error) {
    next(error);
  }
}
