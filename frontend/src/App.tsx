import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store/store';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmailPage from './pages/EmailPage';
import ManageUsersPage from './pages/ManageUsersPage';
import ManageButtonsPage from './pages/ManageButtonsPage';
import PrivateRoute from './components/PrivateRoute';
import ResetPasswordPage from './pages/ResetPasswordPage';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/email" element={<EmailPage />} />
            <Route path="/manage-users" element={<ManageUsersPage />} />
            <Route path="/manage-buttons" element={<ManageButtonsPage />} />
          </Route>
        </Routes>
      </Router>
    </Provider>
  );
};

export default App;