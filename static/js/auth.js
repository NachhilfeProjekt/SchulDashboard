// Authentifizierungslogik
const auth = {
  // Einloggen
  login(token, user, locations) {
    localStorage.setItem(config.tokenKey, token);
    localStorage.setItem(config.userKey, JSON.stringify(user));
    localStorage.setItem(config.locationsKey, JSON.stringify(locations));
    
    if (locations && locations.length > 0) {
      localStorage.setItem(config.currentLocationKey, JSON.stringify(locations[0]));
    }
  },
  
  // Ausloggen
  logout() {
    localStorage.removeItem(config.tokenKey);
    localStorage.removeItem(config.userKey);
    localStorage.removeItem(config.locationsKey);
    localStorage.removeItem(config.currentLocationKey);
    
    window.location.reload();
  },
  
  // Überprüfe, ob eingeloggt
  isLoggedIn() {
    return !!localStorage.getItem(config.tokenKey);
  },
  
  // Hole Benutzerdaten
  getUser() {
    const userStr = localStorage.getItem(config.userKey);
    return userStr ? JSON.parse(userStr) : null;
  },
  
  // Hole Standorte
  getLocations() {
    const locationsStr = localStorage.getItem(config.locationsKey);
    return locationsStr ? JSON.parse(locationsStr) : [];
  },
  
  // Hole aktuellen Standort
  getCurrentLocation() {
    const locationStr = localStorage.getItem(config.currentLocationKey);
    return locationStr ? JSON.parse(locationStr) : null;
  },
  
  // Setze aktuellen Standort
  setCurrentLocation(location) {
    localStorage.setItem(config.currentLocationKey, JSON.stringify(location));
  }
};
