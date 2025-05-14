// frontend/src/components/PrivateRoute.tsx
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { token } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  
  useEffect(() => {
    console.log("PrivateRoute wird gerendert für Pfad:", location.pathname);
    console.log("Authentifizierungsstatus:", token ? "Authentifiziert" : "Nicht authentifiziert");
  }, [location.pathname, token]);

  if (!token) {
    console.log("Keine Authentifizierung - Umleitung zur Login-Seite");
    return <Navigate to="/login" replace />;
  }

  console.log("Authentifiziert - Rendering der geschützten Route");
  return <>{children}</>;
};

export default PrivateRoute;
