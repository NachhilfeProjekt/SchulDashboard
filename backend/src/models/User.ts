// backend/src/models/User.ts
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import { sendEmail } from '../services/emailService';
import pool from '../config/database';
import logger from '../config/logger';

export enum UserRole {
  DEVELOPER = 'developer',
  LEAD = 'lead',
  OFFICE = 'office',
  TEACHER = 'teacher'
}

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  is_active: boolean;
  created_by?: string;
  deactivated_by?: string;
  deactivated_at?: Date;
  createdAt: Date;
  updatedAt: Date;
  temporaryToken?: string;
  temporaryTokenExpires?: Date;
}

export interface Location {
  id: string;
  name: string;
  created_by: string;
  created_at: Date;
}

export interface CustomButton {
  id: string;
  name: string;
  url: string;
  location_id: string;
  created_by: string;
  created_at: Date;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  location_id: string;
  created_by: string;
  created_at: Date;
}

export const createUser = async (email: string, password: string, role: string, locations: string[], createdBy: string): Promise<User> => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = uuidv4();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const userQuery = `
      INSERT INTO users (id, email, password, role, created_by, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *`;
    const userValues = [userId, email, hashedPassword, role, createdBy];
    const userResult = await client.query(userQuery, userValues);
    const user = userResult.rows[0];

    for (const locationId of locations) {
      const locationQuery = `
        INSERT INTO user_locations (user_id, location_id)
        VALUES ($1, $2)`;
      await client.query(locationQuery, [userId, locationId]);
    }

    await client.query('COMMIT');
    return user;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Fehler beim Erstellen des Benutzers: ${error}`);
    throw error;
  } finally {
    client.release();
  }
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error(`Fehler beim Abrufen des Benutzers nach E-Mail: ${error}`);
    throw error;
  }
};

export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error(`Fehler beim Abrufen des Benutzers nach ID: ${error}`);
    throw error;
  }
};

export const getUsersByLocation = async (locationId: string): Promise<User[]> => {
  try {
    const query = `
      SELECT u.* FROM users u
      JOIN user_locations ul ON u.id = ul.user_id
      WHERE ul.location_id = $1 AND u.is_active = true`;
    
    const result = await pool.query(query, [locationId]);
    return result.rows;
  } catch (error) {
    logger.error(`Fehler beim Abrufen der Benutzer nach Standort: ${error}`);
    throw error;
  }
};

export const getUserLocations = async (userId: string): Promise<Location[]> => {
  try {
    const query = `
      SELECT l.* FROM locations l
      JOIN user_locations ul ON l.id = ul.location_id
      WHERE ul.user_id = $1`;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    logger.error(`Fehler beim Abrufen der Standorte des Benutzers: ${error}`);
    throw error;
  }
};

export const getLocations = async (): Promise<Location[]> => {
  try {
    const result = await pool.query('SELECT * FROM locations');
    return result.rows;
  } catch (error) {
    logger.error(`Fehler beim Abrufen aller Standorte: ${error}`);
    throw error;
  }
};

export const createLocation = async (name: string, createdBy: string): Promise<Location> => {
  try {
    const query = `
      INSERT INTO locations (name, created_by)
      VALUES ($1, $2)
      RETURNING *`;
    
    const result = await pool.query(query, [name, createdBy]);
    return result.rows[0];
  } catch (error) {
    logger.error(`Fehler beim Erstellen des Standorts: ${error}`);
    throw error;
  }
};

export const comparePasswords = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const createTemporaryToken = async (email: string): Promise<string> => {
  try {
    const token = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    await pool.query(
      'UPDATE users SET temporary_token = $1, temporary_token_expires = $2 WHERE email = $3',
      [token, expires, email]
    );

    return token;
  } catch (error) {
    logger.error(`Fehler beim Erstellen des temporären Tokens: ${error}`);
    throw error;
  }
};

export const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
  try {
    const userResult = await pool.query(
      'SELECT * FROM users WHERE temporary_token = $1 AND temporary_token_expires > NOW()',
      [token]
    );

    if (!userResult.rows[0]) return false;

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = $1, temporary_token = NULL, temporary_token_expires = NULL WHERE id = $2',
      [hashedPassword, userResult.rows[0].id]
    );

    return true;
  } catch (error) {
    logger.error(`Fehler beim Zurücksetzen des Passworts: ${error}`);
    throw error;
  }
};

export const getButtonsForUser = async (userId: string, locationId: string): Promise<CustomButton[]> => {
  try {
    console.log(`getButtonsForUser aufgerufen mit userId=${userId}, locationId=${locationId}`);
    
    const user = await getUserById(userId);
    if (!user) {
      console.log('Benutzer nicht gefunden');
      throw new Error('Benutzer nicht gefunden');
    }
    
    console.log(`Benutzer gefunden: role=${user.role}`);
    
    let query = '';
    
    if (user.role === 'developer') {
      // Developers see all buttons for the location
      query = `
        SELECT * FROM custom_buttons
        WHERE location_id = $1
        ORDER BY name`;
      
      console.log('Verwende Developer-Query');
      const result = await pool.query(query, [locationId]);
      console.log(`Developer-Query lieferte ${result.rows.length} Buttons`);
      
      // Wenn keine Buttons gefunden wurden, füge einen Test-Button hinzu
      if (result.rows.length === 0) {
        console.log('Keine Buttons gefunden, erstelle Test-Button');
        try {
          const insertResult = await pool.query(`
            INSERT INTO custom_buttons (name, url, location_id, created_by)
            VALUES ('Test-Button', 'https://example.com', $1, $2)
            RETURNING *
          `, [locationId, userId]);
          
          // Berechtigungen hinzufügen
          await pool.query(`
            INSERT INTO button_permissions (button_id, role)
            VALUES ($1, 'developer'), ($1, 'lead'), ($1, 'office'), ($1, 'teacher')
          `, [insertResult.rows[0].id]);
          
          console.log('Test-Button erstellt:', insertResult.rows[0]);
          return [insertResult.rows[0]];
        } catch (err) {
          console.error('Fehler beim Erstellen des Test-Buttons:', err);
        }
      }
      
      return result.rows;
    } else {
      // Other users see buttons based on their role or specific permissions
      query = `
        SELECT cb.* FROM custom_buttons cb
        LEFT JOIN button_permissions bp ON cb.id = bp.button_id
        WHERE cb.location_id = $1
        AND (
          bp.role = $2
          OR bp.user_id = $3
        )
        ORDER BY cb.name`;
      
      console.log('Verwende Role-based Query');
      console.log(`Parameter: locationId=${locationId}, role=${user.role}, userId=${userId}`);
      const result = await pool.query(query, [locationId, user.role, userId]);
      console.log(`Role-based Query lieferte ${result.rows.length} Buttons`);
      return result.rows;
    }
  } catch (error) {
    console.error(`Fehler beim Abrufen der Buttons für den Benutzer: ${error}`);
    throw error;
  }
};

export const createCustomButton = async (name: string, url: string, locationId: string, createdBy: string): Promise<CustomButton> => {
  try {
    const query = `
      INSERT INTO custom_buttons (name, url, location_id, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *`;
    
    const result = await pool.query(query, [name, url, locationId, createdBy]);
    return result.rows[0];
  } catch (error) {
    logger.error(`Fehler beim Erstellen des Buttons: ${error}`);
    throw error;
  }
};

export const setButtonPermissions = async (buttonId: string, permissions: { roles?: string[], users?: string[] }): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Delete existing permissions
    await client.query('DELETE FROM button_permissions WHERE button_id = $1', [buttonId]);
    
    // Add role permissions
    if (permissions.roles?.length) {
      for (const role of permissions.roles) {
        await client.query(
          'INSERT INTO button_permissions (button_id, role) VALUES ($1, $2)',
          [buttonId, role]
        );
      }
    }
    
    // Add user permissions
    if (permissions.users?.length) {
      for (const userId of permissions.users) {
        await client.query(
          'INSERT INTO button_permissions (button_id, user_id) VALUES ($1, $2)',
          [buttonId, userId]
        );
      }
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Fehler beim Setzen der Button-Berechtigungen: ${error}`);
    throw error;
  } finally {
    client.release();
  }
};

export const getEmailTemplates = async (locationId: string): Promise<EmailTemplate[]> => {
  try {
    const query = `
      SELECT * FROM email_templates
      WHERE location_id = $1
      ORDER BY name`;
    
    const result = await pool.query(query, [locationId]);
    return result.rows;
  } catch (error) {
    logger.error(`Fehler beim Abrufen der E-Mail-Vorlagen: ${error}`);
    throw error;
  }
};

export const createEmailTemplate = async (
  name: string,
  subject: string,
  body: string,
  locationId: string,
  createdBy: string
): Promise<EmailTemplate> => {
  try {
    const query = `
      INSERT INTO email_templates (name, subject, body, location_id, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`;
    
    const result = await pool.query(query, [name, subject, body, locationId, createdBy]);
    return result.rows[0];
  } catch (error) {
    logger.error(`Fehler beim Erstellen der E-Mail-Vorlage: ${error}`);
    throw error;
  }
};

// Füge diese Funktion zum Löschen von Buttons hinzu
export const deleteButton = async (buttonId: string): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Lösche zuerst die Berechtigungen
    await client.query('DELETE FROM button_permissions WHERE button_id = $1', [buttonId]);
    
    // Lösche dann den Button
    await client.query('DELETE FROM custom_buttons WHERE id = $1', [buttonId]);
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Fehler beim Löschen des Buttons: ${error}`);
    throw error;
  } finally {
    client.release();
  }
};

export const sendBulkEmails = async (
  recipients: Array<{ email: string, name: string }>,
  templateId: string,
  senderEmail: string
): Promise<void> => {
  // Get the template
  const templateQuery = 'SELECT * FROM email_templates WHERE id = $1';
  const templateResult = await pool.query(templateQuery, [templateId]);
  const template = templateResult.rows[0];
  
  if (!template) {
    throw new Error('E-Mail-Vorlage nicht gefunden');
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const recipient of recipients) {
      // Record the email in the database
      const recordQuery = `
        INSERT INTO sent_emails (recipient_email, recipient_name, template_id, sender, subject, body, status, location_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id`;
      
      const recordResult = await client.query(
        recordQuery,
        [recipient.email, recipient.name, templateId, senderEmail, template.subject, template.body, 'sent', template.location_id]
      );
      
      // Send the email
      try {
        await sendEmail({
          to: recipient.email,
          from: process.env.EMAIL_FROM || senderEmail,
          subject: template.subject,
          text: template.body,  // Add personalization logic here if needed
          html: template.body   // Add HTML formatting and personalization logic here
        });
      } catch (emailError) {
        logger.error(`Fehler beim Senden der E-Mail an ${recipient.email}: ${emailError}`);
        
        // Update email status to failed
        await client.query(
          'UPDATE sent_emails SET status = $1 WHERE id = $2',
          ['failed', recordResult.rows[0].id]
        );
      }
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Fehler beim Bulk-Versand von E-Mails: ${error}`);
    throw error;
  } finally {
    client.release();
  }
};

// Get location by ID
export const getLocationById = async (locationId: string): Promise<Location | null> => {
  try {
    const result = await pool.query('SELECT * FROM locations WHERE id = $1', [locationId]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error(`Fehler beim Abrufen des Standorts nach ID: ${error}`);
    throw error;
  }
};

// Delete location
export const deleteLocation = async (locationId: string): Promise<boolean> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // First check if the location is used by any users
    const userCheck = await client.query(
      'SELECT COUNT(*) FROM user_locations WHERE location_id = $1',
      [locationId]
    );
    
    if (parseInt(userCheck.rows[0].count) > 0) {
      throw new Error('Location is still associated with users');
    }
    
    // Check if the location has buttons
    const buttonCheck = await client.query(
      'SELECT COUNT(*) FROM custom_buttons WHERE location_id = $1',
      [locationId]
    );
    
    if (parseInt(buttonCheck.rows[0].count) > 0) {
      throw new Error('Location is still associated with buttons');
    }
    
    // Check if the location has email templates
    const emailCheck = await client.query(
      'SELECT COUNT(*) FROM email_templates WHERE location_id = $1',
      [locationId]
    );
    
    if (parseInt(emailCheck.rows[0].count) > 0) {
      throw new Error('Location is still associated with email templates');
    }
    
    // If we get here, we can safely delete the location
    const result = await client.query(
      'DELETE FROM locations WHERE id = $1 RETURNING id',
      [locationId]
    );
    
    await client.query('COMMIT');
    
    return result.rows.length > 0;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`Fehler beim Löschen des Standorts: ${error}`);
    throw error;
  } finally {
    client.release();
  }
};

// Benutzer deaktivieren
export const deactivateUser = async (userId: string, deactivatedBy: string): Promise<boolean> => {
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update the user's is_active status
      const updateResult = await client.query(
        'UPDATE users SET is_active = false, deactivated_by = $1, deactivated_at = NOW() WHERE id = $2 RETURNING id',
        [deactivatedBy, userId]
      );
      
      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Fehler beim Deaktivieren des Benutzers: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error(`Fehler beim Deaktivieren des Benutzers: ${error}`);
    throw error;
  }
};

// Benutzer reaktivieren
export const reactivateUser = async (userId: string, reactivatedBy: string): Promise<boolean> => {
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Überprüfen, ob der Benutzer deaktiviert ist
      const checkResult = await client.query(
        'SELECT * FROM users WHERE id = $1 AND is_active = false',
        [userId]
      );
      
      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return false; // Benutzer existiert nicht oder ist bereits aktiv
      }
      
      // Update the user's is_active status
      const updateResult = await client.query(
        'UPDATE users SET is_active = true, deactivated_by = NULL, deactivated_at = NULL, updated_at = NOW() WHERE id = $1 RETURNING id',
        [userId]
      );
      
      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }
      
      // Log reactivation event
      await client.query(
        'INSERT INTO user_activity_log (user_id, action, performed_by, performed_at) VALUES ($1, $2, $3, NOW())',
        [userId, 'reactivated', reactivatedBy]
      );
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Fehler beim Reaktivieren des Benutzers: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error(`Fehler beim Reaktivieren des Benutzers: ${error}`);
    throw error;
  }
};

// Benutzer permanent löschen
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Überprüfen, ob Benutzer existiert
      const userCheck = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );
      
      if (userCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }
      
      // Entferne Benutzer aus allen Standorten
      await client.query(
        'DELETE FROM user_locations WHERE user_id = $1',
        [userId]
      );
      
      // Entferne Button-Berechtigungen für den Benutzer
      await client.query(
        'DELETE FROM button_permissions WHERE user_id = $1',
        [userId]
      );
      
      // Lösche den Benutzer
      const deleteResult = await client.query(
        'DELETE FROM users WHERE id = $1 RETURNING id',
        [userId]
      );
      
      if (deleteResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Fehler beim permanenten Löschen des Benutzers: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error(`Fehler beim permanenten Löschen des Benutzers: ${error}`);
    throw error;
  }
};

// Deaktivierte Benutzer abrufen
export const getDeactivatedUsers = async (): Promise<User[]> => {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE is_active = false ORDER BY email'
    );
    return result.rows;
  } catch (error) {
    logger.error(`Fehler beim Abrufen deaktivierter Benutzer: ${error}`);
    throw error;
  }
};

// Benutzeraktivitätsprotokoll abrufen
export const getUserActivityLog = async (userId: string): Promise<any[]> => {
  try {
    const result = await pool.query(
      `SELECT ual.*, 
              u.email as performed_by_email 
       FROM user_activity_log ual
       LEFT JOIN users u ON ual.performed_by = u.id
       WHERE ual.user_id = $1
       ORDER BY ual.performed_at DESC`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    logger.error(`Fehler beim Abrufen des Benutzeraktivitätsprotokolls: ${error}`);
    throw error;
  }
};

// Ergänzungen für /backend/src/models/User.ts - Fügen Sie diese neue Funktion hinzu

// Benutzer zu einem Standort einladen
export const inviteUserToLocation = async (userId: string, locationId: string): Promise<boolean> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Prüfen, ob Benutzer existiert
    const userCheck = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      throw new Error('Benutzer nicht gefunden');
    }
    
    // Prüfen, ob Standort existiert
    const locationCheck = await client.query('SELECT * FROM locations WHERE id = $1', [locationId]);
    if (locationCheck.rows.length === 0) {
      throw new Error('Standort nicht gefunden');
    }
    
    // Prüfen, ob der Benutzer bereits diesem Standort zugeordnet ist
    const existingCheck = await client.query(
      'SELECT * FROM user_locations WHERE user_id = $1 AND location_id = $2',
      [userId, locationId]
    );
    if (existingCheck.rows.length > 0) {
      throw new Error('Der Benutzer ist bereits diesem Standort zugeordnet');
    }
    
    // Reaktiviere den Benutzer, falls er deaktiviert ist
    const user = userCheck.rows[0];
    if (!user.is_active) {
      await client.query(
        'UPDATE users SET is_active = true, deactivated_by = NULL, deactivated_at = NULL WHERE id = $1',
        [userId]
      );
    }
    
    // Standort für Benutzer hinzufügen
    await client.query(
      'INSERT INTO user_locations (user_id, location_id) VALUES ($1, $2)',
      [userId, locationId]
    );
    
    // Aktivität protokollieren
    await client.query(
      'INSERT INTO user_activity_log (user_id, action, details) VALUES ($1, $2, $3)',
      [userId, 'invited_to_location', JSON.stringify({ locationId, locationName: locationCheck.rows[0].name })]
    );
    
    await client.query('COMMIT');
    
    // E-Mail-Benachrichtigung senden
    try {
      await sendInvitationEmail(user.email, locationCheck.rows[0].name);
    } catch (emailError) {
      logger.error(`Failed to send invitation email: ${emailError}`);
      // Wir setzen den Erfolg trotzdem fort, auch wenn die E-Mail fehlschlägt
    }
    
    return true;
  } catch (error) {
    await
  };

export const UserModel = {
  createUser,
  getUserByEmail,
  getUserById,
  getUsersByLocation,
  getUserLocations,
  comparePasswords,
  createTemporaryToken,
  resetPassword
};
