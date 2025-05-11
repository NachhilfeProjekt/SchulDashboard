import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { getUsersByLocation, createUser } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Button, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, FormControl, 
  InputLabel, Select, MenuItem, Chip, IconButton 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';

const ManageUsersPage: React.FC = () => {
  const { user: currentUser, currentLocation } = useSelector((state: RootState) => state.auth);
  const [users, setUsers] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    role: 'teacher',
    locations: currentLocation ? [currentLocation.id] : []
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (currentLocation) {
      const fetchUsers = async () => {
        const data = await getUsersByLocation(currentLocation.id);
        setUsers(data);
      };
      fetchUsers();
    }
  }, [currentLocation]);

  const handleCreateUser = async () => {
    try {
      await createUser(newUser.email, newUser.role, newUser.locations);
      setOpenDialog(false);
      setNewUser({
        email: '',
        role: 'teacher',
        locations: currentLocation ? [currentLocation.id] : []
      });
      
      if (currentLocation) {
        const data = await getUsersByLocation(currentLocation.id);
        setUsers(data);
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (window.confirm('Möchten Sie diesen Benutzer wirklich deaktivieren?')) {
      try {
        await api.delete(`/users/${userId}`);
        
        if (currentLocation) {
          const data = await getUsersByLocation(currentLocation.id);
          setUsers(data);
        }
      } catch (error) {
        console.error('Error deactivating user:', error);
      }
    }
  };

  if (!currentUser || !currentLocation) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Mitarbeiter verwalten
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Neuen Mitarbeiter anlegen
        </Button>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>E-Mail</TableCell>
                <TableCell>Rolle</TableCell>
                <TableCell>Standorte</TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={user.role} 
                      color={
                        user.role === 'developer' ? 'primary' : 
                        user.role === 'lead' ? 'secondary' : 'default'
                      } 
                    />
                  </TableCell>
                  <TableCell>
                    {user.locations?.map((loc: any) => (
                      <Chip key={loc.id} label={loc.name} sx={{ mr: 1, mb: 1 }} />
                    ))}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      onClick={() => navigate(`/edit-user/${user.id}`)}
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleDeactivateUser(user.id)}
                      disabled={
                        user.role === 'developer' && currentUser.role !== 'developer' ||
                        user.id === currentUser.id
                      }
                    >
                      <DeleteIcon color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Neuen Mitarbeiter anlegen</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="E-Mail"
              fullWidth
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              sx={{ mb: 3 }}
            />
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Rolle</InputLabel>
              <Select
                value={newUser.role}
                label="Rolle"
                onChange={(e) => setNewUser({...newUser, role: e.target.value as string})}
              >
                <MenuItem value="teacher">Lehrer</MenuItem>
                <MenuItem value="office">Büro</MenuItem>
                {currentUser.role === 'developer' && (
                  <MenuItem value="lead">Leitung</MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Abbrechen</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateUser}
            disabled={!newUser.email}
          >
            Erstellen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageUsersPage;