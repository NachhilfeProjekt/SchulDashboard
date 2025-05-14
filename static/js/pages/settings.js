// Settings Page
const settingsPage = {
  async init(container) {
    const user = auth.getUser();
    
    container.innerHTML = `
      <div class="page-title">
        <h2>Einstellungen</h2>
      </div>
      
      <div class="card">
        <h3 class="card-title">Persönliche Informationen</h3>
        <div class="profile-info">
          <div class="avatar">${user.email.charAt(0).toUpperCase()}</div>
          <div class="info">
            <p><strong>E-Mail:</strong> ${user.email}</p>
            <p><strong>Rolle:</strong> ${dashboard.translateRole(user.role)}</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <h3 class="card-title">Passwort ändern</h3>
        <form id="password-form">
          <div class="input-group">
            <label for="current-password">Aktuelles Passwort</label>
            <input type="password" id="current-password" required>
          </div>
          <div class="input-group">
            <label for="new-password">Neues Passwort</label>
            <input type="password" id="new-password" required>
          </div>
          <div class="input-group">
            <label for="confirm-password">Passwort bestätigen</label>
            <input type="password" id="confirm-password" required>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              <i class="material-icons">lock</i> Passwort ändern
            </button>
          </div>
        </form>
        <div id="password-form-message" class="message"></div>
      </div>
    `;
    
    // CSS für Profilinfo
    const style = document.createElement('style');
    style.textContent = `
      .profile-info {
        display: flex;
        align-items: center;
        gap: 20px
        .profile-info {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 20px;
      }
      .avatar {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background-color: #1976d2;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        font-weight: bold;
      }
      .info {
        flex: 1;
      }
      .info p {
        margin-bottom: 8px;
      }
    `;
    document.head.appendChild(style);
    
    // Event-Listener für Passwort-Formular
    document.getElementById('password-form').addEventListener('submit', this.handleChangePassword);
  },
  
  async handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const messageElement = document.getElementById('password-form-message');
    
    // Passwörter überprüfen
    if (newPassword !== confirmPassword) {
      messageElement.textContent = 'Die eingegebenen Passwörter stimmen nicht überein.';
      messageElement.className = 'message error';
      return;
    }
    
    if (newPassword.length < 8) {
      messageElement.textContent = 'Das neue Passwort muss mindestens 8 Zeichen lang sein.';
      messageElement.className = 'message error';
      return;
    }
    
    dashboard.showLoading();
    
    try {
      // API-Aufruf für die Passwortänderung
      // Diese Funktion muss im Backend und in api.js implementiert werden
      // await api.changePassword(currentPassword, newPassword);
      
      // Simulierte Antwort, da die Funktion noch nicht implementiert ist
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      messageElement.textContent = 'Passwort wurde erfolgreich geändert.';
      messageElement.className = 'message success';
      
      // Formular zurücksetzen
      document.getElementById('password-form').reset();
    } catch (error) {
      messageElement.textContent = error?.message || 'Fehler beim Ändern des Passworts. Überprüfen Sie Ihr aktuelles Passwort.';
      messageElement.className = 'message error';
    } finally {
      dashboard.hideLoading();
    }
  }
};
