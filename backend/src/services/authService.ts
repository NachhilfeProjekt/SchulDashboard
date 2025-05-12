import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/User';
import { sendEmail } from './emailService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export const generateToken = (
  userId: string,
  email: string,
  role: string,
  locations: string[]
): string => {
  return jwt.sign(
    { userId, email, role, locations },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};
