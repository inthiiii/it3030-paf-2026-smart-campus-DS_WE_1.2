import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import './index.css'

function App() {
  return (
    <Router>
      <nav>
        <Link to="/">Campus Dashboard</Link>
        <Link to="/admin">Admin Panel</Link>
      </nav>

      <Routes>
        <Route path="/" element={<UserDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  )
}

export default App
