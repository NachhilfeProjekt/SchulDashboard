// Buttons Page
const buttonsPage = {
  async init(container) {
    container.innerHTML = `
      <div class="page-title">
        <h2>Buttons verwalten</h2>
        <div class="page-actions">
          <button class="btn btn-primary" id="create-button-btn">
            <i class="material-icons">add</i> Neuen Button erstellen
          </button>
        </div>
      </div>
      
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>URL</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody id="buttons-table-body">
            <tr>
              <td colspan="3" class="text-center">Lädt...</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Button Dialog -->
      <div id="button-dialog" class="modal">
        <div class="modal-content">
          <span class="close">&times;</span>
          <h2>Neuen Button erstellen</h2>
          <form id="button-form">
            <div class="input-group">
              <label for="button-name">Name</label>
              <input type="text" id="button-name" required>
            </div>
            <div class="input-group">
              <label for="button-url">URL</label>
              <input type="url" id="button-url" required>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" id="cancel-button-btn">Abbrechen</button>
              <button type="submit" class="btn btn-primary">Erstellen</button>
            </div>
          </form>
          <div id="button-form-message" class="message"></div>
        </div>
      </div>
      
      <!-- Permissions Dialog -->
      <div id="permissions-dialog" class="modal">
        <div class="modal-content">
          <span class="close">&times;</span>
          <h2>Berechtigungen bearbeiten</h2>
          <div id="permissions-form">
            <p>Wählen Sie aus, welche Rollen diesen Button sehen können:</p>
            <div class="checkbox-group">
              <input type="checkbox" id="role-teacher" value="teacher">
              <label for="role-teacher">Lehrer</label>
            </div>
            <div class="checkbox-group">
              <input type="checkbox" id="role-office" value="office">
              <label for="role-office">Büro</label>
            </div>
            <div class="checkbox-group">
              <input type="checkbox" id="role-lead" value="lead">
              <label for="role-lead">Leitung</label>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-outline" id="cancel-permissions-btn">Abbrechen</button>
              <button type="button" class="btn btn-primary" id="save-permissions-btn">Speichern</button>
            </div>
          </div>
          <div id="permissions-form-message" class="message"></div>
        </div>
      </div>
    `;
    
    // Event-Listener hinzufügen
    document.getElementById('create-button-btn').addEventListener('click', this.showButtonDialog);
    document.getElementById('cancel-button-btn').addEventListener('click', this.hideButtonDialog);
    document.querySelector('#button-dialog .close').addEventListener('click', this.hideButtonDialog);
    document.getElementById('button-form').addEventListener('submit', this.handleCreateButton);
    
    document.getElementById('cancel-permissions-btn').addEventListener('click', this.hidePermissionsDialog);
    document.querySelector('#permissions-dialog .close').addEventListener('click', this.hidePermissionsDialog);
    document.getElementById('save-permissions-btn').addEventListener('click', this.handleSavePermissions);
    
    // Buttons laden
    await this.loadButtons();
  },
  
  async loadButtons() {
    const tableBody = document.getElementById('buttons-table-body');
    const currentLocation = auth.getCurrentLocation();
    
    if (!currentLocation) {
      tableBody.innerHTML = '<tr><td colspan="3" class="text-center">Kein Standort ausgewählt</td></tr>';
      return;
    }
    
    dashboard.showLoading();
    
    try {
      const buttons = await api.getButtonsForUser(currentLocation.id);
      
      if (buttons.length > 0) {
        tableBody.innerHTML = buttons.map(button => `
          <tr>
            <td>${button.name}</td>
            <td>
              <a href="${button.url}" target="_blank">${button.url}</a>
            </td>
            <td>
              <button class="btn btn-outline edit-permissions-btn" data-id="${button.id}" data-name="${button.name}">
                <i class="material-icons">security</i> Berechtigungen
              </button>
            </td>
          </tr>
        `).join('');
        
        // Event-Listener für Permissions-Buttons
        document.querySelectorAll('.edit-permissions-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const buttonId = e.currentTarget.getAttribute('data-id');
            const buttonName = e.currentTarget.getAttribute('data-name');
            this.showPermissionsDialog(buttonId, buttonName);
          });
        });
      } else {
        tableBody.innerHTML = '<tr><td colspan="3" class="text-center">Keine Buttons gefunden</td></tr>';
      }
    } catch (error) {
      tableBody.innerHTML = `<tr><td colspan="3" class="text-center error">Fehler: ${error.message}</td></tr>`;
    } finally {
      dashboard.hideLoading();
    }
  },
  
  showButtonDialog() {
    const modal = document.getElementById('button-dialog');
    modal.style.display = 'block';
  },
  
  hideButtonDialog() {
    const modal = document.getElementById('button-dialog');
    modal.style.display = 'none';
    
    // Formular zurücksetzen
    document.getElementById('button-form').reset();
    document.getElementById('button-form-message').textContent = '';
    document.getElementById('button-form-message').className = 'message';
  },
  
  showPermissionsDialog(buttonId, buttonName) {
    const modal = document.getElementById('permissions-dialog');
    document.querySelector('#permissions-dialog h2').textContent = `Berechtigungen für "${buttonName}"`;
    modal.style.display = 'block';
    
    // Button-ID im DOM speichern
    modal.setAttribute('data-button-id', buttonId);
    
    // Formular zurücksetzen
    document.querySelectorAll('#permissions-form input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
    });
    
    document.getElementById('permissions-form-message').textContent = '';
    document.getElementById('permissions-form-message').className = 'message';
  },
  
  hidePermissionsDialog() {
    const modal = document.getElementById('permissions-dialog');
    modal.style.display = 'none';
  },
  
  async handleCreateButton(e) {
    e.preventDefault();
    
    const name = document.getElementById('button-name').value;
    const url = document.getElementById('button-url').value;
    const currentLocation = auth.getCurrentLocation();
    const messageElement = document.getElementById('button-form-message');
    
    if (!currentLocation) {
      messageElement.textContent = 'Kein Standort ausgewählt';
      messageElement.className = 'message error';
      return;
    }
    
    dashboard.showLoading();
    
    try {
      await api.createCustomButton(name, url, currentLocation.id);
      
      messageElement.textContent = 'Button erfolgreich erstellt.';
      messageElement.className = 'message success';
      
      // Nach 2 Sekunden Formular schließen und Buttonliste aktualisieren
      setTimeout(() => {
        buttonsPage.hideButtonDialog();
        buttonsPage.loadButtons();
      }, 2000);
    } catch (error) {
      messageElement.textContent = error.message || 'Fehler beim Erstellen des Buttons';
      messageElement.className = 'message error';
    } finally {
      dashboard.hideLoading();
    }
  },
  
  async handleSavePermissions() {
    const modal = document.getElementById('permissions-dialog');
    const buttonId = modal.getAttribute('data-button-id');
    const messageElement = document.getElementById('permissions-form-message');
    
    // Ausgewählte Rollen sammeln
    const roleCheckboxes = document.querySelectorAll('#permissions-form input[type="checkbox"]:checked');
    const roles = Array.from(roleCheckboxes).map(checkbox => checkbox.value);
    
    dashboard.showLoading();
    
    try {
      await api.setButtonPermissions(buttonId, { roles });
      
      messageElement.textContent = 'Berechtigungen erfolgreich gespeichert.';
      messageElement.className = 'message success';
      
      // Nach 2 Sekunden Formular schließen
      setTimeout(() => {
        buttonsPage.hidePermissionsDialog();
      }, 2000);
    } catch (error) {
      messageElement.textContent = error.message || 'Fehler beim Speichern der Berechtigungen';
      messageElement.className = 'message error';
    } finally {
      dashboard.hideLoading();
    }
  }
};
