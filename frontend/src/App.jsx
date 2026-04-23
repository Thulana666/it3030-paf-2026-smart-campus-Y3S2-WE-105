import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Notifications from "./pages/Notifications";
import DashboardRouter from "./pages/DashboardRouter";
import UserDashboard from "./pages/dashboards/UserDashboard";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import TechnicianDashboard from "./pages/dashboards/TechnicianDashboard";
import Profile from "./pages/Profile";
import DashboardLayout from "./components/DashboardLayout";
import BookingSystem from "./pages/modules/BookingSystem";
import Facilities from "./pages/modules/Facilities";
import IncidentTickets from "./pages/modules/IncidentTickets";
import Inventory from "./pages/modules/Inventory";
import OpsSchedule from "./pages/modules/Schedule";
import UserManagement from "./pages/admin/UserManagement";
import TicketCreate from "./pages/modules/tickets/TicketCreate";
import TicketDetail from "./pages/modules/tickets/TicketDetail";
import TicketEdit from "./pages/modules/tickets/TicketEdit";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/login" />} />
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
                <Route path="incident-tickets" element={<IncidentTickets />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="schedule" element={<OpsSchedule />} />
                <Route path="tickets/create" element={<TicketCreate />} />
                <Route path="tickets/:id" element={<TicketDetail />} />
                <Route path="tickets/:id/edit" element={<TicketEdit />} />
                <Route
                  path="users"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />
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
