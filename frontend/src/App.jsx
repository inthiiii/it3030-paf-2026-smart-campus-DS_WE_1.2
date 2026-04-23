import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import BookingDashboard from './pages/BookingDashboard'
import LoginPage from './pages/LoginPage'
import ReportTicketPage from './pages/tickets/ReportTicketPage'
import MyTicketsPage from './pages/tickets/MyTicketsPage'
import AdminTicketsPage from './pages/tickets/AdminTicketsPage'
import { LogOut, AlertTriangle, ClipboardList, Settings } from 'lucide-react'
import './index.css'

// Protects routes that require login
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('jwt_token');
  if (!token) return <Navigate to="/login" />;
  return children;
};

// Protects the Admin route
const AdminRoute = ({ children }) => {
  const role = localStorage.getItem('user_role');
  if (role !== 'ADMIN') return <Navigate to="/login" />;
  return children;
};

// Protects routes that require ADMIN or TECHNICIAN
const StaffRoute = ({ children }) => {
  const role = localStorage.getItem('user_role');
  if (role !== 'ADMIN' && role !== 'TECHNICIAN') return <Navigate to="/" />;
  return children;
};

// Navigation Component
const NavBar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('jwt_token');
  const role = localStorage.getItem('user_role');
  const picture = localStorage.getItem('user_picture');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Link to="/">Campus Dashboard</Link>
        {token && <Link to="/report-issue" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><AlertTriangle size={16} />Report Issue</Link>}
        {token && <Link to="/my-tickets" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><ClipboardList size={16} />My Tickets</Link>}
        {(role === 'ADMIN' || role === 'TECHNICIAN') && <Link to="/all-tickets" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Settings size={16} />All Tickets</Link>}
        {token && <Link to="/bookings">My Bookings</Link>}
        {role === 'ADMIN' && <Link to="/admin">Admin Panel</Link>}
      </div>

      {token ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {picture && <img src={picture} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />}
          <button onClick={handleLogout} className="btn" style={{ background: '#f4f4f5', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      ) : (
        <Link to="/login" className="btn btn-primary" style={{ marginTop: 0 }}>Login</Link>
      )}
    </nav>
  );
};

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<UserDashboard />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Module C Routes */}
        <Route path="/report-issue" element={<PrivateRoute><ReportTicketPage /></PrivateRoute>} />
        <Route path="/my-tickets" element={<PrivateRoute><MyTicketsPage /></PrivateRoute>} />
        <Route path="/all-tickets" element={<StaffRoute><AdminTicketsPage /></StaffRoute>} />

        {/* Admin Panel */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

        {/* Bookings */}
        <Route path="/bookings" element={<PrivateRoute><BookingDashboard /></PrivateRoute>} />
      </Routes>
    </Router>
  )
}

export default App
