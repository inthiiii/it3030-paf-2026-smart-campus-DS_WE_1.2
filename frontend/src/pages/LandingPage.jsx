import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  ArrowRight, Zap, Shield, Brain, QrCode, Bell, BarChart3,
  MapPin, Users, MonitorPlay, ChevronDown, Mail, Phone,
  Globe, ExternalLink, MessageCircle, Clock, Search, Sparkles, CheckCircle
} from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()
  const [resources, setResources] = useState([])
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  // Fallback preview data for when API is unavailable (user not logged in)
  const previewResources = [
    { id: 'p1', name: 'Library Meeting Room', type: 'MEETING_ROOM', capacity: 12, location: 'Library Block B', imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80' },
    { id: 'p2', name: 'Seminar Room', type: 'LECTURE_HALL', capacity: 80, location: 'Main Building', imageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80' },
    { id: 'p3', name: 'HD Projector', type: 'EQUIPMENT', capacity: 1, location: 'AV Center', imageUrl: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cHJvamVjdG9yfGVufDB8fDB8fHww' },
    { id: 'p4', name: 'Lecture Hall', type: 'LECTURE_HALL', capacity: 200, location: 'Block A', imageUrl: 'https://images.unsplash.com/photo-1638957835514-224c57ffe617?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8bGVjdHVyZSUyMGhhbGxzfGVufDB8fDB8fHww' },
    { id: 'p5', name: 'Smart Board Lab', type: 'LAB', capacity: 40, location: 'IT Block', imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80' },
    { id: 'p6', name: 'Conference Room', type: 'MEETING_ROOM', capacity: 20, location: 'Admin Block', imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80' },
    { id: 'p7', name: 'Computer Lab', type: 'LAB', capacity: 60, location: 'IT Block', imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80' },
    { id: 'p8', name: 'Auditorium', type: 'LECTURE_HALL', capacity: 500, location: 'Main Building', imageUrl: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YXVkaXRvcml1bXxlbnwwfHwwfHx8MA%3D%3D' },
  ]

  useEffect(() => {
    axios.get('http://localhost:8080/api/resources').then(res => {
      const active = res.data.filter(r => r.status === 'ACTIVE').slice(0, 10)
      setResources(active.length > 0 ? active : previewResources)
    }).catch(() => {
      setResources(previewResources)
    })

    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleContact = (e) => {
    e.preventDefault()
    const mailtoLink = `mailto:smartcampus@sliit.lk?subject=Smart Campus Inquiry from ${contactForm.name}&body=${encodeURIComponent(contactForm.message + '\n\nFrom: ' + contactForm.email)}`
    window.location.href = mailtoLink
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ background: '#fafafa', overflowX: 'hidden' }}>

      {/* ==================== HERO SECTION ==================== */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(160deg, #09090b 0%, #18181b 30%, #1e3a5f 60%, #2563eb 100%)',
        textAlign: 'center', padding: '6rem 2rem 4rem'
      }}>
        {/* Animated gradient orbs */}
        <div style={{
          position: 'absolute', width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
          top: '-200px', right: '-200px',
          transform: `translate(${scrollY * -0.05}px, ${scrollY * 0.02}px)`
        }} />
        <div style={{
          position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          bottom: '-100px', left: '-100px',
          transform: `translate(${scrollY * 0.03}px, ${scrollY * -0.02}px)`
        }} />

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '99px', padding: '0.4rem 1rem', marginBottom: '2rem',
          backdropFilter: 'blur(10px)', fontSize: '0.85rem', color: '#93c5fd'
        }}>
          <Sparkles size={14} /> Powered by SLIIT FOC-DS
        </div>

        {/* Main Title */}
        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, color: 'white',
          margin: '0 0 1.5rem', lineHeight: 1.1, letterSpacing: '-0.03em',
          maxWidth: '800px'
        }}>
          Smart Campus
          <span style={{
            display: 'block',
            background: 'linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Operations Hub</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.3rem)', color: '#94a3b8', maxWidth: '600px',
          margin: '0 0 2.5rem', lineHeight: 1.7
        }}>
          The intelligent platform that transforms how your campus operates.
          Book facilities, predict maintenance, and make data-driven decisions - all in one place.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={() => navigate('/login')} style={{
            padding: '0.9rem 2.25rem', fontSize: '1rem', fontWeight: 700,
            background: 'white', color: '#09090b', border: 'none', borderRadius: '12px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 15px rgba(255,255,255,0.1)'
          }}
            onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 30px rgba(255,255,255,0.15)' }}
            onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(255,255,255,0.1)' }}
          >
            Get Started <ArrowRight size={18} />
          </button>
          <button onClick={() => scrollToSection('features')} style={{
            padding: '0.9rem 2.25rem', fontSize: '1rem', fontWeight: 600,
            background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
            backdropFilter: 'blur(4px)'
          }}
            onMouseEnter={e => { e.target.style.borderColor = 'rgba(255,255,255,0.3)'; e.target.style.color = 'white' }}
            onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.color = '#94a3b8' }}
          >
            Learn More
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: '3rem', marginTop: '4rem', flexWrap: 'wrap', justifyContent: 'center'
        }}>
          {[
            { value: '50+', label: 'Campus Facilities' },
            { value: '1,200+', label: 'Active Users' },
            { value: '99.9%', label: 'Uptime SLA' },
            { value: '< 2s', label: 'AI Response Time' }
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>{stat.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
          color: '#64748b', fontSize: '0.8rem', animation: 'bounce 2s infinite', cursor: 'pointer'
        }} onClick={() => scrollToSection('features')}>
          <span>Scroll to explore</span>
          <ChevronDown size={20} />
        </div>
      </section>

      {/* ==================== FEATURES SECTION ==================== */}
      <section id="features" style={{
        padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <span style={{
            display: 'inline-block', background: '#eff6ff', color: '#2563eb',
            padding: '0.35rem 1rem', borderRadius: '99px', fontSize: '0.85rem',
            fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.03em'
          }}>WHAT WE DO</span>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, color: '#09090b',
            margin: '0.5rem 0', letterSpacing: '-0.02em'
          }}>Everything Your Campus Needs</h2>
          <p style={{ color: '#71717a', fontSize: '1.1rem', maxWidth: '600px', margin: '0.75rem auto 0' }}>
            From AI-powered search to predictive maintenance, we've built the complete toolkit for modern campus operations.
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {[
            { icon: Brain, color: '#8b5cf6', bg: '#f5f3ff', title: 'AI Semantic Search', desc: 'Ask in plain English — "I need a quiet room with a projector for 50 people" — and our AI finds the perfect match instantly.' },
            { icon: BarChart3, color: '#f59e0b', bg: '#fffbeb', title: 'Predictive Maintenance', desc: 'Our autonomous AI monitors facility health 24/7, predicting failures before they happen and auto-locking critical assets.' },
            { icon: QrCode, color: '#22c55e', bg: '#f0fdf4', title: 'Digital QR Passes', desc: 'Get a QR-based digital pass for every booking. Scan at facility entrances for instant, contactless check-in.' },
            { icon: Bell, color: '#ef4444', bg: '#fef2f2', title: 'Real-time Notifications', desc: 'WebSocket-powered live alerts for booking approvals, security events, and maintenance updates — delivered instantly.' },
            { icon: Shield, color: '#2563eb', bg: '#eff6ff', title: 'Security & Audit Trail', desc: 'OAuth 2.0 authentication, role-based access control, full audit logging, and anomaly detection for suspicious logins.' },
            { icon: Zap, color: '#ec4899', bg: '#fdf2f8', title: 'Smart Booking Engine', desc: 'AI risk assessment for every booking, admin approval workflow, conflict detection, and automated no-show handling.' }
          ].map(({ icon: Icon, color, bg, title, desc }, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: '16px', padding: '2rem',
              border: '1px solid #e4e4e7', transition: 'transform 0.3s, box-shadow 0.3s',
              cursor: 'default'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px', background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem'
              }}>
                <Icon size={24} color={color} />
              </div>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 700, color: '#09090b' }}>{title}</h3>
              <p style={{ margin: 0, color: '#71717a', lineHeight: 1.7, fontSize: '0.92rem' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== RESOURCES SECTION ==================== */}
      <section id="resources" style={{
        padding: '6rem 2rem', background: '#09090b'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <span style={{
              display: 'inline-block', background: 'rgba(59,130,246,0.15)', color: '#60a5fa',
              padding: '0.35rem 1rem', borderRadius: '99px', fontSize: '0.85rem',
              fontWeight: 700, marginBottom: '1rem'
            }}>EXPLORE</span>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, color: 'white',
              margin: '0.5rem 0', letterSpacing: '-0.02em'
            }}>Campus Facilities</h2>
            <p style={{ color: '#71717a', fontSize: '1.05rem', maxWidth: '500px', margin: '0.75rem auto 0' }}>
              Discover state-of-the-art rooms and equipment available for booking.
            </p>
          </div>

          {resources.length > 0 ? (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '1.25rem'
            }}>
              {resources.map(resource => (
                <div key={resource.id} style={{
                  borderRadius: '14px', overflow: 'hidden', background: '#18181b',
                  border: '1px solid #27272a', transition: 'transform 0.3s, border-color 0.3s',
                  cursor: 'pointer'
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = '#3b82f6' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#27272a' }}
                  onClick={() => navigate('/login')}
                >
                  <div style={{ height: '160px', background: '#27272a' }}>
                    <img
                      src={resource.imageUrl || 'https://images.unsplash.com/photo-1598620617377-3bfb505b4384?auto=format&fit=crop&q=80&w=800'}
                      alt={resource.name}
                      referrerPolicy="no-referrer"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                      onError={(e) => { if (!e.target.dataset.fallback) { e.target.dataset.fallback = '1'; e.target.src = 'https://images.unsplash.com/photo-1598620617377-3bfb505b4384?auto=format&fit=crop&q=80&w=800' } }}
                    />
                  </div>
                  <div style={{ padding: '1.15rem' }}>
                    <h4 style={{ margin: '0 0 0.4rem', color: 'white', fontSize: '0.95rem', fontWeight: 700 }}>{resource.name}</h4>
                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem', color: '#71717a' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><MonitorPlay size={12} /> {resource.type.replace(/_/g, ' ')}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Users size={12} /> {resource.capacity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#52525b' }}>Loading facilities...</p>
          )}

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <button onClick={() => navigate('/login')} style={{
              padding: '0.75rem 2rem', fontSize: '0.95rem', fontWeight: 600,
              background: 'transparent', color: '#60a5fa', border: '1px solid #3b82f6',
              borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem'
            }}
              onMouseEnter={e => { e.target.style.background = '#2563eb'; e.target.style.color = 'white' }}
              onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#60a5fa' }}
            >
              Sign in to Book <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ==================== BENEFITS SECTION ==================== */}
      <section id="benefits" style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <span style={{
            display: 'inline-block', background: '#f0fdf4', color: '#16a34a',
            padding: '0.35rem 1rem', borderRadius: '99px', fontSize: '0.85rem',
            fontWeight: 700, marginBottom: '1rem'
          }}>WHY SMART CAMPUS</span>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, color: '#09090b',
            margin: '0.5rem 0', letterSpacing: '-0.02em'
          }}>Built Different. Built Better.</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          {[
            { icon: Clock, title: 'Save 80% Booking Time', desc: 'AI-powered search eliminates manual browsing. Find and book the perfect facility in under 30 seconds.' },
            { icon: Shield, title: 'Enterprise-Grade Security', desc: 'OAuth 2.0, JWT tokens, role-based access, full audit trails, and real-time anomaly detection.' },
            { icon: Brain, title: 'Autonomous Operations', desc: 'AI runs 24/7 health diagnostics. Resources are auto-locked before failures happen — zero human intervention.' },
            { icon: Search, title: 'Natural Language Search', desc: 'Powered by Pinecone vector database and semantic embeddings. Search like you talk.' },
            { icon: Bell, title: 'Instant Notifications', desc: 'WebSocket-powered real-time alerts delivered the moment something changes. Never miss a booking update.' },
            { icon: BarChart3, title: 'Data-Driven Insights', desc: 'AI risk scoring, health forecasts, and usage analytics help admins make informed decisions.' }
          ].map(({ icon: Icon, title, desc }, i) => (
            <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                background: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <CheckCircle size={20} color="#22c55e" />
              </div>
              <div>
                <h4 style={{ margin: '0 0 0.4rem', fontWeight: 700, fontSize: '1rem', color: '#18181b' }}>{title}</h4>
                <p style={{ margin: 0, color: '#71717a', fontSize: '0.9rem', lineHeight: 1.65 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== CONTACT SECTION ==================== */}
      <section id="contact" style={{
        padding: '6rem 2rem',
        background: 'linear-gradient(180deg, #f4f4f5 0%, #fafafa 100%)'
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{
              display: 'inline-block', background: '#fef3c7', color: '#d97706',
              padding: '0.35rem 1rem', borderRadius: '99px', fontSize: '0.85rem',
              fontWeight: 700, marginBottom: '1rem'
            }}>GET IN TOUCH</span>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, color: '#09090b',
              margin: '0.5rem 0', letterSpacing: '-0.02em'
            }}>Contact Us</h2>
            <p style={{ color: '#71717a', fontSize: '1.05rem', margin: '0.5rem 0 0' }}>
              Have questions? We'd love to hear from you.
            </p>
          </div>

          <div style={{
            background: 'white', borderRadius: '20px', padding: '2.5rem',
            boxShadow: '0 25px 50px rgba(0,0,0,0.06)', border: '1px solid #e4e4e7'
          }}>
            <form onSubmit={handleContact}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#3f3f46', marginBottom: '0.35rem' }}>Your Name</label>
                  <input
                    type="text" required value={contactForm.name}
                    onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="John Doe"
                    style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '10px', border: '1px solid #e4e4e7', fontSize: '0.95rem', background: '#fafafa', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#3f3f46', marginBottom: '0.35rem' }}>Your Email</label>
                  <input
                    type="email" required value={contactForm.email}
                    onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="john@sliit.lk"
                    style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '10px', border: '1px solid #e4e4e7', fontSize: '0.95rem', background: '#fafafa', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#3f3f46', marginBottom: '0.35rem' }}>Message</label>
                <textarea
                  required value={contactForm.message}
                  onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Tell us how we can help..."
                  rows={5}
                  style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '10px', border: '1px solid #e4e4e7', fontSize: '0.95rem', background: '#fafafa', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
              <button type="submit" style={{
                width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: 700,
                background: '#18181b', color: 'white', border: 'none', borderRadius: '12px',
                cursor: 'pointer', transition: 'opacity 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
              }}>
                <Mail size={18} /> {sent ? 'Opening Mail Client...' : 'Send Message'}
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #f4f4f5' }}>
              <a href="mailto:smartcampus@sliit.lk" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#52525b', fontSize: '0.88rem', textDecoration: 'none' }}>
                <Mail size={16} color="#3b82f6" /> smartcampus@sliit.lk
              </a>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#52525b', fontSize: '0.88rem' }}>
                <Phone size={16} color="#22c55e" /> +94 11 754 4801
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer style={{
        background: '#09090b', padding: '4rem 2rem 2rem', color: '#a1a1aa'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '0.75rem', fontWeight: 900
                }}>SC</div>
                <span style={{ color: 'white', fontWeight: 800, fontSize: '1.05rem' }}>Smart Campus</span>
              </div>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: '#71717a', margin: 0 }}>
                Transforming campus operations with artificial intelligence. A production-level operations hub for modern universities.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 style={{ color: 'white', margin: '0 0 1rem', fontSize: '0.95rem' }}>Quick Links</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {['Features', 'Resources', 'Benefits', 'Contact'].map(item => (
                  <span key={item} onClick={() => scrollToSection(item.toLowerCase())} style={{ color: '#71717a', cursor: 'pointer', fontSize: '0.88rem', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = '#60a5fa'}
                    onMouseLeave={e => e.target.style.color = '#71717a'}
                  >{item}</span>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div>
              <h4 style={{ color: 'white', margin: '0 0 1rem', fontSize: '0.95rem' }}>Platform</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem', color: '#71717a' }}>
                <span>React + Vite</span>
                <span>Spring Boot</span>
                <span>MongoDB</span>
                <span>Pinecone AI</span>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 style={{ color: 'white', margin: '0 0 1rem', fontSize: '0.95rem' }}>Contact</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
                <a href="mailto:smartcampus@sliit.lk" style={{ color: '#71717a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mail size={14} /> smartcampus@sliit.lk
                </a>
                <span style={{ color: '#71717a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={14} /> SLIIT, Malabe, Sri Lanka
                </span>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: '1px solid #1e1e1e', paddingTop: '1.5rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '1rem'
          }}>
            <span style={{ fontSize: '0.82rem', color: '#52525b' }}>
              © 2026 Smart Campus Operations Hub. All rights reserved.
            </span>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {[Globe, ExternalLink, MessageCircle].map((Icon, i) => (
                <div key={i} style={{
                  width: '32px', height: '32px', borderRadius: '8px', background: '#18181b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'background 0.2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#27272a'}
                  onMouseLeave={e => e.currentTarget.style.background = '#18181b'}
                >
                  <Icon size={16} color="#71717a" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Bounce animation */}
      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
          40% { transform: translateX(-50%) translateY(-8px); }
          60% { transform: translateX(-50%) translateY(-4px); }
        }
      `}</style>
    </div>
  )
}
