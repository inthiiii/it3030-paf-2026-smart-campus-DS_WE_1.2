import { GoogleLogin } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ShieldCheck, Sparkles, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // 1. Send the Google token to our Spring Boot backend
      const res = await axios.post('http://localhost:8080/api/auth/google', {
        token: credentialResponse.credential
      });

      // 2. Extract the data Spring Boot sends back
      const { token, role, name, picture, email } = res.data;

      // 3. Save to localStorage so the user stays logged in
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('user_role', role);
      localStorage.setItem('user_name', name);
      localStorage.setItem('user_picture', picture);
      localStorage.setItem('user_email', email);

      // 4. Route them based on their role
      if (role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) { // 5. Handle errors (Validation)
      console.error("Login failed:", error);
      alert("Authentication failed. Please check your backend terminal for errors.");
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(160deg, #09090b 0%, #18181b 40%, #1e3a5f 80%, #2563eb 100%)',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
        top: '-150px', right: '-150px'
      }} />
      <div style={{
        position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        bottom: '-100px', left: '-100px'
      }} />

      {/* Left side — Branding */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '4rem', position: 'relative', zIndex: 1
      }}>
        {/* Back to Home */}
        <button onClick={() => navigate('/')} style={{
          position: 'absolute', top: '2rem', left: '2rem',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px', padding: '0.4rem 0.85rem',
          color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem',
          transition: 'all 0.2s', backdropFilter: 'blur(4px)'
        }}
          onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.color = 'white' }}
          onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.color = '#94a3b8' }}
        >
          <ArrowLeft size={15} /> Back to Home
        </button>

        <div style={{ maxWidth: '450px' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2.5rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '0.9rem', fontWeight: 900
            }}>SC</div>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em' }}>Smart Campus</span>
          </div>

          <h1 style={{
            fontSize: '2.75rem', fontWeight: 900, color: 'white',
            margin: '0 0 1rem', lineHeight: 1.15, letterSpacing: '-0.03em'
          }}>
            Your campus,
            <span style={{
              display: 'block',
              background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>intelligence included.</span>
          </h1>

          <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.7, margin: '0 0 2.5rem' }}>
            Sign in to access AI-powered facility booking, real-time notifications, and predictive analytics for your campus.
          </p>

          {/* Trust indicators */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              'OAuth 2.0 Secured Authentication',
              'Real-time WebSocket Notifications',
              'AI-Powered Semantic Search'
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#64748b', fontSize: '0.88rem'
              }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Sparkles size={12} color="#22c55e" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side — Login Card */}
      <div style={{
        flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '2rem', position: 'relative', zIndex: 1
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)',
          borderRadius: '24px', padding: '3rem', width: '100%', maxWidth: '400px',
          boxShadow: '0 30px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #18181b, #3f3f46)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 10px 20px rgba(0,0,0,0.15)'
          }}>
            <ShieldCheck size={28} color="white" />
          </div>

          <h2 style={{
            margin: '0 0 0.35rem', fontSize: '1.5rem', fontWeight: 800,
            color: '#09090b', letterSpacing: '-0.02em'
          }}>Welcome Back</h2>
          <p style={{ color: '#71717a', margin: '0 0 2rem', fontSize: '0.92rem' }}>
            Sign in with your university Google account
          </p>

          {/* Google Login */}
          <div style={{
            display: 'flex', justifyContent: 'center',
            padding: '1.5rem', background: '#f8fafc', borderRadius: '16px',
            border: '1px solid #e4e4e7'
          }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                console.log('Google Login Failed');
              }}
              shape="pill"
              size="large"
              text="continue_with"
              theme="outline"
            />
          </div>

          <p style={{
            margin: '1.5rem 0 0', fontSize: '0.78rem', color: '#a1a1aa', lineHeight: 1.6
          }}>
            By signing in, you agree to our Terms of Service and Privacy Policy. Your data is protected by enterprise-grade security.
          </p>
        </div>
      </div>
    </div>
  )
}