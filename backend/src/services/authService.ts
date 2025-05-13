import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../models/User';
import { sendEmail } from './emailService';
import { pool } from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export const AuthService = {
  generateToken: (userId: string, role: UserRole, locations: string[]): string => {
    return jwt.sign(
      { userId, role, locations },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  },

  sendPasswordResetEmail: async (email: string): Promise<boolean> => {
    // Implementierung
  },

  sendTemporaryPasswordEmail: async (email: string, tempPassword: string): Promise<void> => {
    // Implementierung
  }
};
