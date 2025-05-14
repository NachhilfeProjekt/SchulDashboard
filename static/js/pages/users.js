// Users Page
const usersPage = {
  async init(container) {
    container.innerHTML = `
      <div class="page-title">
        <h2>Mitarbeiter verwalten</h2>
        <div class="page-actions">
          <button class="btn btn-primary" id="create-user-btn">
            <i class="material-icons">add</i> Neuen Mitarbeiter anlegen
          </button>
        </div>
      </div>
      
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>E-Mail</th>
              <th>Rolle</th>
              <th>Standorte</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody id="users-table-body">
            <tr>
              <td colspan="4" class="text-center">Lädt...</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- User Dialog -->
      <div id="user-dialog" class="modal">
        <div class="modal-content">
          <span class="close">&times;</span>
          <h2>Neuen Mitarbeiter anlegen</h2>
          <form id="user-form">
            <div class="input-group">
              <label for="user-email">E-Mail</label>
              <input type="email" id="user-email" required>
            </div>
            <div class="input-group">
              <label for="user-role">Rolle</label>
              <select id="user-role" required>
                <option value="teacher">Lehrer</option>
                <option value="office">Büro</option>
                <option value="lead">Leitung</option>
              </select>
            </div>
            <div class="input-group">
              <label>Standorte</label>
              <div id="locations-checkboxes"></div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" id="cancel-user-btn">Abbrechen</button>
              <button type="submit" class="btn btn-primary">Erstellen</button>
            </div>
          </form>
          <div id="user-form-message" class="message"></div>
        </div>
      </div>
    `;
    
    // Event-Listener hinzufügen
    document.getElementById('create-user-btn').addEventListener('click', this.showUserDialog);
    document.getElementById('cancel-user-btn').addEventListener('click', this.hideUserDialog);
    document.querySelector('#user-dialog .close').addEventListener('click', this.hideUserDialog);
    document.getElementById('user-form').addEventListener('submit', this.handleCreateUser);
    
    // Benutzer laden
    await this.loadUsers();
    
    // Standorte laden
    await this.loadLocations();
  },
  
  async loadUsers() {
    const tableBody = document.getElementById('users-table-body');
    const currentLocation = auth.getCurrentLocation();
    
    if (!currentLocation) {
      tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Kein Standort ausgewählt</td></tr>';
      return;
    }
    
    dashboard.showLoading();
    
    try {
      const users = await api.getUsersByLocation(currentLocation.id);
      
      if (users.length > 0) {
        tableBody.innerHTML = users.map(user => `
          <tr>
            <td>${user.email}</td>
            <td>
              <span class="badge ${user.role}">
                ${dashboard.translateRole(user.role)}
              </span>
            </td>
            <td>
              ${user.locations ? user.locations.map(loc => `
                <span class="badge">${loc.name}</span>
              `).join(' ') : ''}
            </td>
            <td>
              <button class="btn btn-danger deactivate-user-btn" data-id="${user.id}" data-email="${user.email}">
                <i class="material-icons">delete</i>
              </button>
            </td>
          </tr>
        `).join('');
        
        // Event-Listener für Deactivate-Buttons
        document.querySelectorAll('.deactivate-user-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const userId = e.currentTarget.getAttribute('data-id');
            const userEmail = e.currentTarget.getAttribute('data-email');
            this.handleDeactivateUser(userId, userEmail);
          });
        });
      } else {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Keine Benutzer gefunden</td></tr>';
      }
    } catch (error) {
      tableBody.innerHTML = `<tr><td colspan="4" class="text-center error">Fehler: ${error.message}</td></tr>`;
    } finally {
      dashboard.hideLoading();
    }
  },
  
  async loadLocations() {
    const locationsContainer = document.getElementById('locations-checkboxes');
    const currentUser = auth.getUser();
    
    dashboard.showLoading();
    
    try {
      let locations;
      
      // Entwickler sehen alle Standorte, andere nur ihre eigenen
      if (currentUser.role === 'developer') {
        locations = await api.getLocations();
      } else {
        locations = auth.getLocations();
      }
      
      locationsContainer.innerHTML = locations.map(location => `
        <div class="checkbox-group">
          <input type="checkbox" id="location-${location.id}" value="${location.id}">
          <label for="location-${location.id}">${location.name}</label>
        </div>
      `).join('');
      
      // Standard: aktueller Standort ausgewählt
      const currentLocation = auth.getCurrentLocation();
      if (currentLocation) {
        const checkbox = document.getElementById(`location-${currentLocation.id}`);
        if (checkbox) checkbox.checked = true;
      }
    } catch (error) {
      locationsContainer.innerHTML = `<div class="message error">Fehler beim Laden der Standorte: ${error.message}</div>`;
    } finally {
      dashboard.hideLoading();
    }
  },
  
  showUserDialog() {
    const modal = document.getElementById('user-dialog');
    modal.style.display = 'block';
  },
  
  hideUserDialog() {
    const modal = document.getElementById('user-dialog');
    modal.style.display = 'none';
    
    // Formular zurücksetzen
    document.getElementById('user-form').reset();
    document.getElementById('user-form-message').textContent = '';
    document.getElementById('user-form-message').className = 'message';
  },
  
  async handleCreateUser(e) {
    e.preventDefault();
    
    const email = document.getElementById('user-email').value;
    const role = document.getElementById('user-role').value;
    const locationCheckboxes = document.querySelectorAll('#locations-checkboxes input[type="checkbox"]:checked');
    const messageElement = document.getElementById('user-form-message');
    
    // Standorte sammeln
    const locations = Array.from(locationCheckboxes).map(checkbox => checkbox.value);
    
    if (locations.length === 0) {
      messageElement.textContent = 'Bitte mindestens einen Standort auswählen';
      messageElement.className = 'message error';
      return;
    }
    
    dashboard.showLoading();
    
    try {
      await api.createUser(email, role, locations);
      
      messageElement.textContent = 'Benutzer erfolgreich erstellt. Eine E-Mail mit temporärem Passwort wurde versendet.';
      messageElement.className = 'message success';
      
      // Nach 2 Sekunden Formular schließen und Benutzerliste aktualisieren
      setTimeout(() => {
        usersPage.hideUserDialog();
        usersPage.loadUsers();
      }, 2000);
    } catch (error) {
      messageElement.textContent = error.message || 'Fehler beim Erstellen des Benutzers';
      messageElement.className = 'message error';
    } finally {
      dashboard.hideLoading();
    }
  },
  
  async handleDeactivateUser(userId, userEmail) {
    if (!confirm(`Möchten Sie den Benutzer "${userEmail}" wirklich deaktivieren?`)) {
      return;
    }
    
    dashboard.showLoading();
    
    try {
      await api.deactivateUser(userId);
      
      // Benutzerliste aktualisieren
      await this.loadUsers();
    } catch (error) {
      alert(`Fehler beim Deaktivieren des Benutzers: ${error.message}`);
    } finally {
      dashboard.hideLoading();
    }
  }
};
