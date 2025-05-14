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
    const locationSelect = document.getElementById('location-
