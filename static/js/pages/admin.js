// Admin Page
const adminPage = {
  async init(container) {
    // Sicherstellen, dass nur Entwickler Zugriff haben
    const user = auth.getUser();
    if (user.role !== 'developer') {
      container.innerHTML = `
        <div class="message error">
          <h3>Zugriff verweigert</h3>
          <p>Sie haben keine Berechtigung, auf diese Seite zuzugreifen.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = `
      <div class="page-title">
        <h2>Administration</h2>
      </div>
      
      <div class="tabs">
        <div class="tab active" data-tab="locations">Standorte</div>
        <div class="tab" data-tab="leads">Leitungsaccounts</div>
      </div>
      
      <div class="tab-content active" id="locations-content">
        <div class="card">
          <div class="card-title-with-action">
            <h3 class="card-title">Standorte verwalten</h3>
            <button class="btn btn-primary" id="create-location-btn">
              <i class="material-icons">add</i> Neuen Standort erstellen
            </button>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Erstellt am</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody id="locations-table-body">
                <tr>
                  <td colspan="3" class="text-center">Lädt...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div class="tab-content" id="leads-content">
        <div class="card">
          <div class="card-title-with-action">
            <h3 class="card-title">Leitungsaccounts verwalten</h3>
            <button class="btn btn-primary" id="create-lead-btn">
              <i class="material-icons">add</i> Leitungsaccount erstellen
            </button>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>E-Mail</th>
                  <th>Zugewiesene Standorte</th>
                  <th>Erstellt am</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody id="leads-table-body">
                <tr>
                  <td colspan="4" class="text-center">Lädt...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Location Dialog -->
      <div id="location-dialog" class="modal">
        <div class="modal-content">
          <span class="close">&times;</span>
          <h2>Neuen Standort erstellen</h2>
          <form id="location-form">
            <div class="input-group">
              <label for="location-name">Name</label>
              <input type="text" id="location-name" required>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" id="cancel-location-btn">Abbrechen</button>
              <button type="submit" class="btn btn-primary">Erstellen</button>
            </div>
          </form>
          <div id="location-form-message" class="message"></div>
        </div>
      </div>
      
      <!-- Lead Dialog -->
      <div id="lead-dialog" class="modal">
        <div class="modal-content">
          <span class="close">&times;</span>
          <h2>Leitungsaccount erstellen</h2>
          <form id="lead-form">
            <div class="input-group">
              <label for="lead-email">E-Mail</label>
              <input type="email" id="lead-email" required>
            </div>
            <div class="input-group">
              <label>Standorte</label>
              <div id="lead-locations-checkboxes"></div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" id="cancel-lead-btn">Abbrechen</button>
              <button type="submit" class="btn btn-primary">Erstellen</button>
            </div>
          </form>
          <div id="lead-form-message" class="message"></div>
        </div>
      </div>
    `;
    
    // CSS für Tabs
    const style = document.createElement('style');
    style.textContent = `
      .tabs {
        display: flex;
        border-bottom: 1px solid #ddd;
        margin-bottom: 20px;
      }
      .tab {
        padding: 10px 20px;
        cursor: pointer;
        border-bottom: 2px solid transparent;
      }
      .tab.active {
        border-bottom-color: #1976d2;
        color: #1976d2;
        font-weight: 500;
      }
      .tab-content {
        display: none;
      }
      .tab-content.active {
        display: block;
      }
      .card-title-with-action {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
    `;
    document.head.appendChild(style);
    
    // Event-Listener für Tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', function() {
        // Aktiven Tab markieren
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // Tab-Inhalt anzeigen
        const tabId = this.getAttribute('data-tab');
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });
        document.getElementById(`${tabId}-content`).classList.add('active');
      });
    });
    
    // Event-Listener für Location-Dialog
    document.getElementById('create-location-btn').addEventListener('click', this.showLocationDialog);
    document.getElementById('cancel-location-btn').addEventListener('click', this.hideLocationDialog);
    document.querySelector('#location-dialog .close').addEventListener('click', this.hideLocationDialog);
    document.getElementById('location-form').addEventListener('submit', this.handleCreateLocation);
    
    // Event-Listener für Lead-Dialog
    document.getElementById('create-lead-btn').addEventListener('click', this.showLeadDialog);
    document.getElementById('cancel-lead-btn').addEventListener('click', this.hideLeadDialog);
    document.querySelector('#lead-dialog .close').addEventListener('click', this.hideLeadDialog);
    document.getElementById('lead-form').addEventListener('submit', this.handleCreateLead);
    
    // Daten laden
    await Promise.all([
      this.loadLocations(),
      this.loadLeads()
    ]);
  },
  
  async loadLocations() {
    const tableBody = document.getElementById('locations-table-body');
    
    dashboard.showLoading();
    
    try {
      const locations = await api.getLocations();
      
      if (locations.length > 0) {
        tableBody.innerHTML = locations.map(location => `
          <tr>
            <td>${location.name}</td>
            <td>${new Date(location.created_at || location.createdAt).toLocaleDateString('de-DE')}</td>
            <td>
              <button type="button" class="btn btn-danger delete-location-btn" data-id="${location.id}" data-name="${location.name}">
                <i class="material-icons">delete</i> Löschen
              </button>
            </td>
          </tr>
        `).join('');
        
        // Event-Listener für Lösch-Buttons
        document.querySelectorAll('.delete-location-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const locationId = e.currentTarget.getAttribute('data-id');
            const locationName = e.currentTarget.getAttribute('data-name');
            
            alert(`Das Löschen von Standorten wird derzeit nicht unterstützt. (${locationName})`);
          });
        });
      } else {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center">Keine Standorte gefunden</td></tr>';
      }
    } catch (error) {
      tableBody.innerHTML = `<tr><td colspan="3" class="text-center error">Fehler: ${error.message}</td></tr>`;
    } finally {
      dashboard.hideLoading();
    }
  },
  
  async loadLeads() {
    const tableBody = document.getElementById('leads-table-body');
    
    dashboard.showLoading();
    
    try {
      // Alle Benutzer mit der Rolle 'lead' abrufen
      // Diese API-Funktion muss noch implementiert werden
      const leads = [];
      
      if (leads.length > 0) {
        tableBody.innerHTML = leads.map(lead => `
          <tr>
            <td>${lead.email}</td>
            <td>
              ${lead.locations.map(loc => `<span class="badge">${loc.name}</span>`).join(' ')}
            </td>
            <td>${new Date(lead.created_at || lead.createdAt).toLocaleDateString('de-DE')}</td>
            <td>
              <button type="button" class="btn btn-danger deactivate-lead-btn" data-id="${lead.id}" data-email="${lead.email}">
                <i class="material-icons">delete</i> Deaktivieren
              </button>
            </td>
          </tr>
        `).join('');
        
        // Event-Listener für Deactivate-Buttons
        document.querySelectorAll('.deactivate-lead-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const userId = e.currentTarget.getAttribute('data-id');
            const userEmail = e.currentTarget.getAttribute('data-email');
            
            this.handleDeactivateUser(userId, userEmail);
          });
        });
      } else {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Keine Leitungsaccounts gefunden</td></tr>';
      }
    } catch (error) {
      tableBody.innerHTML = `<tr><td colspan="4" class="text-center error">Fehler: ${error.message}</td></tr>`;
    } finally {
      dashboard.hideLoading();
    }
  },
  
  showLocationDialog() {
    const modal = document.getElementById('location-dialog');
    modal.style.display = 'block';
  },
  
  hideLocationDialog() {
    const modal = document.getElementById('location-dialog');
    modal.style.display = 'none';
    
    // Formular zurücksetzen
    document.getElementById('location-form').reset();
    document.getElementById('location-form-message').textContent = '';
    document.getElementById('location-form-message').className = 'message';
  },
  
  async handleCreateLocation(e) {
    e.preventDefault();
    
    const name = document.getElementById('location-name').value;
    const messageElement = document.getElementById('location-form-message');
    
    dashboard.showLoading();
    
    try {
      await api.createLocation(name);
      
      messageElement.textContent = 'Standort erfolgreich erstellt.';
      messageElement.className = 'message success';
      
      // Nach 2 Sekunden Formular schließen und Liste aktualisieren
      setTimeout(() => {
        adminPage.hideLocationDialog();
        adminPage.loadLocations();
      }, 2000);
    } catch (error) {
      messageElement.textContent = error.message || 'Fehler beim Erstellen des Standorts';
      messageElement.className = 'message error';
    } finally {
      dashboard.hideLoading();
    }
  },
  
  async loadLocationsForLeadDialog() {
    const container = document.getElementById('lead-locations-checkboxes');
    
    dashboard.showLoading();
    
    try {
      const locations = await api.getLocations();
      
      container.innerHTML = locations.map(location => `
        <div class="checkbox-group">
          <input type="checkbox" id="lead-location-${location.id}" value="${location.id}">
          <label for="lead-location-${location.id}">${location.name}</label>
        </div>
      `).join('');
    } catch (error) {
      container.innerHTML = `<div class="message error">Fehler beim Laden der Standorte: ${error.message}</div>`;
    } finally {
      dashboard.hideLoading();
    }
  },
  
  showLeadDialog() {
    const modal = document.getElementById('lead-dialog');
    modal.style.display = 'block';
    
    // Standorte für das Formular laden
    adminPage.loadLocationsForLeadDialog();
  },
  
  hideLeadDialog() {
    const modal = document.getElementById('lead-dialog');
    modal.style.display = 'none';
    
    // Formular zurücksetzen
    document.getElementById('lead-form').reset();
    document.getElementById('lead-form-message').textContent = '';
    document.getElementById('lead-form-message').className = 'message';
  },
  
  async handleCreateLead(e) {
    e.preventDefault();
    
    const email = document.getElementById('lead-email').value;
    const locationCheckboxes = document.querySelectorAll('#lead-locations-checkboxes input[type="checkbox"]:checked');
    const messageElement = document.getElementById('lead-form-message');
    
    // Standorte sammeln
    const locations = Array.from(locationCheckboxes).map(checkbox => checkbox.value);
    
    if (locations.length === 0) {
      messageElement.textContent = 'Bitte mindestens einen Standort auswählen';
      messageElement.className = 'message error';
      return;
    }
    
    dashboard.showLoading();
    
    try {
      await api.createUser(email, 'lead', locations);
      
      messageElement.textContent = 'Leitungsaccount erfolgreich erstellt. Eine E-Mail mit temporärem Passwort wurde versendet.';
      messageElement.className = 'message success';
      
      // Nach 2 Sekunden Formular schließen und Liste aktualisieren
      setTimeout(() => {
        adminPage.hideLeadDialog();
        adminPage.loadLeads();
      }, 2000);
    } catch (error) {
      messageElement.textContent = error.message || 'Fehler beim Erstellen des Leitungsaccounts';
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
      
      // Liste aktualisieren
      await this.loadLeads();
    } catch (error) {
      alert(`Fehler beim Deaktivieren des Benutzers: ${error.message}`);
    } finally {
      dashboard.hideLoading();
    }
  }
};
