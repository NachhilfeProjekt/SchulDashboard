// Hauptanwendungslogik
document.addEventListener('DOMContentLoaded', () => {
  console.log('App initialized');
  initApp();
  
  // Login-Formular
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
    console.log('Login form event listener attached');
  }
  
  // Passwort-vergessen Link
  const forgotPasswordLink = document.getElementById('forgot-password');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', showPasswordResetDialog);
  }
  
  // Passwort-Reset-Formular
  const passwordResetForm = document.getElementById('password-reset-form');
  if (passwordResetForm) {
    passwordResetForm.addEventListener('submit', handlePasswordReset);
  }
  
  // Modals schließen
  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', closeModals);
  });
});

function initApp() {
  // Überprüfen, ob der Benutzer eingeloggt ist
  if (auth.isLoggedIn()) {
    console.log('User is logged in, redirecting to dashboard');
    // Zum Dashboard navigieren
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    
    // Dashboard initialisieren
    dashboard.init();
  } else {
    console.log('User is not logged in, showing login form');
    // Zum Login navigieren
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('dashboard-section').classList.add('hidden');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  console.log('Login form submitted');
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const loginMessage = document.getElementById('login-message');
  
  console.log(`Attempting login with email: ${email}`);
  
  loginMessage.textContent = '';
  loginMessage.className = 'message';
  
  try {
    // Lade-Anzeige
    const loadingContainer = document.getElementById('loading-container');
    if (loadingContainer) loadingContainer.classList.remove('hidden');
    
    console.log('Making API request to:', `${config.apiUrl}/auth/login`);
    const response = await fetch(`${config.apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    console.log('Received response:', response);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Anmeldung fehlgeschlagen');
    }
    
    const data = await response.json();
    console.log('Login successful, response data:', data);
    
    // Token und Benutzerdaten speichern
    localStorage.setItem(config.tokenKey, data.token);
    localStorage.setItem(config.userKey, JSON.stringify(data.user));
    
    // Standorte für den Benutzer abrufen
    const locationsResponse = await fetch(`${config.apiUrl}/locations/my-locations`, {
      headers: {
        'Authorization': `Bearer ${data.token}`
      }
    });
    
    if (!locationsResponse.ok) {
      throw new Error('Fehler beim Abrufen der Standorte');
    }
    
    const locations = await locationsResponse.json();
    console.log('Received locations:', locations);
    
    localStorage.setItem(config.locationsKey, JSON.stringify(locations));
    
    if (locations.length > 0) {
      localStorage.setItem(config.currentLocationKey, JSON.stringify(locations[0]));
    }
    
    // App neu initialisieren
    window.location.reload();
  } catch (error) {
    console.error('Login error:', error);
    loginMessage.textContent = error.message || 'Anmeldung fehlgeschlagen';
    loginMessage.className = 'message error';
  } finally {
    // Lade-Anzeige ausblenden
    const loadingContainer = document.getElementById('loading-container');
    if (loadingContainer) loadingContainer.classList.add('hidden');
  }
}

function showPasswordResetDialog(e) {
  e.preventDefault();
  console.log('Showing password reset dialog');
  
  const modal = document.getElementById('password-reset-dialog');
  modal.style.display = 'block';
  
  // E-Mail-Adresse aus Login-Formular übernehmen
  const loginEmail = document.getElementById('email').value;
  document.getElementById('reset-email').value = loginEmail;
}

async function handlePasswordReset(e) {
  e.preventDefault();
  console.log('Password reset form submitted');
  
  const email = document.getElementById('reset-email').value;
  const passwordResetMessage = document.getElementById('password-reset-message');
  
  passwordResetMessage.textContent = '';
  passwordResetMessage.className = 'message';
  
  try {
    // Lade-Anzeige
    const loadingContainer = document.getElementById('loading-container');
    if (loadingContainer) loadingContainer.classList.remove('hidden');
    
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
    
    passwordResetMessage.textContent = 'Eine E-Mail mit Anweisungen zum Zurücksetzen des Passworts wurde gesendet.';
    passwordResetMessage.className = 'message success';
    
    // Nach 3 Sekunden Modal schließen
    setTimeout(() => {
      closeModals();
    }, 3000);
  } catch (error) {
    console.error('Password reset error:', error);
    passwordResetMessage.textContent = error.message || 'Fehler beim Zurücksetzen des Passworts';
    passwordResetMessage.className = 'message error';
  } finally {
    // Lade-Anzeige ausblenden
    const loadingContainer = document.getElementById('loading-container');
    if (loadingContainer) loadingContainer.classList.add('hidden');
  }
}

function closeModals() {
  console.log('Closing all modals');
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.style.display = 'none';
  });
}
