import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const DashboardRouter = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;
  if (!user || !user.role) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'ADMIN':
      return <Navigate to="/dashboard/admin" replace />;
    case 'TECHNICIAN':
      return <Navigate to="/dashboard/technician" replace />;
    case 'USER':
    default:
      return <Navigate to="/dashboard/user" replace />;
  }
};

export default DashboardRouter;
