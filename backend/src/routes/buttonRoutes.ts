// backend/src/routes/buttonRoutes.ts
import express from 'express';
import { authenticate, authorize, checkLocationAccess } from '../middleware/authMiddleware';
import { createCustomButton, getButtonsForUser, setButtonPermissions } from '../models/User';

const router = express.Router();

router.use(authenticate);

// Get buttons for current user at a specific location
router.get('/location/:locationId', checkLocationAccess, async (req, res) => {
  try {
    console.log(`GET /buttons/location/${req.params.locationId} aufgerufen`);
    console.log(`User: ${JSON.stringify(req.user)}`);
    
    const buttons = await getButtonsForUser(req.user.userId, req.params.locationId);
    console.log(`Buttons gefunden: ${buttons.length}`);
    
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
    console.log(`POST /buttons aufgerufen mit name=${name}, url=${url}, locationId=${locationId}`);
    
    const button = await createCustomButton(name, url, locationId, req.user.userId);
    console.log(`Button erstellt: ${JSON.stringify(button)}`);
    
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
    console.log(`POST /buttons/${buttonId}/permissions aufgerufen`);
    console.log(`Permissions: ${JSON.stringify(permissions)}`);
    
    await setButtonPermissions(buttonId, permissions);
    console.log('Berechtigungen erfolgreich aktualisiert');
    
    res.json({ message: 'Berechtigungen erfolgreich aktualisiert.' });
  } catch (error) {
    console.error('Set button permissions error:', error);
    res.status(500).json({ message: 'Fehler beim Aktualisieren der Button-Berechtigungen.' });
  }
});

export default router;
