import pool from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../services/emailService';

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

export const createUser = async (email: string, password: string, role: string, locations: string[], createdBy: string): Promise<User> => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = uuidv4();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create user
    const userQuery = `
      INSERT INTO users (id, email, password, role, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`;
    const userValues = [userId, email, hashedPassword, role, createdBy];
    const userResult = await client.query(userQuery, userValues);
    const user = userResult.rows[0];

    // Add user locations
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
    throw error;
  } finally {
    client.release();
  }
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

export const getUserById = async (id: string): Promise<User | null> => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
};

export const comparePasswords = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const createTemporaryToken = async (email: string): Promise<string> => {
  const token = uuidv4();
  const expires = new Date();
  expires.setHours(expires.getHours() + 1);

  await pool.query(
    'UPDATE users SET temporary_token = $1, temporary_token_expires = $2 WHERE email = $3',
    [token, expires, email]
  );

  return token;
};

export const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
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
};

export const getUserLocations = async (userId: string): Promise<Location[]> => {
  const result = await pool.query(
    `SELECT l.* FROM locations l
     JOIN user_locations ul ON l.id = ul.location_id
     WHERE ul.user_id = $1`,
    [userId]
  );
  return result.rows;
};

export const getUsersByLocation = async (locationId: string): Promise<User[]> => {
  const result = await pool.query(
    `SELECT u.* FROM users u
     JOIN user_locations ul ON u.id = ul.user_id
     WHERE ul.location_id = $1`,
    [locationId]
  );
  return result.rows;
};

export const createLocation = async (name: string, createdBy: string): Promise<Location> => {
  const result = await pool.query(
    'INSERT INTO locations (id, name, created_by) VALUES ($1, $2, $3) RETURNING *',
    [uuidv4(), name, createdBy]
  );
  return result.rows[0];
};

export const getLocations = async (): Promise<Location[]> => {
  const result = await pool.query('SELECT * FROM locations ORDER BY name');
  return result.rows;
};

export const createCustomButton = async (name: string, url: string, locationId: string, createdBy: string): Promise<CustomButton> => {
  const result = await pool.query(
    `INSERT INTO custom_buttons (id, name, url, location_id, created_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [uuidv4(), name, url, locationId, createdBy]
  );
  return result.rows[0];
};

export const getButtonsForUser = async (userId: string, locationId: string): Promise<CustomButton[]> => {
  const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
  const userRole = userResult.rows[0]?.role;

  if (userRole === 'developer') {
    // Developer can see all buttons for the location
    const result = await pool.query(
      `SELECT * FROM custom_buttons 
       WHERE location_id = $1
       ORDER BY name`,
      [locationId]
    );
    return result.rows;
  } else {
    // Others can see buttons based on permissions
    const result = await pool.query(
      `SELECT cb.* FROM custom_buttons cb
       LEFT JOIN button_permissions bp ON cb.id = bp.button_id
       WHERE cb.location_id = $1 AND 
             (bp.role = $2 OR bp.user_id = $3 OR cb.created_by = $3)
       ORDER BY cb.name`,
      [locationId, userRole, userId]
    );
    return result.rows;
  }
};

export const setButtonPermissions = async (buttonId: string, permissions: {role?: string, userId?: string}[]): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Delete existing permissions for this button
    await client.query('DELETE FROM button_permissions WHERE button_id = $1', [buttonId]);
    
    // Insert new permissions
    for (const perm of permissions) {
      if (perm.role || perm.userId) {
        await client.query(
          `INSERT INTO button_permissions (button_id, role, user_id)
           VALUES ($1, $2, $3)`,
          [buttonId, perm.role, perm.userId]
        );
      }
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getEmailTemplates = async (locationId: string): Promise<any[]> => {
  const result = await pool.query(
    'SELECT * FROM email_templates WHERE location_id = $1 ORDER BY name',
    [locationId]
  );
  return result.rows;
};

export const createEmailTemplate = async (name: string, subject: string, body: string, locationId: string, createdBy: string): Promise<any> => {
  const result = await pool.query(
    `INSERT INTO email_templates (id, name, subject, body, location_id, created_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [uuidv4(), name, subject, body, locationId, createdBy]
  );
  return result.rows[0];
};

export const sendBulkEmails = async (recipients: {email: string, name: string}[], templateId: string, sender: string): Promise<void> => {
  const templateResult = await pool.query('SELECT * FROM email_templates WHERE id = $1', [templateId]);
  const template = templateResult.rows[0];
  
  if (!template) throw new Error('Template not found');
  
  for (const recipient of recipients) {
    // Replace placeholders in template
    let subject = template.subject.replace('{{name}}', recipient.name);
    let body = template.body.replace('{{name}}', recipient.name);
    
    // Send email (implementation depends on your email service)
    await sendEmail({
      to: recipient.email,
      from: sender,
      subject,
      text: body
    });
    
    // Log the email sending
    await pool.query(
      `INSERT INTO sent_emails (id, recipient_email, recipient_name, template_id, sender, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), recipient.email, recipient.name, templateId, sender, 'sent']
    );
  }
};
