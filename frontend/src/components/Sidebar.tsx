// frontend/src/components/Sidebar.tsx
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import EmailIcon from '@mui/icons-material/Email';
import SettingsIcon from '@mui/icons-material/Settings';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const drawerWidth = 240;

const Sidebar: React.FC = () => {
  const { user, currentLocation } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("Sidebar: Aktueller Pfad:", location.pathname);
  }, [location]);

  const handleNavigation = (path: string) => {
    console.log(`Sidebar: Navigation zu ${path} angefordert`);
    try {
      navigate(path);
    } catch (error) {
      console.error(`Sidebar: Fehler bei Navigation zu ${path}:`, error);
      // Fallback
      window.location.href = path;
    }
  };

  if (!user || !currentLocation) return null;

  const isDeveloper = user.role === 'developer';
  const isLead = user.role === 'lead';

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => handleNavigation('/dashboard')}
              selected={location.pathname === '/dashboard'}
            >
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
          </ListItem>
          
          {(isDeveloper || isLead) && (
            <>
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={() => handleNavigation('/manage-users')}
                  selected={location.pathname === '/manage-users'}
                >
                  <ListItemIcon>
                    <PeopleIcon />
                  </ListItemIcon>
                  <ListItemText primary="Mitarbeiter" />
                </ListItemButton>
              </ListItem>
              
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={() => handleNavigation('/email')}
                  selected={location.pathname === '/email'}
                >
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText primary="E-Mails" />
                </ListItemButton>
              </ListItem>
              
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={() => handleNavigation('/manage-buttons')}
                  selected={location.pathname === '/manage-buttons'}
                >
                  <ListItemIcon>
                    <AddCircleIcon />
                  </ListItemIcon>
                  <ListItemText primary="Buttons" />
                </ListItemButton>
              </ListItem>
            </>
          )}
          
          {isDeveloper && (
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => handleNavigation('/admin')}
                selected={location.pathname === '/admin'}
              >
                <ListItemIcon>
                  <AdminPanelSettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Admin" />
              </ListItemButton>
            </ListItem>
          )}
          
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => handleNavigation('/settings')}
              selected={location.pathname === '/settings'}
            >
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Einstellungen" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
