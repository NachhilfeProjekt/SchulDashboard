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

interface UserLocation {
  userId: string;
  locationId: string;
}

interface Location {
  id: string;
  name: string;
  createdAt: Date;
}

interface CustomButton {
  id: string;
  name: string;
  url: string;
  locationId: string;
  createdBy: string;
  createdAt: Date;
}

interface ButtonPermission {
  buttonId: string;
  role?: string;
  userId?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  locationId: string;
  createdAt: Date;
}

interface SentEmail {
  id: string;
  recipient_email: string;
  recipient_name: string;
  status: 'sent' | 'failed' | 'resent';
  sent_at: Date;
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
    throw error;
  } finally {
    client.release();
  }
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email]);
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
export {
  createUser,
  getUserByEmail,
  getUserById,
  comparePasswords,
  createTemporaryToken,
  resetPassword,
  getUsersByLocation,
  getLocations,
  createLocation,
  getUserLocations,
  createCustomButton,
  getButtonsForUser,
  setButtonPermissions,
  getEmailTemplates,
  createEmailTemplate,
  sendBulkEmails,
  UserRole
};
