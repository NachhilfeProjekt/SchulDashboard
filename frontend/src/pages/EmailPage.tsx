// frontend/src/pages/EmailPage.tsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { getEmailTemplates, sendBulkEmails, getSentEmails, resendFailedEmails } from '../services/api';
import {
  Box,
  Button,
  Typography,
  TextField,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Chip,
  Tab,
  Tabs,
  Alert,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import { SentEmail } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`email-tabpanel-${index}`}
      aria-labelledby={`email-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const EmailPage: React.FC = () => {
  const { user, currentLocation } = useSelector((state: RootState) => state.auth);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [recipients, setRecipients] = useState<{email: string, name: string}[]>([]);
  const [newRecipient, setNewRecipient] = useState({ email: '', name: '' });
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (currentLocation) {
        setLoading(true);
        try {
          // Templates abrufen
          try {
            const fetchedTemplates = await getEmailTemplates(currentLocation.id);
            setTemplates(fetchedTemplates);
          } catch (templateError) {
            console.error('Error fetching email templates:', templateError);
            // Silent failure - zeigt einfach eine leere Liste an
            setTemplates([]);
          }
          
          // Gesendete E-Mails abrufen
          try {
            const fetchedSentEmails = await getSentEmails(currentLocation.id);
            setSentEmails(fetchedSentEmails);
          } catch (emailsError) {
            console.error('Error fetching sent emails:', emailsError);
            // Silent failure - zeigt einfach eine leere Liste an
            setSentEmails([]);
          }
        } catch (error) {
          console.error('Error fetching email data:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchData();
  }, [currentLocation]);

  const handleAddRecipient = () => {
    if (newRecipient.email && newRecipient.name) {
      setRecipients([...recipients, newRecipient]);
      setNewRecipient({ email: '', name: '' });
    }
  };

  const handleRemoveRecipient = (index: number) => {
    const newRecipients = [...recipients];
    newRecipients.splice(index, 1);
    setRecipients(newRecipients);
  };

  const handleSendEmails = async () => {
    if (!selectedTemplate || recipients.length === 0 || !currentLocation) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await sendBulkEmails(selectedTemplate, recipients);
      setRecipients([]);
      setSelectedTemplate('');
      
      setSuccess('E-Mails werden versendet.');
      
      // Refresh sent emails list
      const fetchedSentEmails = await getSentEmails(currentLocation.id);
      setSentEmails(fetchedSentEmails);
      
      // Switch to sent emails tab
      setTabValue(1);
    } catch (error) {
      console.error('Fehler beim Senden der E-Mails:', error);
      setError('Fehler beim Senden der E-Mails. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const refreshSentEmails = async () => {
    if (!currentLocation) return;
    
    setLoading(true);
    try {
      const fetchedSentEmails = await getSentEmails(currentLocation.id);
      setSentEmails(fetchedSentEmails);
    } catch (error) {
      console.error('Error refreshing sent emails:', error);
    } finally {
      setLoading(false);
    }
  };

  // Füge diese Funktion für das erneute Senden fehlgeschlagener E-Mails hinzu
  const handleResendEmails = async (emailIds: string[]) => {
    if (!emailIds.length || !currentLocation) return;
    
    setLoading(true);
    try {
      await resendFailedEmails(emailIds);
      
      // Aktualisiere die Liste der gesendeten E-Mails
      const fetchedSentEmails = await getSentEmails(currentLocation.id);
      setSentEmails(fetchedSentEmails);
      
      setSuccess('E-Mails werden erneut gesendet.');
    } catch (error) {
      console.error('Fehler beim erneuten Senden der E-Mails:', error);
      setError('Fehler beim erneuten Senden der E-Mails. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !currentLocation) {
    return (
      <Box sx={{ padding: 2 }}>
        <Typography variant="h5">Laden...</Typography>
        <CircularProgress />
      </Box>
    );
  }

  if (user.role !== 'developer' && user.role !== 'lead') {
    return (
      <Box sx={{ padding: 2 }}>
        <Typography variant="h5">Keine Berechtigung</Typography>
        <Typography>Sie haben keine Berechtigung, diese Seite zu sehen.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4" gutterBottom>E-Mail-Versand</Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="email tabs">
          <Tab label="Neue E-Mails" id="email-tab-0" aria-controls="email-tabpanel-0" />
          <Tab label="Gesendete E-Mails" id="email-tab-1" aria-controls="email-tabpanel-1" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Vorlage</InputLabel>
                <Select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value as string)}
                  label="Vorlage"
                  disabled={loading}
                >
                  {templates.map((template: any) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Empfänger</Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  label="E-Mail"
                  value={newRecipient.email}
                  onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                  disabled={loading}
                  sx={{ flexGrow: 1 }}
                />
                <TextField
                  label="Name"
                  value={newRecipient.name}
                  onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                  disabled={loading}
                  sx={{ flexGrow: 1 }}
                />
                <Button 
                  variant="outlined" 
                  startIcon={<AddIcon />} 
                  onClick={handleAddRecipient}
                  disabled={!newRecipient.email || !newRecipient.name || loading}
                >
                  Hinzufügen
                </Button>
              </Box>
              
              {recipients.length > 0 && (
                <TableContainer component={Paper} sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>E-Mail</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell align="right">Aktionen</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recipients.map((recipient, index) => (
                        <TableRow key={index}>
                          <TableCell>{recipient.email}</TableCell>
                          <TableCell>{recipient.name}</TableCell>
                          <TableCell align="right">
                            <IconButton onClick={() => handleRemoveRecipient(index)} size="small" disabled={loading}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={handleSendEmails}
                disabled={!selectedTemplate || recipients.length === 0 || loading}
              >
                E-Mails senden ({recipients.length})
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Gesendete E-Mails</Typography>
          <Button startIcon={<RefreshIcon />} onClick={refreshSentEmails} disabled={loading}>
            Aktualisieren
          </Button>
        </Box>
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Empfänger</TableCell>
                <TableCell>E-Mail</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Gesendet am</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sentEmails.map((email) => (
                <TableRow key={email.id}>
                  <TableCell>{email.recipient_name}</TableCell>
                  <TableCell>{email.recipient_email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={
                        email.status === 'sent' ? 'Gesendet' :
                        email.status === 'resent' ? 'Erneut gesendet' :
                        'Fehlgeschlagen'
                      }
                      color={
                        email.status === 'sent' || email.status === 'resent' ? 'success' :
                        'error'
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(email.sent_at).toLocaleString('de-DE')}
                  </TableCell>
                </TableRow>
              ))}
              {sentEmails.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">Keine gesendeten E-Mails gefunden</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>
    </Box>
  );
};

export default EmailPage;
