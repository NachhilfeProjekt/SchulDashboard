import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { getLocations, createLocation, getUserLocations } from '../models/User';

const router = express.Router();

router.use(authenticate);

// Get all locations (only for developers)
router.get('/', authorize(['developer']), async (req, res) => {
  try {
    const locations = await getLocations();
    res.json(locations);
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Standorte.' });
  }
});

// Get locations accessible by current user
router.get('/my-locations', async (req, res) => {
  try {
    const locations = await getUserLocations(req.user.userId);
    res.json(locations);
  } catch (error) {
    console.error('Get user locations error:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Standorte.' });
  }
});

// Create new location (only for developers)
router.post('/', authorize(['developer']), async (req, res) => {
  try {
    const { name } = req.body;
    const location = await createLocation(name, req.user.userId);
    res.status(201).json(location);
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({ message: 'Fehler beim Erstellen des Standorts.' });
  }
});

export default router;