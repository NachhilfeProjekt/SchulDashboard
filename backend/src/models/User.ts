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

// Aktualisiere in backend/src/models/User.ts die getButtonsForUser-Funktion
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

export const UserModel = {
  createUser,
  getUserByEmail,
  getUserById,
  getUsersByLocation,
  getUserLocations,
  comparePasswords,
  createTemporaryToken,
  resetPassword
// Füge in src/models/User.ts in der getButtonsForUser-Funktion Debug-Ausgaben hinzu
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
      const result = await pool.query(query, [locationId, user.role, userId]);
      console.log(`Role-based Query lieferte ${result.rows.length} Buttons`);
      return result.rows;
    }
  } catch (error) {
    console.error(`Fehler beim Abrufen der Buttons für den Benutzer: ${error}`);
    throw error;
  }
};
};
