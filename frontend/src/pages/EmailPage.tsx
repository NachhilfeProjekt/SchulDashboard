import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { getEmailTemplates, sendBulkEmails, getSentEmails } from '../services/api';
import { 
  Box, Button, Typography, TextField, Grid, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Select, MenuItem, 
  FormControl, InputLabel, Chip, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface Recipient {
  email: string;
  name: string;
}

interface SentEmail {
  id: string;
  recipient_email: string;
  recipient_name: string;
  status: 'sent' | 'failed' | 'resent';
  sent_at: string;
}

const EmailPage: React.FC = () => {
  const { currentLocation, user } = useSelector((state: RootState) => state.auth);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [newRecipient, setNewRecipient] = useState<Recipient>({ email: '', name: '' });
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [openPreview, setOpenPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState<{subject: string, body: string} | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (currentLocation) {
      const fetchData = async () => {
        const [templatesData, emailsData] = await Promise.all([
          getEmailTemplates(currentLocation.id),
          getSentEmails(currentLocation.id)
        ]);
        setTemplates(templatesData);
        setSentEmails(emailsData);
      };
      fetchData();
    }
  }, [currentLocation]);

  const handleAddRecipient = () => {
    if (newRecipient.email && newRecipient.name) {
      setRecipients([...recipients, newRecipient]);
      setNewRecipient({ email: '', name: '' });
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      processPastedData(text);
    } catch (error) {
      console.error('Error reading clipboard:', error);
    }
  };

  const processPastedData = (text: string) => {
    const rows = text.split('\n');
    const newRecipients = rows
      .filter(row => row.trim() !== '')
      .map(row => {
        const separator = row.includes('\t') ? '\t' : 
                         row.includes(';') ? ';' : ',';
        const parts = row.split(separator);
        
        return {
          name: parts[0]?.trim() || '',
          email: parts[1]?.trim() || parts[0]?.trim() || ''
        };
      })
      .filter(recipient => recipient.email.includes('@'));
    
    setRecipients([...recipients, ...newRecipients]);
  };

  const handleSendEmails = async () => {
    if (!selectedTemplate || recipients.length === 0 || !currentLocation) return;
    
    setIsSending(true);
    try {
      await sendBulkEmails(recipients, selectedTemplate);
      setRecipients([]);
      const emailsData = await getSentEmails(currentLocation.id);
      setSentEmails(emailsData);
    } catch (error) {
      console.error('Error sending emails:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleResendFailed = async () => {
    if (!currentLocation) return;
    
    const failedEmails = sentEmails
      .filter(email => email.status === 'failed')
      .map(email => email.id);
    
    if (failedEmails.length === 0) return;
    
    try {
      await Promise.all([
        ...failedEmails.map(id => 
          fetch(`${process.env.VITE_API_URL}/emails/resend`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ emailIds: [id] })
          })
        ),
        getSentEmails(currentLocation.id).then(setSentEmails)
      ]);
    } catch (error) {
      console.error('Error resending emails:', error);
    }
  };

  const showPreview = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (template) {
      setPreviewContent({
        subject: template.subject.replace('{{name}}', 'Max Mustermann'),
        body: template.body.replace('{{name}}', 'Max Mustermann')
      });
      setOpenPreview(true);
    }
  };

  const filteredEmails = sentEmails.filter(email => 
    email.recipient_email.toLowerCase().includes(filter.toLowerCase()) || 
    email.recipient_name.toLowerCase().includes(filter.toLowerCase())
  );

  const failedEmailsCount = sentEmails.filter(e => e.status === 'failed').length;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        E-Mails versenden
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Vorlage auswählen
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>E-Mail Vorlage</InputLabel>
              <Select
                value={selectedTemplate}
                label="E-Mail Vorlage"
                onChange={(e) => setSelectedTemplate(e.target.value as string)}
              >
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {selectedTemplate && (
              <Button 
                variant="outlined" 
                onClick={showPreview}
                fullWidth
                sx={{ mb: 3 }}
              >
                Vorschau anzeigen
              </Button>
            )}
            
            <Typography variant="h6" gutterBottom>
              Empfänger hinzufügen
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Name"
                value={newRecipient.name}
                onChange={(e) => setNewRecipient({...newRecipient, name: e.target.value})}
                fullWidth
              />
              <TextField
                label="E-Mail"
                value={newRecipient.email}
                onChange={(e) => setNewRecipient({...newRecipient, email: e.target.value})}
                fullWidth
              />
            </Box>
            
            <Button 
              variant="contained" 
              onClick={handleAddRecipient}
              disabled={!newRecipient.email || !newRecipient.name}
              fullWidth
              sx={{ mb: 3 }}
            >
              Empfänger hinzufügen
            </Button>
            
            <Typography variant="subtitle1" gutterBottom>
              Aus Zwischenablage einfügen:
            </Typography>
            
            <Tooltip title="Fügt Daten aus der Zwischenablage als Empfänger ein (Format: Name, E-Mail)">
              <Button 
                variant="outlined" 
                startIcon={<ContentPasteIcon />}
                onClick={handlePasteFromClipboard}
                fullWidth
              >
                Aus Zwischenablage einfügen
              </Button>
            </Tooltip>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Zu versendende E-Mails
              </Typography>
              <Chip 
                label={`${recipients.length} Empfänger`} 
                color="primary"
              />
            </Box>
            
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>E-Mail</TableCell>
                    <TableCell width={100}>Aktion</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recipients.map((recipient, index) => (
                    <TableRow key={index}>
                      <TableCell>{recipient.name}</TableCell>
                      <TableCell>{recipient.email}</TableCell>
                      <TableCell>
                        <Button 
                          color="error"
                          size="small"
                          onClick={() => {
                            const newRecipients = [...recipients];
                            newRecipients.splice(index, 1);
                            setRecipients(newRecipients);
                          }}
                        >
                          Entfernen
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<SendIcon />}
              onClick={handleSendEmails}
              disabled={!selectedTemplate || recipients.length === 0 || isSending}
              fullWidth
              size="large"
              sx={{ mt: 3 }}
            >
              {isSending ? 'Wird gesendet...' : 'E-Mails versenden'}
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 2 
            }}>
              <Typography variant="h6">
                Versandhistorie
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Filter"
                  size="small"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  sx={{ width: 200 }}
                />
                
                <IconButton 
                  onClick={() => currentLocation && getSentEmails(currentLocation.id).then(setSentEmails)}
                >
                  <RefreshIcon />
                </IconButton>
                
                {failedEmailsCount > 0 && (
                  <Button 
                    variant="contained" 
                    color="secondary"
                    onClick={handleResendFailed}
                    startIcon={<ErrorIcon />}
                  >
                    {failedEmailsCount} fehlgeschlagene erneut senden
                  </Button>
                )}
              </Box>
            </Box>
            
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={150}>Status</TableCell>
                    <TableCell>Empfänger</TableCell>
                    <TableCell>E-Mail</TableCell>
                    <TableCell width={180}>Zeitpunkt</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmails.map((email) => (
                    <TableRow key={email.id}>
                      <TableCell>
                        <Chip 
                          icon={email.status === 'failed' ? <ErrorIcon /> : <CheckCircleIcon />}
                          label={email.status === 'failed' ? 'Fehlgeschlagen' : 
                                email.status === 'resent' ? 'Erneut gesendet' : 'Gesendet'}
                          color={email.status === 'failed' ? 'error' : 'success'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{email.recipient_name}</TableCell>
                      <TableCell>{email.recipient_email}</TableCell>
                      <TableCell>
                        {new Date(email.sent_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
      
      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="md" fullWidth>
        <DialogTitle>E-Mail Vorschau</DialogTitle>
        <DialogContent>
          {previewContent && (
            <Box