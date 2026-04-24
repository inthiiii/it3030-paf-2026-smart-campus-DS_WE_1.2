import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simple frontend validation
    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    // Mock login simulation (like calling a real backend)
    setTimeout(() => {
      // Save to localStorage (acts like a session)
      const userData = {
        email: email,
        name: email.split('@')[0],
        loginTime: new Date().toLocaleString(),
        role: email.includes('admin') ? 'admin' : 'student'
      };
      
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('loginTime', new Date().toISOString());
      
      // Redirect to dashboard
      navigate('/dashboard');
      setIsLoading(false);
    }, 1500); // Simulates network delay
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="campus-icon">🏛️</div>
          <h1>Smart Campus</h1>
          <p>Access your campus portal</p>
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>📧 Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@campus.edu"
              autoComplete="off"
            />
          </div>

          <div className="input-group">
            <label>🔒 Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" disabled={isLoading}>
            {isLoading ? '⏳ Logging in...' : '🚀 Login'}
          </button>

          <div className="demo-info">
            <p>✨ Demo Mode ✨</p>
            <small>Any email and password works!</small>
            <small className="demo-example">Try: student@campus.edu / anything</small>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
