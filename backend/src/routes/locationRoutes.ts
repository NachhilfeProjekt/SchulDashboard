// backend/src/routes/locationRoutes.ts
import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { getLocations, createLocation, getUserLocations, getLocationById, deleteLocation } from '../models/User';

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

// Delete location (only for developers)
router.delete('/:locationId', authorize(['developer']), async (req, res) => {
  try {
    const { locationId } = req.params;
    
    // Check if location exists
    const location = await getLocationById(locationId);
    if (!location) {
      return res.status(404).json({ message: 'Standort nicht gefunden.' });
    }
    
    // Try to delete the location
    const success = await deleteLocation(locationId);
    
    if (success) {
      res.json({ message: 'Standort erfolgreich gelöscht.' });
    } else {
      res.status(500).json({ message: 'Fehler beim Löschen des Standorts.' });
    }
  } catch (error) {
    console.error('Delete location error:', error);
    
    // Check for specific error types
    if (error.message?.includes('foreign key constraint') || 
        error.message?.includes('associated with')) {
      res.status(400).json({ 
        message: 'Der Standort kann nicht gelöscht werden, da er noch mit Benutzern oder anderen Elementen verknüpft ist.' 
      });
    } else {
      res.status(500).json({ message: 'Fehler beim Löschen des Standorts.' });
    }
  }
});

export default router;
