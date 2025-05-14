// Hauptanwendungslogik
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  
  // Login-Formular
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  
  // Passwort-vergessen Link
  document.getElementById('forgot-password').addEventListener('click', showPasswordResetDialog);
  
  // Passwort-Reset-Formular
  document.getElementById('password-reset-form').addEventListener('submit', handlePasswordReset);
  
  // Modals schließen
  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', closeModals);
  });
});

function initApp() {
  // Überprüfen, ob der Benutzer eingeloggt ist
  if (auth.isLoggedIn()) {
    // Zum Dashboard navigieren
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    
    // Dashboard initialisieren
    dashboard.init();
  } else {
    // Zum Login navigieren
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('dashboard-section').classList.add('hidden');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const loginMessage = document.getElementById('login-message');
  
  loginMessage.textContent = '';
  loginMessage.className = 'message';
  
  dashboard.showLoading();
  
  try {
    const { token, user } = await api.login(email, password);
    
    // Standorte für den Benutzer abrufen
    const locations = await api.getUserLocations();
    
    auth.login(token, user, locations);
    
    // App neu initialisieren
    initApp();
  } catch (error) {
    loginMessage.textContent = error.message || 'Anmeldung fehlgeschlagen';
    loginMessage.className = 'message error';
  } finally {
    dashboard.hideLoading();
  }
}

function showPasswordResetDialog(e) {
  e.preventDefault();
  
  const modal = document.getElementById('password-reset-dialog');
  modal.style.display = 'block';
  
  // E-Mail-Adresse aus Login-Formular übernehmen
  const loginEmail = document.getElementById('email').value;
  document.getElementById('reset-email').value = loginEmail;
}

async function handlePasswordReset(e) {
  e.preventDefault();
  
  const email = document.getElementById('reset-email').value;
  const passwordResetMessage = document.getElementById('password-reset-message');
  
  passwordResetMessage.textContent = '';
  passwordResetMessage.className = 'message';
  
  dashboard.showLoading();
  
  try {
    await api.requestPasswordReset(email);
    
    passwordResetMessage.textContent = 'Eine E-Mail mit Anweisungen zum Zurücksetzen des Passworts wurde gesendet.';
    passwordResetMessage.className = 'message success';
    
    // Nach 3 Sekunden Modal schließen
    setTimeout(() => {
      closeModals();
    }, 3000);
  } catch (error) {
    passwordResetMessage.textContent = error.message || 'Fehler beim Zurücksetzen des Passworts';
    passwordResetMessage.className = 'message error';
  } finally {
    dashboard.hideLoading();
  }
}

function closeModals() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.style.display = 'none';
  });
}
