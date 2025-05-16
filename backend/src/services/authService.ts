// backend/src/services/authService.ts
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../models/User';
import { sendEmail } from './emailService';
import pool from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export const generateToken = (userId: string, role: UserRole, locations: string[]): string => {
  const payload = {
    userId,
    role,
    locations
  };
  
  console.log(`Generiere Token mit Payload:`, payload);
  
  return jwt.sign(
  payload,
  JWT_SECRET as jwt.Secret,
  { expiresIn: JWT_EXPIRES_IN }
);
};

export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
    const client = await pool.connect();
    
    const userResult = await client.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return false;
    }
    
    const token = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);
    
    await client.query(
      'UPDATE users SET temporary_token = $1, temporary_token_expires = $2 WHERE email = $3',
      [token, expires, email]
    );
    
    client.release();
    
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    await sendEmail({
      to: email,
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      subject: 'Passwort zurücksetzen',
      text: `Bitte klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen: ${resetUrl}`,
      html: `<p>Bitte klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
    });
    
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

export const sendTemporaryPasswordEmail = async (email: string, tempPassword: string): Promise<void> => {
  await sendEmail({
    to: email,
    from: process.env.EMAIL_FROM || 'noreply@example.com',
    subject: 'Ihr temporäres Passwort',
    text: `Ihr temporäres Passwort lautet: ${tempPassword}. Bitte ändern Sie es sofort nach dem ersten Anmelden.`,
    html: `<p>Ihr temporäres Passwort lautet: <strong>${tempPassword}</strong></p><p>Bitte ändern Sie es sofort nach dem ersten Anmelden.</p>`
  });
  export const generateToken = (userId: string, role: UserRole, email: string, locations: string[]): string => {
  const payload = {
    userId,
    role,
    email,
    locations
  };
  
  return jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};
};
