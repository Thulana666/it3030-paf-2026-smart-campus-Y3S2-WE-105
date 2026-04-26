import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
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
import IncidentTicketsRouter from './pages/modules/IncidentTicketsRouter';
import Inventory from './pages/modules/Inventory';
import OperationalSchedule from './pages/modules/OperationalSchedule';
import OpsSchedule from './pages/modules/Schedule';
import RepairProgress from './pages/modules/RepairProgress';
import UserManagement from './pages/admin/UserManagement';
import AdminBookingDashboard from './pages/admin/AdminBookingDashboard';
import GlobalAnalytics from './pages/admin/GlobalAnalytics';
import TicketCreate from './pages/modules/tickets/TicketCreate';
import TicketDetail from './pages/modules/tickets/TicketDetail';
import TicketEdit from './pages/modules/tickets/TicketEdit';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardRouter />} />
                <Route
                  path="user"
                  element={
                    <ProtectedRoute allowedRoles={["USER"]}>
                      <UserDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="technician"
                  element={
                    <ProtectedRoute allowedRoles={["TECHNICIAN"]}>
                      <TechnicianDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route path="bookings" element={<BookingSystem />} />
                <Route path="facilities" element={<Facilities />} />

                {/* Incident Tickets — IncidentTicketsRouter handles role-based routing */}
                <Route
                  path="incident-tickets"
                  element={
                    <ProtectedRoute>
                      <IncidentTicketsRouter />
                    </ProtectedRoute>
                  }
                />

                {/* Ticket sub-routes (from ashen) */}
                <Route path="tickets/create" element={<TicketCreate />} />
                <Route path="tickets/:id" element={<TicketDetail />} />
                <Route path="tickets/:id/edit" element={<TicketEdit />} />

                {/* Inventory (from ashen) */}
                <Route path="inventory" element={<Inventory />} />

                {/* Schedule — supports both route versions */}
                <Route path="schedule" element={<ProtectedRoute allowedRoles={['TECHNICIAN']}><OperationalSchedule /></ProtectedRoute>} />

                <Route path="repair-progress" element={<RepairProgress />} />

                {/* Admin-only routes */}
                <Route path="users" element={<ProtectedRoute allowedRoles={['ADMIN']}><UserManagement /></ProtectedRoute>} />
                <Route path="facility-approvals" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminBookingDashboard /></ProtectedRoute>} />
                <Route path="analytics" element={<ProtectedRoute allowedRoles={['ADMIN']}><GlobalAnalytics /></ProtectedRoute>} />
              </Route>

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

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
