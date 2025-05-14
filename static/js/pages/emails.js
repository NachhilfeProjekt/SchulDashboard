// Emails Page
const emailsPage = {
  async init(container) {
    container.innerHTML = `
      <div class="page-title">
        <h2>E-Mail-Versand</h2>
      </div>
      
      <div class="tabs">
        <div class="tab active" data-tab="send-emails">Neue E-Mails</div>
        <div class="tab" data-tab="sent-emails">Gesendete E-Mails</div>
      </div>
      
      <div class="tab-content active" id="send-emails-content">
        <div class="card">
          <h3 class="card-title">E-Mail an Empfänger senden</h3>
          <form id="email-form">
            <div class="input-group">
              <label for="email-template">Vorlage</label>
              <select id="email-template" required>
                <option value="">-- Vorlage auswählen --</option>
              </select>
            </div>
            
            <h4>Empfänger</h4>
            <div class="recipients-container">
              <div class="recipient-inputs">
                <div class="input-group">
                  <label for="recipient-email">E-Mail</label>
                  <input type="email" id="recipient-email">
                </div>
                <div class="input-group">
                  <label for="recipient-name">Name</label>
                  <input type="text" id="recipient-name">
                </div>
                <button type="button" class="btn btn-outline" id="add-recipient-btn">
                  <i class="material-icons">add</i> Hinzufügen
                </button>
              </div>
              
              <div class="table-container" id="recipients-table-container" style="display: none;">
                <table>
                  <thead>
                    <tr>
                      <th>E-Mail</th>
                      <th>Name</th>
                      <th>Aktionen</th>
                    </tr>
                  </thead>
                  <tbody id="recipients-table-body">
                  </tbody>
                </table>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" id="send-emails-btn" disabled>
                <i class="material-icons">send</i> E-Mails senden
              </button>
            </div>
          </form>
          <div id="email-form-message" class="message"></div>
        </div>
      </div>
      
      <div class="tab-content" id="sent-emails-content">
        <div class="card">
          <div class="card-title-with-action">
            <h3 class="card-title">Gesendete E-Mails</h3>
            <button class="btn btn-outline" id="refresh-emails-btn">
              <i class="material-icons">refresh</i> Aktualisieren
            </button>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Empfänger</th>
                  <th>E-Mail</th>
                  <th>Status</th>
                  <th>Gesendet am</th>
                </tr>
              </thead>
              <tbody id="sent-emails-table-body">
                <tr>
                  <td colspan="4" class="text-center">Lädt...</td>
                </tr>
              </tbody>
            </table>
          </div>
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
      .recipient-inputs {
        display: flex;
        gap: 10px;
        align-items: flex-end;
        margin-bottom: 20px;
      }
      .recipient-inputs .input-group {
        flex: 1;
        margin-bottom: 0;
      }
      .card-title-with-action {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      .badge {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }
      .badge.sent {
        background-color: #e8f5e9;
        color: #2e7d32;
      }
      .badge.failed {
        background-color: #ffebee;
        color: #c62828;
      }
      .badge.resent {
        background-color: #fff8e1;
        color: #f57f17;
      }
    `;
    document.head.appendChild(style);
    
    // Event-Listener
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
    
    document.getElementById('add-recipient-btn').addEventListener('click', this.addRecipient);
    document.getElementById('email-form').addEventListener('submit', this.handleSendEmails);
    document.getElementById('refresh-emails-btn').addEventListener('click', this.loadSentEmails);
    
    // Daten laden
    await Promise.all([
      this.loadEmailTemplates(),
      this.loadSentEmails()
    ]);
  },
  
  async loadEmailTemplates() {
    const select = document.getElementById('email-template');
    const currentLocation = auth.getCurrentLocation();
    
    if (!currentLocation) {
      select.innerHTML = '<option value="">Kein Standort ausgewählt</option>';
      return;
    }
    
    dashboard.showLoading();
    
    try {
      const templates = await api.getEmailTemplates(currentLocation.id);
      
      select.innerHTML = '<option value="">-- Vorlage auswählen --</option>';
      
      if (templates.length > 0) {
        templates.forEach(template => {
          const option = document.createElement('option');
          option.value = template.id;
          option.textContent = template.name;
          select.appendChild(option);
        });
      } else {
        select.innerHTML += '<option value="" disabled>Keine Vorlagen gefunden</option>';
      }
    } catch (error) {
      console.error('Fehler beim Laden der E-Mail-Vorlagen:', error);
      select.innerHTML = '<option value="">Fehler beim Laden der Vorlagen</option>';
    } finally {
      dashboard.hideLoading();
    }
  },
  
  async loadSentEmails() {
    const tableBody = document.getElementById('sent-emails-table-body');
    const currentLocation = auth.getCurrentLocation();
    
    if (!currentLocation) {
      tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Kein Standort ausgewählt</td></tr>';
      return;
    }
    
    dashboard.showLoading();
    
    try {
      // Diese API-Funktion muss noch implementiert werden
      const sentEmails = []; // Vorläufig leer
      
      if (sentEmails.length > 0) {
        tableBody.innerHTML = sentEmails.map(email => `
          <tr>
            <td>${email.recipient_name}</td>
            <td>${email.recipient_email}</td>
            <td>
              <span class="badge ${email.status}">
                ${email.status === 'sent' ? 'Gesendet' : 
                  email.status === 'resent' ? 'Erneut gesendet' : 'Fehlgeschlagen'}
              </span>
            </td>
            <td>${new Date(email.sent_at).toLocaleString('de-DE')}</td>
          </tr>
        `).join('');
      } else {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Keine gesendeten E-Mails gefunden</td></tr>';
      }
    } catch (error) {
      tableBody.innerHTML = `<tr><td colspan="4" class="text-center error">Fehler: ${error.message}</td></tr>`;
    } finally {
      dashboard.hideLoading();
    }
  },
  
  // Globale Variable für Empfängerliste
  recipients: [],
  
  addRecipient() {
    const email = document.getElementById('recipient-email').value;
    const name = document.getElementById('recipient-name').value;
    
    if (!email || !name) {
      alert('Bitte E-Mail und Name eingeben');
      return;
    }
    
    // Neuen Empfänger hinzufügen
    emailsPage.recipients.push({ email, name });
    
    // Eingabefelder leeren
    document.getElementById('recipient-email').value = '';
    document.getElementById('recipient-name').value = '';
    
    // Tabelle aktualisieren
    emailsPage.updateRecipientsTable();
    
    // Send-Button aktivieren, wenn mindestens ein Empfänger hinzugefügt wurde
    document.getElementById('send-emails-btn').disabled = false;
  },
  
  updateRecipientsTable() {
    const tableContainer = document.getElementById('recipients-table-container');
    const tableBody = document.getElementById('recipients-table-body');
    
    if (this.recipients.length > 0) {
      tableContainer.style.display = 'block';
      
      tableBody.innerHTML = this.recipients.map((recipient, index) => `
        <tr>
          <td>${recipient.email}</td>
          <td>${recipient.name}</td>
          <td>
            <button type="button" class="btn btn-outline remove-recipient" data-index="${index}">
              <i class="material-icons">delete</i>
            </button>
          </td>
        </tr>
      `).join('');
      
      // Event-Listener für Lösch-Buttons
      document.querySelectorAll('.remove-recipient').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.currentTarget.getAttribute('data-index'));
          this.recipients.splice(index, 1);
          this.updateRecipientsTable();
          
          // Send-Button deaktivieren, wenn keine Empfänger mehr übrig
          document.getElementById('send-emails-btn').disabled = this.recipients.length === 0;
        });
      });
    } else {
      tableContainer.style.display = 'none';
    }
  },
  
  async handleSendEmails(e) {
    e.preventDefault();
    
    const templateId = document.getElementById('email-template').value;
    const messageElement = document.getElementById('email-form-message');
    
    if (!templateId) {
      messageElement.textContent = 'Bitte eine Vorlage auswählen';
      messageElement.className = 'message error';
      return;
    }
    
    if (emailsPage.recipients.length === 0) {
      messageElement.textContent = 'Bitte mindestens einen Empfänger hinzufügen';
      messageElement.className = 'message error';
      return;
    }
    
    dashboard.showLoading();
    
    try {
      await api.sendBulkEmails(templateId, emailsPage.recipients);
      
      messageElement.textContent = 'E-Mails wurden erfolgreich versendet.';
      messageElement.className = 'message success';
      
      // Empfängerliste leeren
      emailsPage.recipients = [];
      emailsPage.updateRecipientsTable();
      
      // Send-Button deaktivieren
      document.getElementById('send-emails-btn').disabled = true;
      
      // Tab wechseln nach 2 Sekunden
      setTimeout(() => {
        document.querySelector('.tab[data-tab="sent-emails"]').click();
        emailsPage.loadSentEmails();
      }, 2000);
    } catch (error) {
      messageElement.textContent = error.message || 'Fehler beim Versenden der E-Mails';
      messageElement.className = 'message error';
    } finally {
      dashboard.hideLoading();
    }
  }
};
