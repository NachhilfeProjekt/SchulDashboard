// backend/src/routes/debugRoute.ts
import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import jwt from 'jsonwebtoken';
import logger from '../config/logger';

const router = express.Router();

// Einfacher Endpunkt zum Testen der JWT-Funktionalität
router.get('/test-jwt', (req, res) => {
  try {
    const secret = process.env.JWT_SECRET || 'default-secret';
    const token = jwt.sign(
      { userId: 'test', role: 'developer', locations: ['test-location'] },
      secret,
      { expiresIn: '1h' }
    );
    
    res.json({ 
      token,
      decoded: jwt.verify(token, secret),
      message: 'JWT funktioniert korrekt'
    });
  } catch (error) {
    logger.error(`JWT-Test fehlgeschlagen: ${error.message}`);
    res.status(500).json({ 
      message: 'JWT-Test fehlgeschlagen',
      error: error.message
    });
  }
});

// Endpunkt zum Testen des Passwort-Hashes
router.get('/test-password', async (req, res) => {
  try {
    // Teste Standard-Hash mit admin123
    const standardHash = '$2a$10$xJwL5vxZz4iRt.J9X6hC.eGWXGZ7nR2V/cZ7oJ3WzFxzC4sY8zQ1K';
    const isStandardMatch = await bcrypt.compare('admin123', standardHash);
    
    // Generiere einen neuen Hash für admin123
    const newHash = await bcrypt.hash('admin123', 10);
    const isNewMatch = await bcrypt.compare('admin123', newHash);
    
    // Versuche, den aktuellen Hash aus der Datenbank zu lesen
    let dbHash = null;
    let dbHashTest = false;
    
    try {
      const result = await pool.query('SELECT password FROM users WHERE email = $1', ['admin@example.com']);
      if (result.rows.length > 0) {
        dbHash = result.rows[0].password;
        dbHashTest = await bcrypt.compare('admin123', dbHash);
      }
    } catch (dbError) {
      logger.error(`DB-Fehler: ${dbError.message}`);
    }
    
    res.json({
      standardHash,
      isStandardMatch,
      newHash,
      isNewMatch,
      dbHash,
      dbHashTest,
      message: 'Passwort-Hash-Test abgeschlossen'
    });
  } catch (error) {
    logger.error(`Passwort-Hash-Test fehlgeschlagen: ${error.message}`);
    res.status(500).json({ 
      message: 'Passwort-Hash-Test fehlgeschlagen',
      error: error.message
    });
  }
});

// Endpunkt zum Aktualisieren des Admin-Passworts
router.get('/reset-admin-password', async (req, res) => {
  try {
    // Neuer Hash für admin123
    const newHash = await bcrypt.hash('admin123', 10);
    
    // Aktualisiere das Passwort in der Datenbank
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email',
      [newHash, 'admin@example.com']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Admin-Benutzer nicht gefunden' });
    }
    
    logger.info(`Admin-Passwort zurückgesetzt für ${result.rows[0].email}`);
    
    res.json({
      message: 'Admin-Passwort erfolgreich zurückgesetzt',
      user: result.rows[0],
      newHash
    });
  } catch (error) {
    logger.error(`Admin-Passwort-Reset fehlgeschlagen: ${error.message}`);
    res.status(500).json({ 
      message: 'Admin-Passwort-Reset fehlgeschlagen',
      error: error.message
    });
  }
});

// Endpunkt zum Auflisten der Umgebungsvariablen (ohne sensible Daten)
router.get('/env', (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV || 'not set',
    port: process.env.PORT || 'not set',
    dbHost: process.env.DB_HOST ? 'set' : 'not set',
    dbName: process.env.DB_NAME ? 'set' : 'not set',
    dbUser: process.env.DB_USER ? 'set' : 'not set',
    dbPassword: process.env.DB_PASSWORD ? 'set (not shown)' : 'not set',
    jwtSecret: process.env.JWT_SECRET ? 'set (not shown)' : 'not set',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || 'not set',
    message: 'Umgebungsvariablen-Status'
  });
});

export default router;
