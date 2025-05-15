// frontend/src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from './store/store';
import store from './store/store';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmailPage from './pages/EmailPage';
import ManageUsersPage from './pages/ManageUsersPage';
import ManageButtonsPage from './pages/ManageButtonsPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import CreateLeadPage from './pages/CreateLeadPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { getCurrentUser, getUserLocations } from './services/api';
import { updateUser, setCurrentLocation } from './store/authSlice';

// PrivateRoute-Komponente, die den Auth-Status überprüft
const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { token, user, currentLocation } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    console.log("PrivateRoute: Token vorhanden?", !!token);
    console.log("PrivateRoute: User vorhanden?", !!user);
    console.log("PrivateRoute: CurrentLocation vorhanden?", !!currentLocation);

    const initializeUserData = async () => {
      if (token && !user) {
        try {
          // Benutzerdaten laden
          const userData = await getCurrentUser();
          dispatch(updateUser(userData));
          
          // Standortdaten laden
          const locationsData = await getUserLocations();
          if (locationsData && locationsData.length > 0) {
            dispatch(setCurrentLocation(locationsData[0]));
          }
        } catch (error) {
          console.error("Fehler beim Laden der Benutzerdaten:", error);
          // Bei Fehler zum Login umleiten
          localStorage.removeItem('schul_dashboard_token');
          localStorage.removeItem('schul_dashboard_user');
          localStorage.removeItem('schul_dashboard_locations');
          localStorage.removeItem('schul_dashboard_current_location');
          navigate('/login', { replace: true });
        }
      }
    };

    if (token) {
      initializeUserData();
    }
  }, [token, user, dispatch, navigate]);

  if (!token) {
    console.log("Keine Authentifizierung - Umleitung zur Login-Seite");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return element;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      
      <Route path="/" element={<PrivateRoute element={<Layout />} />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="email" element={<EmailPage />} />
        <Route path="manage-users" element={<ManageUsersPage />} />
        <Route path="manage-buttons" element={<ManageButtonsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="create-lead" element={<CreateLeadPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        <Route path="user-management" element={<UserManagementPage />} />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

const AppWithRedux = () => {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
};

export default AppWithRedux;
