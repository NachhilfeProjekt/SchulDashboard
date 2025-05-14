// Dashboard-Funktionalitäten
const dashboard = {
  init() {
    this.setupNavigation();
    this.setupLogout();
    this.setupLocationSelector();
    this.loadPage('home');
    this.setRoleBasedVisibility();
  },
  
  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const page = item.getAttribute('data-page');
        this.loadPage(page);
        
        // Aktiven Menüpunkt markieren
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });
  },
  
  setupLogout() {
    document.getElementById('logout-btn').addEventListener('click', () => {
      auth.logout();
    });
  },
  
  async setupLocationSelector() {
    const locationSelect = document.getElementById('location-async setupLocationSelector() {
    const locationSelect = document.getElementById('location-select');
    const user = auth.getUser();
    const locations = auth.getLocations();
    const currentLocation = auth.getCurrentLocation();
    
    // Locations ins Dropdown laden
    locationSelect.innerHTML = '';
    locations.forEach(location => {
      const option = document.createElement('option');
      option.value = location.id;
      option.textContent = location.name;
      locationSelect.appendChild(option);
    });
    
    // Aktuellen Standort setzen
    if (currentLocation) {
      locationSelect.value = currentLocation.id;
    }
    
    // Event-Listener für Änderungen
    locationSelect.addEventListener('change', () => {
      const selectedId = locationSelect.value;
      const selectedLocation = locations.find(loc => loc.id === selectedId);
      
      if (selectedLocation) {
        auth.setCurrentLocation(selectedLocation);
        // Seite neu laden, um Daten für neuen Standort zu laden
        this.loadPage(document.querySelector('.nav-item.active').getAttribute('data-page'));
      }
    });
    
    // Benutzerinfo anzeigen
    document.getElementById('user-email').textContent = user?.email || '';
    document.getElementById('user-role').textContent = this.translateRole(user?.role);
  },
  
  translateRole(role) {
    const translations = {
      'developer': 'Entwickler',
      'lead': 'Leitung',
      'office': 'Büro',
      'teacher': 'Lehrer'
    };
    
    return translations[role] || role;
  },
  
  setRoleBasedVisibility() {
    const user = auth.getUser();
    
    if (!user) return;
    
    const isDeveloper = user.role === 'developer';
    const isLead = user.role === 'lead';
    
    // Entwickler und Leitung Elemente
    document.querySelectorAll('.developer-lead').forEach(el => {
      el.style.display = isDeveloper || isLead ? 'flex' : 'none';
    });
    
    // Nur Entwickler Elemente
    document.querySelectorAll('.developer').forEach(el => {
      el.style.display = isDeveloper ? 'flex' : 'none';
    });
  },
  
  loadPage(page) {
    // Seite laden
    const pageContainer = document.getElementById('page-container');
    
    switch (page) {
      case 'home':
        homePage.init(pageContainer);
        break;
      case 'users':
        usersPage.init(pageContainer);
        break;
      case 'emails':
        emailsPage.init(pageContainer);
        break;
      case 'buttons':
        buttonsPage.init(pageContainer);
        break;
      case 'admin':
        adminPage.init(pageContainer);
        break;
      case 'settings':
        settingsPage.init(pageContainer);
        break;
      default:
        pageContainer.innerHTML = '<div class="message error">Seite nicht gefunden</div>';
    }
  },
  
  showLoading() {
    document.getElementById('loading-container').classList.remove('hidden');
  },
  
  hideLoading() {
    document.getElementById('loading-container').classList.add('hidden');
  }
};
