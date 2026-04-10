import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content-area">
        {/* Child dashboard routes render perfectly inside this boundary */}
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
