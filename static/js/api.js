// API Service
const api = {
  // Authentifizierung
  async login(email, password) {
    const response = await fetch(`${config.apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Anmeldung fehlgeschlagen');
    }
    
    return response.json();
  },
  
  async requestPasswordReset(email) {
    const response = await fetch(`${config.apiUrl}/auth/request-password-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Fehler beim Zurücksetzen des Passworts');
    }
    
    return response.json();
  },
  
  // Benutzer
  async getCurrentUser() {
    const token = localStorage.getItem(config.tokenKey);
    if (!token) throw new Error('Nicht authentifiziert');
    
    const response = await fetch(`${config.apiUrl}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        auth.logout();
        throw new Error('Sitzung abgelaufen');
      }
      throw new Error('Fehler beim Abrufen des Benutzers');
    }
    
    return response.json();
  },
  
  async getUsersByLocation(locationId) {
    const token = localStorage.getItem(config.tokenKey);
    if (!token) throw new Error('Nicht authentifiziert');
    
    const response = await fetch(`${config.apiUrl}/users/location/${locationId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Fehler beim Abrufen der Benutzer');
    }
    
    return response.json();
  },
  
  async createUser(email, role, locations) {
    const token = localStorage.getItem(config.tokenKey);
    if (!token) throw new Error('Nicht authentifiziert');
    
    const response = await fetch(`${config.apiUrl}/auth/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ email, role, locations })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Fehler beim Erstellen des Benutzers');
    }
    
    return response.json();
  },
  
  async deactivateUser(userId) {
    const token = localStorage.getItem(config.tokenKey);
    if (!token) throw new Error('Nicht authentifiziert');
    
    const response = await fetch(`${config.apiUrl}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Fehler beim Deaktivieren des Benutzers');
    }
    
    return response.json();
  },
  
  // Standorte
  async getLocations() {
    const token = localStorage.getItem(config.tokenKey);
    if (!token) throw new Error('Nicht authentifiziert');
    
    const response = await fetch(`${config.apiUrl}/locations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Fehler beim Abrufen der Standorte');
    }
    
    return response.json();
  },
  
  async getUserLocations() {
    const token = localStorage.getItem(config.tokenKey);
    if (!token) throw new Error('Nicht authentifiziert');
    
    const response = await fetch(`${config.apiUrl}/locations/my-locations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Fehler beim Abrufen der Benutzerstandorte');
    }
    
    return response.json();
  },
  
  async createLocation(name) {
    const token = localStorage.getItem(config.tokenKey);
    if (!token) throw new Error('Nicht authentifiziert');
    
    const response = await fetch(`${config.apiUrl}/locations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });
    
    if (!response.ok) {
      throw new Error('Fehler beim Erstellen des Standorts');
    }
    
    return response.json();
  },
  
  // Buttons
  async getButtonsForUser(locationId) {
    const token = localStorage.getItem(config.tokenKey);
    if (!token) throw new Error('Nicht authentifiziert');
    
    const response = await fetch(`${config.apiUrl}/buttons/location/${locationId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Fehler beim Abrufen der Buttons');
    }
    
    return response.json();
  },
  
  async createCustomButton(name, url, locationId) {
    const token = localStorage.getItem(config.tokenKey);
    if (!token) throw new Error('Nicht authentifiziert');
    
    const response = await fetch(`${config.apiUrl}/buttons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, url, locationId })
    });
    
    if (!response.ok) {
      throw new Error('Fehler beim Erstellen des Buttons');
    }
    
    return response.json();
  },
  
  async setButtonPermissions(buttonId, permissions) {
    const token = localStorage.getItem(config.tokenKey);
    if (!token) throw new Error('Nicht authentifiziert');
    
    const response = await fetch(`${config.apiUrl}/buttons/${buttonId}/permissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ permissions })
    });
    
    if (!response.ok) {
      throw new Error('Fehler beim Setzen der Button-Berechtigungen');
    }
    
    return response.json();
  },
  
  // E-Mails
  async getEmailTemplates(locationId) {
    const token = localStorage.getItem(config.tokenKey);
    if (!token) throw new Error('Nicht authentifiziert');
    
    const response = await fetch(`${config.apiUrl}/emails/templates/location/${locationId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Fehler beim Abrufen der E-Mail-Vorlagen');
    }
    
    return response.json();
  },
  
  async sendBulkEmails(templateId, recipients) {
    const token = localStorage.getItem(config.tokenKey);
    if (!token) throw new Error('Nicht authentifiziert');
    
    const response = await fetch(`${config.apiUrl}/emails/send-bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ templateId, recipients })
    });
    
    if (!response.ok) {
      throw new Error('Fehler beim Senden der E-Mails');
    }
    
    return response.json();
  }
};
