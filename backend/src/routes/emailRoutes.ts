import express from 'express';
import { authenticate, authorize, checkLocationAccess } from '../middleware/authMiddleware';
import { getEmailTemplates, createEmailTemplate, sendBulkEmails } from '../models/User';

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

export default router;