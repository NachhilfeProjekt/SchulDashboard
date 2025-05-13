import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { sendEmail } from './emailService';
import { UserRole } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export const generateToken = (userId: string, role: UserRole, locations: string[]): string => {
  return jwt.sign(
    { userId, role, locations },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const sendTemporaryPasswordEmail = async (email: string, temporaryPassword: string): Promise<void> => {
  await sendEmail({
    to: email,
    from: process.env.EMAIL_FROM || 'noreply@example.com',
    subject: 'Your Temporary Password',
    text: `Your temporary password: ${temporaryPassword}`
  });
};
