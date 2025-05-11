import express from 'express';
import { authenticate, authorize, checkLocationAccess } from '../middleware/authMiddleware';
import { createCustomButton, getButtonsForUser, setButtonPermissions } from '../models/User';

const router = express.Router();

router.use(authenticate);

// Get buttons for current user at a specific location
router.get('/location/:locationId', checkLocationAccess, async (req, res) => {
  try {
    const buttons = await getButtonsForUser(req.user.userId, req.params.locationId);
    res.json(buttons);
  } catch (error) {
    console.error('Get buttons error:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Buttons.' });
  }
});

// Create new button (only for leads and developers)
router.post('/', authorize(['developer', 'lead']), async (req, res) => {
  try {
    const { name, url, locationId } = req.body;
    const button = await createCustomButton(name, url, locationId, req.user.userId);
    res.status(201).json(button);
  } catch (error) {
    console.error('Create button error:', error);
    res.status(500).json({ message: 'Fehler beim Erstellen des Buttons.' });
  }
});

// Set button permissions (only for leads and developers)
router.post('/:buttonId/permissions', authorize(['developer', 'lead']), async (req, res) => {
  try {
    const { buttonId } = req.params;
    const { permissions } = req.body;
    
    await setButtonPermissions(buttonId, permissions);
    res.json({ message: 'Berechtigungen erfolgreich aktualisiert.' });
  } catch (error) {
    console.error('Set button permissions error:', error);
    res.status(500).json({ message: 'Fehler beim Aktualisieren der Button-Berechtigungen.' });
  }
});

export default router;