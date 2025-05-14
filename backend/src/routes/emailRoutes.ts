// backend/src/routes/emailRoutes.ts
import express from 'express';
import { authenticate, authorize, checkLocationAccess } from '../middleware/authMiddleware';
import { getEmailTemplates, createEmailTemplate, sendBulkEmails } from '../models/User';
import pool from '../config/database';

const router = express.Router();

router.use(authenticate);

// Get email templates for a location
router.get('/templates/location/:locationId', checkLocationAccess, async (req, res) => {
  try {
    const templates = await getEmailTemplates(req.params.locationId);
    res.json(templates);
  } catch (error) {
    console.error('Get email templates error:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der E-Mail-Vorlagen.' });
  }
});

// Create new email template (only for leads and developers)
router.post('/templates', authorize(['developer', 'lead']), async (req, res) => {
  try {
    const { name, subject, body, locationId } = req.body;
    const template = await createEmailTemplate(name, subject, body, locationId, req.user.userId);
    res.status(201).json(template);
  } catch (error) {
    console.error('Create email template error:', error);
    res.status(500).json({ message: 'Fehler beim Erstellen der E-Mail-Vorlage.' });
  }
});

// Send bulk emails (only for leads and developers)
router.post('/send-bulk', authorize(['developer', 'lead']), async (req, res) => {
  try {
    const { recipients, templateId } = req.body;
    await sendBulkEmails(recipients, templateId, req.user.email);
    res.json({ message: 'E-Mails werden versendet.' });
  } catch (error) {
    console.error('Send bulk emails error:', error);
    res.status(500).json({ message: 'Fehler beim Versenden der E-Mails.' });
  }
});

// NEUE ROUTE: Get sent emails for a location
router.get('/sent', authenticate, async (req, res) => {
  try {
    const locationId = req.query.locationId as string;
    
    if (!locationId) {
      return res.status(400).json({ message: 'Standort-ID ist erforderlich' });
    }

    // Überprüfen, ob der Benutzer Zugriff auf diesen Standort hat
    if (req.user?.role !== 'developer' && !req.user?.locations.includes(locationId)) {
      return res.status(403).json({ message: 'Sie haben keinen Zugriff auf diesen Standort' });
    }

    const query = `
      SELECT * FROM sent_emails
      WHERE location_id = $1
      ORDER BY sent_at DESC`;
    
    const result = await pool.query(query, [locationId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get sent emails error:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der gesendeten E-Mails.' });
  }
});

// NEUE ROUTE: Resend failed emails
router.post('/resend', authorize(['developer', 'lead']), async (req, res) => {
  try {
    const { emailIds } = req.body;
    
    if (!Array.isArray(emailIds) || emailIds.length === 0) {
      return res.status(400).json({ message: 'E-Mail-IDs sind erforderlich' });
    }
    
    // Hier könntest du die E-Mails erneut versenden
    // Dies ist ein Platzhalter für die eigentliche Implementierung
    
    res.json({ message: 'E-Mails werden erneut versendet.' });
  } catch (error) {
    console.error('Resend emails error:', error);
    res.status(500).json({ message: 'Fehler beim erneuten Versenden der E-Mails.' });
  }
});

export default router;
