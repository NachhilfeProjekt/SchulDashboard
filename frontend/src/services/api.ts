// In frontend/src/services/api.ts aktualisiere die getButtonsForUser-Funktion
export const getButtonsForUser = async (locationId: string) => {
  const token = localStorage.getItem('schul_dashboard_token');
  
  console.log(`getButtonsForUser wird aufgerufen mit locationId=${locationId}`);
  console.log(`Token vorhanden: ${!!token}`);
  
  if (!token) {
    console.error('Kein Token vorhanden für Button-Anfrage');
    throw new Error('Nicht authentifiziert');
  }
  
  try {
    const response = await axios.get(`${API_URL}/buttons/location/${locationId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`Button-Anfrage erfolgreich: ${response.data.length} Buttons erhalten`);
    return response.data;
  } catch (error) {
    console.error('Fehler beim Abrufen der Buttons:', error);
    
    // Fallback: Wenn die API-Anfrage fehlschlägt, erstelle einen lokalen Test-Button
    console.log('Erstelle lokalen Test-Button als Fallback');
    return [{
      id: 'local-test-button',
      name: 'Test-Button (lokal)',
      url: 'https://example.com',
      location_id: locationId,
      created_by: 'system',
      created_at: new Date().toISOString()
    }];
  }
};
    
    console.log(`Button-Anfrage erfolgreich: ${response.data.length} Buttons erhalten`);
    return response.data;
  } catch (error) {
    console.error('Fehler beim Abrufen der Buttons:', error);
    throw new Error('Fehler beim Abrufen der Buttons');
  }
};
