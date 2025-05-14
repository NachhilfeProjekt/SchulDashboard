import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ManageUsersPage from './pages/ManageUsersPage';
import EmailPage from './pages/EmailPage';
import ManageButtonsPage from './pages/ManageButtonsPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import CreateLeadPage from './pages/CreateLeadPage';
import PrivateRoute from './components/PrivateRoute';
// AppInitializer Komponente zum Initialisieren des App-Status
const AppInitializer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  useEffect(() => {
    initializeApp(dispatch);
  }, [dispatch]);
  
  return <Outlet />;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/manage-users" element={<ManageUsersPage />} />
          <Route path="/email" element={<EmailPage />} />
          <Route path="/manage-buttons" element={<ManageButtonsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/create-lead" element={<CreateLeadPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
