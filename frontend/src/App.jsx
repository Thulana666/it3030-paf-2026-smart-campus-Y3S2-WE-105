import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Notifications from './pages/Notifications';
import DashboardRouter from './pages/DashboardRouter';
import UserDashboard from './pages/dashboards/UserDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import TechnicianDashboard from './pages/dashboards/TechnicianDashboard';
import Profile from './pages/Profile';
import DashboardLayout from './components/DashboardLayout';
import BookingSystem from './pages/modules/BookingSystem';
import Facilities from './pages/modules/Facilities';
import IncidentTickets from './pages/modules/IncidentTickets';
import OperationalSchedule from './pages/modules/OperationalSchedule';
import RepairProgress from './pages/modules/RepairProgress';
import UserManagement from './pages/admin/UserManagement';
import ActivationRequests from './pages/admin/ActivationRequests';
import AdminBookingDashboard from './pages/admin/AdminBookingDashboard';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/login" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<DashboardRouter />} />
                <Route path="user" element={<ProtectedRoute allowedRoles={['USER']}><UserDashboard /></ProtectedRoute>} />
                <Route path="admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="technician" element={<ProtectedRoute allowedRoles={['TECHNICIAN']}><TechnicianDashboard /></ProtectedRoute>} />
                
                <Route path="bookings" element={<BookingSystem />} />
                <Route path="facilities" element={<Facilities />} />
                <Route path="incident-tickets" element={<IncidentTickets />} />
                <Route path="schedule" element={<ProtectedRoute allowedRoles={['TECHNICIAN']}><OperationalSchedule /></ProtectedRoute>} />
                <Route path="repair-progress" element={<RepairProgress />} />
                <Route path="users" element={<ProtectedRoute allowedRoles={['ADMIN']}><UserManagement /></ProtectedRoute>} />
                <Route path="activation-requests" element={<ProtectedRoute allowedRoles={['ADMIN']}><ActivationRequests /></ProtectedRoute>} />
                <Route path="facility-approvals" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminBookingDashboard /></ProtectedRoute>} />
              </Route>
              
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              
              <Route 
                path="/notifications" 
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
