// backend/src/app.ts
import express from 'express';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import winston from 'winston';

// Lade Umgebungsvariablen
dotenv.config();

// Konfiguration des Loggers
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Datenbank-Konfiguration
const dbConfig = {
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Ausgabe der DB-Konfiguration (ohne Passwort)
logger.info(`Datenbank-Konfiguration: Host: ${dbConfig.host}, DB: ${dbConfig.database}, User: ${dbConfig.user}, SSL: ${dbConfig.ssl ? 'Enabled' : 'Disabled'}`);

// Datenbankverbindung initialisieren
const pool = new Pool(dbConfig);

// Verbindung testen
pool.connect((err, client, done) => {
  if (err) {
    logger.error('Fehler bei der Datenbankverbindung:', err);
    return;
  }
  logger.info('Datenbankverbindung erfolgreich hergestellt!');
  
  // Zeit aus der Datenbank abfragen
  client.query('SELECT NOW() as time', (err, res) => {
    done();
    if (err) {
      logger.error('Fehler bei der Datenbankabfrage:', err);
      return;
    }
    logger.info(`Datenbankzeit: ${res.rows[0].time}`);
    logger.info('Datenbank ist bereit für Anfragen.');
  });
});

// App initialisieren
const app = express();

// CORS-Konfiguration
const allowedOrigins = [
  'https://dashboard-frontend-p693.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000'
];

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Wenn kein Origin-Header (z.B. bei direkten Aufrufen) oder der Origin ist in der Liste
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation: Origin not allowed'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 Stunden in Sekunden
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// JWT Geheimnis
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware für die Authentifizierung
const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    // Benutzer aus der Datenbank abrufen
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Benutzer an Request anhängen
    req.user = result.rows[0];
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Routes

// Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Benutzer in der Datenbank suchen
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Passwort überprüfen
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Standorte des Benutzers abrufen
    const locationsResult = await pool.query(
      `SELECT l.* FROM locations l 
       JOIN user_locations ul ON l.id = ul.location_id 
       WHERE ul.user_id = $1 AND l.is_active = true`,
      [user.id]
    );
    
    // Benutzerstruktur für die Client-Antwort aufbauen
    const userForResponse = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      locations: locationsResult.rows
    };
    
    // Token generieren
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(200).json({
      token,
      user: userForResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Benutzerinfo abrufen
app.get('/api/users/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Benutzer aus der Datenbank abrufen (mit aktualisierten Daten)
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Standorte des Benutzers abrufen
    const locationsResult = await pool.query(
      `SELECT l.* FROM locations l 
       JOIN user_locations ul ON l.id = ul.location_id 
       WHERE ul.user_id = $1 AND l.is_active = true`,
      [userId]
    );
    
    // Benutzerstruktur für die Client-Antwort aufbauen
    const userForResponse = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      locations: locationsResult.rows
    };
    
    res.status(200).json(userForResponse);
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Standorte des Benutzers abrufen
app.get('/api/locations/user', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Standorte des Benutzers abrufen
    const locationsResult = await pool.query(
      `SELECT l.* FROM locations l 
       JOIN user_locations ul ON l.id = ul.location_id 
       WHERE ul.user_id = $1 AND l.is_active = true`,
      [userId]
    );
    
    res.status(200).json(locationsResult.rows);
  } catch (error) {
    console.error('Get user locations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Dashboard-Buttons abrufen
app.get('/api/dashboard/buttons', authMiddleware, (req, res) => {
  try {
    const role = req.user.role;
    
    // Basis-Buttons für alle Benutzer
    const baseButtons = [
      {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'Übersicht über alle wichtigen Informationen',
        icon: 'Dashboard',
        route: '/dashboard',
        color: '#2196f3'
      }
    ];
    
    // Spezifische Buttons je nach Rolle
    let roleSpecificButtons = [];
    
    if (role === 'teacher') {
      roleSpecificButtons = [
        {
          id: 'courses',
          title: 'Meine Kurse',
          description: 'Kurse anzeigen und verwalten',
          icon: 'School',
          route: '/courses',
          color: '#4caf50'
        },
        {
          id: 'calendar',
          title: 'Kalender',
          description: 'Termine und Unterrichtsstunden',
          icon: 'CalendarToday',
          route: '/calendar',
          color: '#ff9800'
        }
      ];
    } else if (role === 'office') {
      roleSpecificButtons = [
        {
          id: 'students',
          title: 'Schülerverwaltung',
          description: 'Schüler hinzufügen, bearbeiten und verwalten',
          icon: 'People',
          route: '/students',
          color: '#ff9800'
        },
        {
          id: 'invoices',
          title: 'Rechnungen',
          description: 'Rechnungsverwaltung und Übersicht',
          icon: 'Receipt',
          route: '/invoices',
          color: '#9c27b0'
        }
      ];
    } else if (role === 'manager' || role === 'admin') {
      roleSpecificButtons = [
        {
          id: 'users',
          title: 'Benutzerverwaltung',
          description: 'Benutzer hinzufügen, bearbeiten und verwalten',
          icon: 'People',
          route: '/users',
          color: '#f44336'
        },
        {
          id: 'locations',
          title: 'Standortverwaltung',
          description: 'Standorte verwalten und Benutzer zuweisen',
          icon: 'LocationOn',
          route: '/locations',
          color: '#2196f3'
        },
        {
          id: 'reports',
          title: 'Berichte',
          description: 'Berichte und Statistiken anzeigen',
          icon: 'Assessment',
          route: '/reports',
          color: '#673ab7'
        }
      ];
    } else if (role === 'developer') {
      roleSpecificButtons = [
        {
          id: 'users',
          title: 'Benutzerverwaltung',
          description: 'Benutzer hinzufügen, bearbeiten und verwalten',
          icon: 'People',
          route: '/manage-users',
          color: '#f44336'
        },
        {
          id: 'locations',
          title: 'Standortverwaltung',
          description: 'Standorte verwalten und Benutzer zuweisen',
          icon: 'LocationOn',
          route: '/locations',
          color: '#2196f3'
        },
        {
          id: 'settings',
          title: 'Systemeinstellungen',
          description: 'Globale Systemeinstellungen konfigurieren',
          icon: 'Settings',
          route: '/settings',
          color: '#607d8b'
        }
      ];
    }
    
    res.status(200).json([...baseButtons, ...roleSpecificButtons]);
  } catch (error) {
    console.error('Get dashboard buttons error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Interface für req.user (für TypeScript)
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Server starten
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  logger.info(`Server läuft auf Port ${PORT}`);
  logger.info(`Umgebung: ${process.env.NODE_ENV || 'development'}`);
});

export { app, pool };
