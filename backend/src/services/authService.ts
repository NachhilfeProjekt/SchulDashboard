import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import pool from '../config/database';
import { sendEmail } from './emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export const generateToken = (userId: string, role: string, locations: string[]): string => {
  return jwt.sign(
    { userId, role, locations },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const verifyToken = (token: string): { userId: string; role: string; locations: string[] } => {
  return jwt.verify(token, JWT_SECRET) as { userId: string; role: string; locations: string[] };
};

export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (!user.rows[0]) return false;

  const token = uuidv4();
  const expires = new Date();
  expires.setHours(expires.getHours() + 1);

  await pool.query(
    'UPDATE users SET temporary_token = $1, temporary_token_expires = $2 WHERE id = $3',
    [token, expires, user.rows[0].id]
  );

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  await sendEmail({
    to: email,
    from: process.env.EMAIL_FROM || 'noreply@dashboard.com',
    subject: 'Passwort zurücksetzen',
    text: `Klicken Sie auf diesen Link, um Ihr Passwort zurückzusetzen: ${resetUrl}`
  });

  return true;
};

export const sendTemporaryPasswordEmail = async (email: string, temporaryPassword: string): Promise<void> => {
  const loginUrl = `${process.env.FRONTEND_URL}/login`;
  
  await sendEmail({
    to: email,
    from: process.env.EMAIL_FROM || 'noreply@dashboard.com',
    subject: 'Ihr temporäres Passwort',
    text: `Ihr temporäres Passwort lautet: ${temporaryPassword}\n\nBitte melden Sie sich unter ${loginUrl} an und ändern Sie Ihr Passwort.`
  });
};