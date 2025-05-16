// frontend/src/pages/EmailPage.tsx
import React, { useState, useEffect, useRef } from 'react';
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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  OutlinedInput,
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ReplayIcon from '@mui/icons-material/Replay';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ClearIcon from '@mui/icons-material/Clear';
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
  const [filteredEmails, setFilteredEmails] = useState<SentEmail[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [confirmResendOpen, setConfirmResendOpen] = useState(false);
  const pasteTextAreaRef = useRef<HTMLTextAreaElement>(null);

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
            setFilteredEmails(fetchedSentEmails);
          } catch (emailsError) {
            console.error('Error fetching sent emails:', emailsError);
            // Silent failure - zeigt einfach eine leere Liste an
            setSentEmails([]);
            setFilteredEmails([]);
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

  // Filter e-mails when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEmails(sentEmails);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = sentEmails.filter(email => 
        email.recipient_email.toLowerCase().includes(lowercaseQuery) || 
        email.recipient_name.toLowerCase().includes(lowercaseQuery)
      );
      setFilteredEmails(filtered);
    }
  }, [searchQuery, sentEmails]);

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
      setFilteredEmails(fetchedSentEmails);
      
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
      setFilteredEmails(fetchedSentEmails);
    } catch (error) {
      console.error('Error refreshing sent emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEmailSelection = (emailId: string) => {
    setSelectedEmails(prev => {
      if (prev.includes(emailId)) {
        return prev.filter(id => id !== emailId);
      } else {
        return [...prev, emailId];
      }
    });
  };

  const handleResendEmails = async () => {
    if (!selectedEmails.length || !currentLocation) return;
    setLoading(true);
    setConfirmResendOpen(false);
    try {
      await resendFailedEmails(selectedEmails);
      // Aktualisiere die Liste der gesendeten E-Mails
      const fetchedSentEmails = await getSentEmails(currentLocation.id);
      setSentEmails(fetchedSentEmails);
      setFilteredEmails(fetchedSentEmails);
      setSuccess('E-Mails werden erneut gesendet.');
      setSelectedEmails([]);
    } catch (error) {
      console.error('Fehler beim erneuten Senden der E-Mails:', error);
      setError('Fehler beim erneuten Senden der E-Mails. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasteDialogOpen = () => {
    setPasteDialogOpen(true);
    setPasteContent('');
    // Focus das Textfeld nach dem Öffnen des Dialogs
    setTimeout(() => {
      if (pasteTextAreaRef.current) {
        pasteTextAreaRef.current.focus();
      }
    }, 100);
  };

  const handlePasteDialogClose = () => {
    setPasteDialogOpen(false);
  };

  const processClipboardData = () => {
    if (!pasteContent) {
      handlePasteDialogClose();
      return;
    }

    const lines = pasteContent.split(/[\r\n]+/).filter(line => line.trim());
    const newRecipients: {email: string, name: string}[] = [];

    lines.forEach(line => {
      // Erkenne verschiedene Formate: email,name oder email\tname oder einfach nur email
      let email = '';
      let name = '';

      // Prüfe auf Tab oder Komma als Trennzeichen
      if (line.includes('\t')) {
        [email, name] = line.split('\t', 2);
      } else if (line.includes(',')) {
        [email, name] = line.split(',', 2);
      } else if (line.includes(';')) {
        [email, name] = line.split(';', 2);
      } else {
        // Nur E-Mail
        email = line.trim();
        // Extrahiere Name aus E-Mail (vor dem @)
        const namePart = email.split('@')[0];
        name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      }

      // Validiere E-Mail
      if (email && email.includes('@') && email.includes('.')) {
        newRecipients.push({
          email: email.trim(),
          name: name.trim() || 'Empfänger' // Fallback, wenn kein Name angegeben wurde
        });
      }
    });

    if (newRecipients.length > 0) {
      setRecipients([...recipients, ...newRecipients]);
      setSuccess(`${newRecipients.length} Empfänger hinzugefügt`);
    } else {
      setError('Keine gültigen E-Mail-Adressen gefunden');
    }

    handlePasteDialogClose();
  };

  const clearAllRecipients = () => {
    setRecipients([]);
  };

  const getFailedEmailsCount = () => {
    return sentEmails.filter(email => email.status === 'failed').length;
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
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                Gesendete E-Mails
                {getFailedEmailsCount() > 0 && (
                  <Chip 
                    label={getFailedEmailsCount()} 
                    color="error" 
                    size="small" 
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            } 
            id="email-tab-1" 
            aria-controls="email-tabpanel-1" 
          />
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Empfänger ({recipients.length})</Typography>
                <Box>
                  <Button 
                    variant="outlined" 
                    startIcon={<ContentPasteIcon />} 
                    onClick={handlePasteDialogOpen}
                    sx={{ mr: 1 }}
                  >
                    Aus Zwischenablage einfügen
                  </Button>
                  {recipients.length > 0 && (
                    <Button 
                      variant="outlined" 
                      color="error" 
                      startIcon={<ClearIcon />} 
                      onClick={clearAllRecipients}
                    >
                      Alle entfernen
                    </Button>
                  )}
                </Box>
              </Box>
              
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
                <TableContainer component={Paper} sx={{ mb: 2, maxHeight: '400px', overflow: 'auto' }}>
                  <Table size="small" stickyHeader>
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
          <Typography variant="h6">Gesendete E-Mails</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl variant="outlined" size="small" sx={{ width: '250px' }}>
              <OutlinedInput
                placeholder="E-Mail oder Name suchen"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                }
                endAdornment={
                  searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchQuery('')}
                        edge="end"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }
              />
            </FormControl>
            
            {selectedEmails.length > 0 && (
              <Button 
                variant="outlined" 
                color="primary"
                startIcon={<ReplayIcon />}
                onClick={() => setConfirmResendOpen(true)}
                disabled={loading}
              >
                Ausgewählte erneut senden ({selectedEmails.length})
              </Button>
            )}
            
            <Button 
              startIcon={<RefreshIcon />} 
              onClick={refreshSentEmails} 
              disabled={loading}
              variant="outlined"
            >
              Aktualisieren
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper} sx={{ maxHeight: '600px', overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox"></TableCell>
                <TableCell>Empfänger</TableCell>     
                 <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Gesendet am</TableCell>
                <TableCell>Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmails.map((email) => (
                <TableRow key={email.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedEmails.includes(email.id)}
                      onChange={() => handleToggleEmailSelection(email.id)}
                      disabled={email.status !== 'failed'}
                      sx={{ mr: 1 }}
                    />
                    {email.recipient_email}
                  </TableCell>
                  <TableCell>{email.recipient_name}</TableCell>
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
                  <TableCell>
                    {email.status === 'failed' && (
                      <Tooltip title="Erneut senden">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            setSelectedEmails([email.id]);
                            setConfirmResendOpen(true);
                          }}
                        >
                          <ReplayIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredEmails.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">Keine gesendeten E-Mails gefunden</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Paste Dialog */}
      <Dialog
        open={pasteDialogOpen}
        onClose={handlePasteDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>E-Mail-Adressen aus der Zwischenablage einfügen</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Fügen Sie E-Mail-Adressen ein (eine pro Zeile). Formate: "email@beispiel.de, Name" oder "email@beispiel.de"
          </Typography>
          <TextField
            inputRef={pasteTextAreaRef}
            autoFocus
            multiline
            rows={10}
            fullWidth
            variant="outlined"
            placeholder="email@beispiel.de, Name Person 1&#10;email2@beispiel.de, Name Person 2&#10;email3@beispiel.de"
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePasteDialogClose}>Abbrechen</Button>
          <Button 
            variant="contained" 
            onClick={processClipboardData}
            disabled={!pasteContent.trim()}
          >
            Verarbeiten
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bestätigungsdialog für erneutes Senden */}
      <Dialog
        open={confirmResendOpen}
        onClose={() => setConfirmResendOpen(false)}
      >
        <DialogTitle>E-Mails erneut senden</DialogTitle>
        <DialogContent>
          <Typography>
            Möchten Sie {selectedEmails.length} fehlgeschlagene E-Mail(s) erneut senden?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmResendOpen(false)}>
            Abbrechen
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleResendEmails}
            disabled={loading}
          >
            Erneut senden
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailPage;
