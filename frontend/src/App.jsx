import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import BookingDashboard from './pages/BookingDashboard'
import LoginPage from './pages/LoginPage'
import NotificationBell from './components/NotificationBell'
import { LogOut } from 'lucide-react'
import './index.css'

// A wrapper component to protect the Admin route
const AdminRoute = ({ children }) => {
  const role = localStorage.getItem('user_role');
  if (role !== 'ADMIN') {
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
          
          {/* THE NEW BELL COMPONENT GOES HERE */}
          <NotificationBell />

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid #e4e4e7', paddingLeft: '1.5rem' }}>
            {picture && <img src={picture} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />}
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
  // Grab the token so the Router knows if the user is logged in
  const token = localStorage.getItem('jwt_token');

  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<UserDashboard />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/bookings" element={token ? <BookingDashboard /> : <Navigate to="/login" />} />
        
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