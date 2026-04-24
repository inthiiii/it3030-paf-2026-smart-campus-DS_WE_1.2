import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom'
import UserDashboard from './pages/UserDashboard'
import UserHome from './pages/UserHome'
import AdminDashboard from './pages/AdminDashboard'
import AdminHome from './pages/AdminHome'
import BookingDashboard from './pages/BookingDashboard'
import LoginPage from './pages/LoginPage'
import ReportTicketPage from './pages/tickets/ReportTicketPage'
import MyTicketsPage from './pages/tickets/MyTicketsPage'
import AdminTicketsPage from './pages/tickets/AdminTicketsPage'
import NotificationBell from './components/NotificationBell'
import LandingPage from './pages/LandingPage'
import UserProfile from './pages/UserProfile'
import { LogOut, AlertTriangle, ClipboardList, Settings, LayoutDashboard, CalendarCheck, Shield, Search } from 'lucide-react'
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

// A wrapper to protect ANY route that requires a logged-in user
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('jwt_token');
  if (!token) return <Navigate to="/login" />;
  return children;
};

// Smart Home Route — redirects based on login state & role
const HomeRoute = () => {
  const token = localStorage.getItem('jwt_token');
  const role = localStorage.getItem('user_role');
  if (token && role === 'ADMIN') return <Navigate to="/admin" />;
  if (token) return <Navigate to="/dashboard" />;
  return <LandingPage />;
};

// Navigation Component
const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('jwt_token');
  const role = localStorage.getItem('user_role');
  const picture = localStorage.getItem('user_picture');
  const currentPath = location.pathname;

  // Hide nav on landing page and login page
  if (!token && (currentPath === '/' || currentPath === '/login')) return null;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const NavLink = ({ to, icon: Icon, children }) => {
    const isActive = currentPath === to;
    return (
      <Link to={to} style={{
        display: 'flex', alignItems: 'center', gap: '0.45rem',
        padding: '0.45rem 0.85rem', borderRadius: '8px',
        fontSize: '0.88rem', fontWeight: 600, textDecoration: 'none',
        color: isActive ? '#ffffff' : '#52525b',
        background: isActive ? '#18181b' : 'transparent',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap'
      }}>
        <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
        {children}
      </Link>
    );
  };

  return (
    <nav style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.75rem 2rem',
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(228, 228, 231, 0.6)',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      position: 'sticky', top: 0, zIndex: 100
    }}>
      {/* LEFT — Brand + Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {/* Brand */}
        <div
          onClick={() => navigate(role === 'ADMIN' ? '/admin' : '/dashboard')}
          style={{
            fontSize: '1.05rem', fontWeight: 800, color: '#18181b',
            marginRight: '1.25rem', cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: '0.5rem', letterSpacing: '-0.02em'
          }}
        >
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #18181b, #3f3f46)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '0.75rem', fontWeight: 900
          }}>SC</div>
          <span style={{ fontSize: '0.85rem' }}>Smart Campus</span>
        </div>

        {/* Separator */}
        <div style={{ width: '1px', height: '24px', background: '#e4e4e7', marginRight: '0.5rem' }} />

        {/* Role-based Navigation */}
        {role === 'ADMIN' ? (
          <>
            <NavLink to="/admin" icon={LayoutDashboard}>Admin Home</NavLink>
            <NavLink to="/admin/manage" icon={Shield}>Manage</NavLink>
          </>
        ) : (
          <>
            {token && <NavLink to="/dashboard" icon={LayoutDashboard}>Home</NavLink>}
            <NavLink to="/resources" icon={Search}>Browse Resources</NavLink>
            {token && <NavLink to="/bookings" icon={CalendarCheck}>My Bookings</NavLink>}
          </>
        )}
      </div>

      {/* RIGHT — Notifications + Profile + Logout */}
      {token ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <NotificationBell />

          <div style={{ width: '1px', height: '24px', background: '#e4e4e7' }} />

          <Link to="/profile" style={{ display: 'flex', alignItems: 'center' }}>
            {picture && (
              <img src={picture} alt="Profile" title="Edit Profile" style={{
                width: '34px', height: '34px', borderRadius: '50%',
                border: '2px solid #e4e4e7', cursor: 'pointer',
                transition: 'border-color 0.2s',
                objectFit: 'cover'
              }} />
            )}
          </Link>

          <button onClick={handleLogout} className="btn" style={{
            background: 'transparent', color: '#ef4444',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            margin: 0, padding: '0.4rem 0.75rem', fontSize: '0.85rem',
            border: '1px solid #fecaca', borderRadius: '8px',
            fontWeight: 600, transition: 'all 0.2s'
          }}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      ) : (
        <Link to="/login" className="btn btn-primary" style={{
          marginTop: 0, padding: '0.5rem 1.25rem', fontSize: '0.88rem',
          borderRadius: '8px', fontWeight: 600
        }}>Login</Link>
      )}
    </nav>
  );
};

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        {/* Public Landing — or redirect if logged in */}
        <Route path="/" element={<HomeRoute />} />

        {/* Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Module C Routes */}
        <Route path="/report-issue" element={<PrivateRoute><ReportTicketPage /></PrivateRoute>} />
        <Route path="/my-tickets" element={<PrivateRoute><MyTicketsPage /></PrivateRoute>} />
        <Route path="/all-tickets" element={<StaffRoute><AdminTicketsPage /></StaffRoute>} />

        {/* User Dashboard Home */}
        <Route path="/dashboard" element={<ProtectedRoute><UserHome /></ProtectedRoute>} />

        {/* Public resource browser */}
        <Route path="/resources" element={<UserDashboard />} />

        {/* Bookings */}
        <Route path="/bookings" element={<ProtectedRoute><BookingDashboard /></ProtectedRoute>} />

        {/* User Profile */}
        <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />

        {/* Admin Home */}
        <Route path="/admin" element={<AdminRoute><AdminHome /></AdminRoute>} />

        {/* Admin Manage */}
        <Route path="/admin/manage" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      </Routes>
    </Router>
  )
}

export default App
