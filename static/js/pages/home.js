// Home Page
const homePage = {
  async init(container) {
    const user = auth.getUser();
    const currentLocation = auth.getCurrentLocation();
    
    container.innerHTML = `
      <div class="page-title">
        <h2>Dashboard</h2>
      </div>
      
      <div class="dashboard-cards">
        <div class="card">
          <h3 class="card-title">Willkommen, ${user?.email || 'Benutzer'}</h3>
          <p>Aktueller Standort: ${currentLocation?.name || 'Kein Standort ausgewählt'}</p>
          <p>Rolle: ${dashboard.translateRole(user?.role)}</p>
        </div>
        
        <div class="card">
          <h3 class="card-title">Schnellzugriff</h3>
          <div id="custom-buttons-container">
            <p>Keine Schnellzugriffe verfügbar</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <h3 class="card-title">System-Zugriff</h3>
        <div class="dashboard-cards">
          <div class="card">
            <h3 class="card-title">Einstellungen</h3>
            <p>Persönliche Einstellungen verwalten</p>
            <button class="btn btn-primary" onclick="dashboard.loadPage('settings')">Einstellungen öffnen</button>
          </div>
          
          ${user?.role === 'developer' || user?.role === 'lead' ? `
          <div class="card">
            <h3 class="card-title">Mitarbeiter</h3>
            <p>Mitarbeiter verwalten</p>
            <button class="btn btn-primary" onclick="dashboard.loadPage('users')">Mitarbeiter verwalten</button>
          </div>
          ` : ''}
          
          ${user?.role === 'developer' ? `
          <div class="card">
            <h3 class="card-title">Admin</h3>
            <p>Administrative Aufgaben</p>
            <button class="btn btn-primary" onclick="dashboard.loadPage('admin')">Admin-Bereich</button>
          </div>
          ` : ''}
        </div>
      </div>
    `;
    
    // Benutzerdefinierte Buttons laden, falls ein Standort ausgewählt ist
    if (currentLocation) {
      await this.loadCustomButtons();
    }
  },
  
  async loadCustomButtons() {
    const currentLocation = auth.getCurrentLocation();
    const container = document.getElementById('custom-buttons-container');
    
    dashboard.showLoading();
    
    try {
      const buttons = await api.getButtonsForUser(currentLocation.id);
      
      if (buttons.length > 0) {
        container.innerHTML = `
          <div class="custom-buttons">
            ${buttons.map(button => `
              <a href="${button.url}" target="_blank" class="btn btn-outline">${button.name}</a>
            `).join('')}
          </div>
        `;
      } else {
        container.innerHTML = '<p>Keine Schnellzugriffe verfügbar</p>';
      }
    } catch (error) {
      container.innerHTML = '<div class="message error">Fehler beim Laden der Schnellzugriffe</div>';
    } finally {
      dashboard.hideLoading();
    }
  }
};
