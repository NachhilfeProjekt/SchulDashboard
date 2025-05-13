import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { sendEmail } from './emailService';

export const generateToken = (userId: string, role: string, locations: string[]): string => {
  return jwt.sign(
    { userId, role, locations },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
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

  await sendEmail({
    to: email,
    from: process.env.EMAIL_FROM!,
    subject: 'Password Reset',
    text: `Reset link: ${process.env.FRONTEND_URL}/reset-password?token=${token}`
  });

  return true;
};
