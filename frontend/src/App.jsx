import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import BookingDashboard from './pages/BookingDashboard'
import LoginPage from './pages/LoginPage'
import NotificationBell from './components/NotificationBell'
import UserProfile from './pages/UserProfile'
import { LogOut } from 'lucide-react'
import './index.css'

// A wrapper to protect the Admin route
const AdminRoute = ({ children }) => {
  const role = localStorage.getItem('user_role');
  if (role !== 'ADMIN') {
    return <Navigate to="/login" />;
  }
  return children;
};

// A wrapper to protect ANY route that requires a logged-in user
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('jwt_token');
  if (!token) {
    return <Navigate to="/login" />;
  }
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
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <Link to="/">Campus Dashboard</Link>
        {token && <Link to="/bookings">My Bookings</Link>}
        {role === 'ADMIN' && <Link to="/admin">Admin Panel</Link>}
      </div>
      
      {token ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          
          <NotificationBell />

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid #e4e4e7', paddingLeft: '1.5rem' }}>
            
            {/* UPDATED: Clickable Profile Picture routing to settings */}
            <Link to="/profile">
              {picture && <img src={picture} alt="Profile" title="Edit Profile" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid transparent', cursor: 'pointer' }} />}
            </Link>

            <button onClick={handleLogout} className="btn" style={{ background: '#f4f4f5', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
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
        
        {/* Wrapped in our ProtectedRoute logic */}
        <Route path="/bookings" element={
          <ProtectedRoute>
            <BookingDashboard />
          </ProtectedRoute>
        } />

        {/* NEW: User Profile Route */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } />
        
        {/* The Admin Dashboard is wrapped in protection logic */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
      </Routes>
    </Router>
  )
}

export default App