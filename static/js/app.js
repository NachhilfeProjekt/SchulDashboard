async function handleLogin(e) {
  e.preventDefault();
  console.log('Login form submitted');
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const loginMessage = document.getElementById('login-message');
  
  loginMessage.textContent = '';
  loginMessage.className = 'message';
  
  try {
    const loadingContainer = document.getElementById('loading-container');
    if (loadingContainer) loadingContainer.classList.remove('hidden');
    
    console.log('Attempting login with', { email, password: '***' });
    
    // Verwende XMLHttpRequest statt fetch (funktioniert oft besser mit CORS)
    const loginData = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${config.apiUrl}/auth/login`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve(data);
            } catch (e) {
              reject(new Error('Ungültige Antwort vom Server'));
            }
          } else {
            reject(new Error(`Server antwortete mit Status ${xhr.status}: ${xhr.statusText}`));
          }
        }
      };
      xhr.onerror = function() {
        reject(new Error('Netzwerkfehler beim Login-Versuch'));
      };
      xhr.send(JSON.stringify({ email, password }));
    });
    
    console.log('Login successful, storing data', loginData);
    
    // Token und Benutzerdaten speichern
    localStorage.setItem(config.tokenKey, loginData.token);
    localStorage.setItem(config.userKey, JSON.stringify(loginData.user));
    
    // Simuliere Standorte für den Test (im Produktionsbetrieb sollten diese vom Server kommen)
    const mockLocations = [{
      id: 'loc-1',
      name: 'Hauptstandort',
      createdAt: new Date().toISOString()
    }];
    localStorage.setItem(config.locationsKey, JSON.stringify(mockLocations));
    localStorage.setItem(config.currentLocationKey, JSON.stringify(mockLocations[0]));
    
    // App neu initialisieren
    window.location.reload();
  } catch (error) {
    console.error('Login error:', error);
    loginMessage.textContent = error.message || 'Anmeldung fehlgeschlagen';
    loginMessage.className = 'message error';
  } finally {
    const loadingContainer = document.getElementById('loading-container');
    if (loadingContainer) loadingContainer.classList.add('hidden');
  }
}
