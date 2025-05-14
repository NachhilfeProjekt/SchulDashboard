// backend/src/routes/buttonRoutes.ts
import express from 'express';
import { authenticate, authorize, checkLocationAccess } from '../middleware/authMiddleware';
import { createCustomButton, getButtonsForUser, setButtonPermissions, deleteButton } from '../models/User';
import pool from '../config/database';

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

// NEUE ROUTE: Delete button (only for leads and developers)
router.delete('/:buttonId', authorize(['developer', 'lead']), async (req, res) => {
  try {
    const { buttonId } = req.params;
    console.log(`DELETE /buttons/${buttonId} aufgerufen`);
    
    // Überprüfe, ob der Button existiert und dem User/Location gehört
    const buttonQuery = await pool.query(
      'SELECT * FROM custom_buttons WHERE id = $1',
      [buttonId]
    );
    
    if (buttonQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Button nicht gefunden.' });
    }
    
    const button = buttonQuery.rows[0];
    
    // Überprüfe, ob der Benutzer Zugriff auf den Standort des Buttons hat
    if (req.user.role !== 'developer' && !req.user.locations.includes(button.location_id)) {
      return res.status(403).json({ message: 'Sie haben keinen Zugriff auf diesen Button.' });
    }
    
    // Lösche zuerst die Berechtigungen des Buttons
    await pool.query(
      'DELETE FROM button_permissions WHERE button_id = $1',
      [buttonId]
    );
    
    // Lösche dann den Button
    await pool.query(
      'DELETE FROM custom_buttons WHERE id = $1',
      [buttonId]
    );
    
    console.log(`Button ${buttonId} erfolgreich gelöscht`);
    
    res.json({ message: 'Button erfolgreich gelöscht.' });
  } catch (error) {
    console.error('Delete button error:', error);
    res.status(500).json({ message: 'Fehler beim Löschen des Buttons.' });
  }
});

export default router;
