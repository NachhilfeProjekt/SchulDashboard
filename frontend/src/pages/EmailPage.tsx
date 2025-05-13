import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { getEmailTemplates, sendBulkEmails, getSentEmails } from '../services/api';
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
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';

const EmailPage: React.FC = () => {
  const { currentLocation } = useSelector((state: RootState) => state.auth);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [newRecipient, setNewRecipient] = useState({ email: '', name: '' });

  useEffect(() => {
    const fetchTemplates = async () => {
      if (currentLocation) {
        const fetchedTemplates = await getEmailTemplates(currentLocation.id);
        setTemplates(fetchedTemplates);
      }
    };
    fetchTemplates();
  }, [currentLocation]);

  const handleAddRecipient = () => {
    if (newRecipient.email && newRecipient.name) {
      setRecipients([...recipients, newRecipient]);
      setNewRecipient({ email: '', name: '' });
    }
  };

  const handleSendEmails = async () => {
    try {
      await sendBulkEmails(selectedTemplate, recipients);
      alert('E-Mails erfolgreich gesendet!');
    } catch (error) {
      console.error('Fehler beim Senden der E-Mails:', error);
    }
  };

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4">E-Mail-Versand</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Vorlage</InputLabel>
            <Select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
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
          <TextField
            label="E-Mail hinzufügen"
            fullWidth
            value={newRecipient.email}
            onChange={(e) =>
              setNewRecipient({ ...newRecipient, email: e.target.value })
            }
          />
          <TextField
            label="Name hinzufügen"
            fullWidth
            value={newRecipient.name}
            onChange={(e) =>
              setNewRecipient({ ...newRecipient, name: e.target.value })
            }
          />
          <Button onClick={handleAddRecipient} startIcon={<AddIcon />}>
            Empfänger hinzufügen
          </Button>
        </Grid>
        <Grid item xs={12}>
          <Button
            onClick={handleSendEmails}
            variant="contained"
            startIcon={<SendIcon />}
          >
            E-Mails senden
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmailPage;
