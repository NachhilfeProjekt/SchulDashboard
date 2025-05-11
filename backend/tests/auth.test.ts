import request from 'supertest';
import app from '../src/app';
import pool from '../src/config/database';
import { createUser } from '../src/models/User';

describe('Auth API', () => {
  beforeAll(async () => {
    await pool.query('DELETE FROM users WHERE email != $1', ['admin@example.com']);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/auth/login', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'test123',
      role: 'teacher'
    };

    beforeAll(async () => {
      await createUser(testUser.email, testUser.password, testUser.role, [], '11111111-1111-1111-1111-111111111111');
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toContain('Anmeldung fehlgeschlagen');
    });
  });
});