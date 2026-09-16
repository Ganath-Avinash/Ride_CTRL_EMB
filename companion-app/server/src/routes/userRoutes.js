import { Router } from 'express';
import {
  getUser,
  upsertUser,
  updateVehicle,
  updateContacts,
  addRide,
  updateSettings
} from '../controllers/userController.js';

const router = Router();

router.get('/:uid', getUser);
router.post('/', upsertUser);
router.put('/:uid/vehicle', updateVehicle);
router.put('/:uid/contacts', updateContacts);
router.post('/:uid/rides', addRide);
router.put('/:uid/settings', updateSettings);

export default router;
