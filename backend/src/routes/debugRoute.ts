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

// Endpunkt zum Überprüfen der Buttons
router.get('/check-buttons', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM custom_buttons');
    
    res.json({
      message: 'Buttons in der Datenbank',
      count: result.rows.length,
      buttons: result.rows
    });
  } catch (error) {
    res.status(500).json({
      message: 'Fehler beim Abrufen der Buttons',
      error: error.message
    });
  }
});

// Endpunkt zum Erstellen eines Test-Buttons
router.get('/create-test-button', async (req, res) => {
  try {
    const adminId = '11111111-1111-1111-1111-111111111111';
    const locationId = '22222222-2222-2222-2222-222222222222';
    
    const result = await pool.query(`
      INSERT INTO custom_buttons (name, url, location_id, created_by)
      VALUES ('Test-Button', 'https://example.com', $1, $2)
      RETURNING *
    `, [locationId, adminId]);
    
    // Berechtigungen hinzufügen
    await pool.query(`
      INSERT INTO button_permissions (button_id, role)
      VALUES ($1, 'teacher'), ($1, 'office'), ($1, 'lead'), ($1, 'developer')
    `, [result.rows[0].id]);
    
    res.json({
      message: 'Test-Button erfolgreich erstellt',
      button: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      message: 'Fehler beim Erstellen des Test-Buttons',
      error: error.message
    });
  }
});

// Endpunkt zum Überprüfen/Korrigieren der Fremdschlüssel
router.get('/fix-relations', async (req, res) => {
  try {
    // Überprüfen, ob die Tabellen existieren
    const tablesQuery = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tables = tablesQuery.rows.map(row => row.table_name);
    
    // Überprüfen, ob die erforderlichen Tabellen vorhanden sind
    const requiredTables = ['users', 'locations', 'user_locations', 'custom_buttons', 'button_permissions'];
    const missingTables = requiredTables.filter(table => !tables.includes(table));
    
    if (missingTables.length > 0) {
      return res.json({
        message: 'Fehlende Tabellen',
        missingTables
      });
    }
    
    // Jetzt prüfen wir die Inhalte der Tabellen
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    const locationsCount = await pool.query('SELECT COUNT(*) FROM locations');
    const userLocationsCount = await pool.query('SELECT COUNT(*) FROM user_locations');
    const buttonsCount = await pool.query('SELECT COUNT(*) FROM custom_buttons');
    const buttonPermissionsCount = await pool.query('SELECT COUNT(*) FROM button_permissions');
    
    res.json({
      message: 'Datenbank-Tabellen überprüft',
      tables,
      counts: {
        users: parseInt(usersCount.rows[0].count),
        locations: parseInt(locationsCount.rows[0].count),
        userLocations: parseInt(userLocationsCount.rows[0].count),
        buttons: parseInt(buttonsCount.rows[0].count),
        buttonPermissions: parseInt(buttonPermissionsCount.rows[0].count)
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Fehler beim Überprüfen der Datenbank-Relationen',
      error: error.message
    });
  }
});

// Überprüfung der Datenbankverbindung
router.get('/db-connection', async (req, res) => {
  try {
    const startTime = Date.now();
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as now');
    const endTime = Date.now();
    client.release();
    
    res.json({
      status: 'connected',
      server_time: result.rows[0].now,
      response_time_ms: endTime - startTime,
      database_info: {
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        ssl_enabled: process.env.DB_SSL === 'true'
      }
    });
  } catch (error) {
    logger.error(`Datenbankverbindungsfehler im Debug-Endpunkt: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: `Datenbankverbindungsfehler: ${error.message}`,
      error_code: error.code,
      error_detail: process.env.NODE_ENV === 'production' ? undefined : error.detail
    });
  }
});

// Systeminfo
router.get('/system', (req, res) => {
  res.json({
    node_version: process.version,
    platform: process.platform,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
    api_url: process.env.API_URL || 'not set',
    frontend_url: process.env.FRONTEND_URL
  });
});

// Tabellenstatus
router.get('/tables-status', async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Get table counts
    const tableQueries = [
      'SELECT COUNT(*) FROM users',
      'SELECT COUNT(*) FROM locations',
      'SELECT COUNT(*) FROM user_locations',
      'SELECT COUNT(*) FROM custom_buttons',
      'SELECT COUNT(*) FROM button_permissions',
      'SELECT COUNT(*) FROM email_templates',
      'SELECT COUNT(*) FROM sent_emails',
      'SELECT COUNT(*) FROM user_activity_log',
      'SELECT COUNT(*) FROM location_invitations'
    ];
    
    const results = await Promise.all(
      tableQueries.map(query => client.query(query).catch(err => ({ rows: [{ count: 'ERROR' }], error: err.message })))
    );
    
    client.release();
    
    res.json({
      tables: {
        users: results[0].rows[0].count,
        locations: results[1].rows[0].count,
        user_locations: results[2].rows[0].count,
        custom_buttons: results[3].rows[0].count,
        button_permissions: results[4].rows[0].count,
        email_templates: results[5].rows[0].count,
        sent_emails: results[6].rows[0].count,
        user_activity_log: results[7].rows[0].count,
        location_invitations: results[8].rows[0].count
      }
    });
  } catch (error) {
    logger.error(`Fehler beim Abrufen der Tabelleninformationen: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: `Fehler: ${error.message}`
    });
  }
}); // Hier fehlte die schließende geschweifte Klammer

export default router;
