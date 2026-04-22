import { GoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // 1. Send the Google token to our Spring Boot backend
      const res = await axios.post('http://localhost:8080/api/auth/google', {
        token: credentialResponse.credential
      });

      // 2. Extract the data Spring Boot sends back
      const { token, role, name, picture } = res.data;

      // 3. Save to localStorage so the user stays logged in
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('user_role', role);
      localStorage.setItem('user_name', name);
      localStorage.setItem('user_picture', picture);

      // 4. Route them based on their role
      if (role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert("Authentication failed. Please check your backend terminal for errors.");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <div className="form-container" style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        <ShieldCheck size={48} style={{ color: '#18181b', marginBottom: '1rem' }} />
        <h2 style={{ margin: '0 0 0.5rem 0' }}>Smart Campus Login</h2>
        <p style={{ color: '#71717a', marginBottom: '2rem' }}>Authenticate to access the Operations Hub</p>
        
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              console.log('Google Login Failed');
            }}
          />
        </div>
      </div>
    </div>
  )
}