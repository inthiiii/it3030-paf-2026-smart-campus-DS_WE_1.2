import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Bell, CalendarCheck, ArrowRight, QrCode, CheckCircle,
  AlertTriangle, Sparkles, Clock, MapPin, Users as UsersIcon, MonitorPlay, BookOpen
} from 'lucide-react'

export default function UserHome() {
  const navigate = useNavigate()
  const userName = localStorage.getItem('user_name') || 'User'
  const userEmail = localStorage.getItem('user_email')
  const userPicture = localStorage.getItem('user_picture')

  const [unreadCount, setUnreadCount] = useState(0)
  const [bookings, setBookings] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [featuredResource, setFeaturedResource] = useState(null)

  useEffect(() => {
    Promise.all([
      axios.get(`http://localhost:8080/api/notifications/${userEmail}`).catch(() => ({ data: [] })),
      axios.get('http://localhost:8080/api/bookings/my-bookings').catch(() => ({ data: [] })),
      axios.get('http://localhost:8080/api/resources').catch(() => ({ data: [] }))
    ]).then(([notifRes, bookRes, resRes]) => {
      setUnreadCount(notifRes.data.filter(n => !n.read).length)
      setBookings(bookRes.data)
      const allResources = resRes.data
      setResources(allResources)

      // Pick a random active resource as the featured "ad"
      const activeOnes = allResources.filter(r => r.status === 'ACTIVE')
      if (activeOnes.length > 0) {
        setFeaturedResource(activeOnes[Math.floor(Math.random() * activeOnes.length)])
      }

      setLoading(false)
    })
  }, [userEmail])

  // Derived
  const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED' && !b.checkedIn)
  const upcomingBookings = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING').slice(0, 3)
  const totalBookings = bookings.length

  // Check-in eligible bookings
  const now = new Date()
  const checkInEligible = bookings.filter(b => {
    if (b.status !== 'CONFIRMED' || b.checkedIn) return false
    const start = new Date(b.startTime)
    const tenBefore = new Date(start.getTime() - 10 * 60000)
    const fifteenAfter = new Date(start.getTime() + 15 * 60000)
    return now >= tenBefore && now <= fifteenAfter
  })

  // Helper to get resource name from id
  const getResourceName = (id) => {
    const res = resources.find(r => r.id === id)
    return res ? res.name : 'Resource'
  }

  const handleCheckIn = async (bookingId) => {
    try {
      await axios.put(`http://localhost:8080/api/bookings/${bookingId}/check-in`)
      // Refresh bookings
      const bookRes = await axios.get('http://localhost:8080/api/bookings/my-bookings')
      setBookings(bookRes.data)
      alert("Checked in successfully! The room is yours.")
    } catch (err) {
      alert('Failed to check in.')
    }
  }

  if (loading) {
    return (
      <div className="dashboard" style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '2rem', animation: 'pulse-green 2s infinite' }}>🎓</div>
        <h2 style={{ color: '#71717a' }}>Loading your dashboard...</h2>
      </div>
    )
  }

  return (
    <div className="dashboard">

      {/* WELCOME BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)',
        borderRadius: '16px',
        padding: '2.5rem',
        color: 'white',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 20px 25px -5px rgba(37,99,235,0.25)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <BookOpen size={16} />
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#bfdbfe' }}>Student / Staff</span>
          </div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>Welcome back, {userName.split(' ')[0]} 👋</h1>
          <p style={{ margin: 0, color: '#bfdbfe', fontSize: '0.95rem' }}>
            Your campus at a glance. Book rooms, check-in, and stay updated.
          </p>
        </div>
        {userPicture && (
          <img src={userPicture} alt="User" style={{ width: '64px', height: '64px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.3)' }} />
        )}
      </div>

      {/* QUICK STATS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {/* Notifications */}
        <div style={{
          background: unreadCount > 0 ? '#fef2f2' : 'white',
          border: unreadCount > 0 ? '1px solid #fecaca' : '1px solid #e4e4e7',
          borderRadius: '12px', padding: '1.25rem', cursor: 'default'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Bell size={18} color={unreadCount > 0 ? '#ef4444' : '#71717a'} />
            <span style={{ fontSize: '0.85rem', color: '#71717a', fontWeight: 600 }}>Notifications</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: unreadCount > 0 ? '#ef4444' : '#18181b' }}>{unreadCount}</div>
          <span style={{ fontSize: '0.8rem', color: '#71717a' }}>unread</span>
        </div>

        {/* Total Bookings */}
        <div onClick={() => navigate('/bookings')} style={{
          background: 'white', border: '1px solid #e4e4e7',
          borderRadius: '12px', padding: '1.25rem', cursor: 'pointer'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <CalendarCheck size={18} color="#2563eb" />
            <span style={{ fontSize: '0.85rem', color: '#71717a', fontWeight: 600 }}>My Bookings</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b' }}>{totalBookings}</div>
          <span style={{ fontSize: '0.8rem', color: '#71717a' }}>reservations</span>
        </div>

        {/* Pending Check-ins */}
        <div style={{
          background: confirmedBookings.length > 0 ? '#f0fdf4' : 'white',
          border: confirmedBookings.length > 0 ? '1px solid #bbf7d0' : '1px solid #e4e4e7',
          borderRadius: '12px', padding: '1.25rem', cursor: 'default'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <QrCode size={18} color={confirmedBookings.length > 0 ? '#22c55e' : '#71717a'} />
            <span style={{ fontSize: '0.85rem', color: '#71717a', fontWeight: 600 }}>Awaiting Check-in</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: confirmedBookings.length > 0 ? '#22c55e' : '#18181b' }}>{confirmedBookings.length}</div>
          <span style={{ fontSize: '0.8rem', color: '#71717a' }}>rooms ready</span>
        </div>

        {/* Browse Resources */}
        <div onClick={() => navigate('/resources')} style={{
          background: 'white', border: '1px solid #e4e4e7',
          borderRadius: '12px', padding: '1.25rem', cursor: 'pointer'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Sparkles size={18} color="#8b5cf6" />
            <span style={{ fontSize: '0.85rem', color: '#71717a', fontWeight: 600 }}>Resources</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b' }}>{resources.filter(r => r.status === 'ACTIVE').length}</div>
          <span style={{ fontSize: '0.8rem', color: '#71717a' }}>available now</span>
        </div>
      </div>

      {/* MAIN CONTENT — TWO COLUMN LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* MY UPCOMING BOOKINGS */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e4e4e7', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarCheck size={18} color="#2563eb" /> My Bookings
            </h3>
            <button onClick={() => navigate('/bookings')} className="btn" style={{ margin: 0, padding: '0.3rem 0.75rem', fontSize: '0.8rem', background: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              View All <ArrowRight size={14} />
            </button>
          </div>

          {upcomingBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#71717a' }}>
              <Clock size={32} style={{ opacity: 0.3, margin: '0 auto 0.5rem' }} />
              <p style={{ margin: 0 }}>No upcoming bookings.</p>
              <button onClick={() => navigate('/bookings')} className="btn btn-primary" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
                Book a Room
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {upcomingBookings.map(b => (
                <div key={b.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.75rem', background: '#f8fafc', borderRadius: '8px',
                  borderLeft: `3px solid ${b.status === 'PENDING' ? '#eab308' : '#22c55e'}`
                }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#18181b' }}>{getResourceName(b.resourceId)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#71717a' }}>
                      {new Date(b.startTime).toLocaleDateString()} • {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span className={`status-badge status-${b.status === 'PENDING' ? 'MAINTENANCE' : 'ACTIVE'}`} style={{ fontSize: '0.7rem' }}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FEATURED RESOURCE AD */}
        <div style={{
          borderRadius: '12px', overflow: 'hidden', border: '1px solid #e4e4e7',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)', background: 'white', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '1rem 1.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="#8b5cf6" /> Featured Facility
            </h3>
            <button onClick={() => navigate('/resources')} className="btn" style={{ margin: 0, padding: '0.3rem 0.75rem', fontSize: '0.8rem', background: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              Browse All <ArrowRight size={14} />
            </button>
          </div>

          {featuredResource ? (
            <div style={{ padding: '1rem 1.5rem 1.5rem' }}>
              <div style={{ borderRadius: '10px', overflow: 'hidden', height: '140px', marginBottom: '1rem', background: '#f4f4f5' }}>
                <img
                  src={featuredResource.imageUrl || 'https://images.unsplash.com/photo-1598620617377-3bfb505b4384?auto=format&fit=crop&q=80&w=800'}
                  alt={featuredResource.name}
                  referrerPolicy="no-referrer"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { if (!e.target.dataset.fallback) { e.target.dataset.fallback = '1'; e.target.src = 'https://images.unsplash.com/photo-1598620617377-3bfb505b4384?auto=format&fit=crop&q=80&w=800'; } }}
                />
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{featuredResource.name}</h3>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#52525b', marginBottom: '1rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MonitorPlay size={14} /> {featuredResource.type.replace(/_/g, ' ')}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><UsersIcon size={14} /> {featuredResource.capacity} seats</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={14} /> {featuredResource.location}</span>
              </div>
              <button onClick={() => navigate('/bookings')} className="btn btn-primary" style={{ fontSize: '0.85rem', borderRadius: '8px' }}>
                Book This Resource →
              </button>
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#71717a' }}>
              <p>No facilities available right now.</p>
            </div>
          )}
        </div>

        {/* CHECK-IN REMINDER / QR SECTION */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e4e4e7', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <QrCode size={18} color="#22c55e" /> Check-in & QR Passes
            </h3>
            <button onClick={() => navigate('/bookings')} className="btn" style={{ margin: 0, padding: '0.3rem 0.75rem', fontSize: '0.8rem', background: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              My Bookings <ArrowRight size={14} />
            </button>
          </div>

          {confirmedBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#71717a' }}>
              <CheckCircle size={32} style={{ opacity: 0.3, margin: '0 auto 0.5rem' }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No pending check-ins right now.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {confirmedBookings.slice(0, 3).map(b => {
                const start = new Date(b.startTime)
                const isEligible = checkInEligible.find(c => c.id === b.id)
                return (
                  <div key={b.id} style={{
                    background: isEligible ? '#f0fdf4' : '#f8fafc',
                    border: isEligible ? '1px solid #bbf7d0' : '1px solid #e4e4e7',
                    padding: '1rem', borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#18181b' }}>{getResourceName(b.resourceId)}</div>
                        <div style={{ fontSize: '0.8rem', color: '#71717a', marginTop: '0.15rem' }}>
                          {start.toLocaleDateString()} at {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => navigate('/bookings')} className="btn" style={{ margin: 0, padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: '#18181b', color: 'white', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <QrCode size={13} /> QR Pass
                        </button>
                        {isEligible && (
                          <button onClick={() => handleCheckIn(b.id)} className="btn" style={{ margin: 0, padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: '#22c55e', color: 'white', animation: 'pulse-green 2s infinite' }}>
                            Check In
                          </button>
                        )}
                      </div>
                    </div>
                    {isEligible && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <AlertTriangle size={12} /> Check-in window is OPEN — don't miss it!
                      </div>
                    )}
                    {!isEligible && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#71717a' }}>
                        Check-in opens 10 min before start time
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* NO BOOKINGS WARNING / ENCOURAGEMENT */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e4e4e7', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          {totalBookings === 0 ? (
            /* WARNING: No bookings at all */
            <div style={{
              background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
              border: '1px solid #fde68a',
              borderRadius: '10px',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <AlertTriangle size={40} color="#f59e0b" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ margin: '0 0 0.75rem 0', color: '#92400e' }}>No Bookings Yet!</h3>
              <p style={{ margin: '0 0 1.5rem 0', color: '#a16207', fontSize: '0.9rem', lineHeight: 1.5 }}>
                You haven't made any reservations yet. Browse our campus facilities and book a room for your next study session, meeting, or project work.
              </p>
              <button onClick={() => navigate('/bookings')} className="btn" style={{
                margin: 0, padding: '0.6rem 1.5rem', fontSize: '0.9rem',
                background: '#f59e0b', color: 'white', fontWeight: 700, borderRadius: '8px'
              }}>
                Book Your First Room →
              </button>
            </div>
          ) : (
            /* Has bookings — show quick tips */
            <div>
              <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                <BookOpen size={18} color="#8b5cf6" /> Quick Tips
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <QrCode size={20} color="#3b82f6" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#18181b' }}>Digital QR Pass</div>
                    <div style={{ fontSize: '0.8rem', color: '#71717a' }}>After your booking is confirmed, view your QR pass from the Bookings page and scan it at the facility entrance.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <Clock size={20} color="#f59e0b" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#18181b' }}>Check-in Window</div>
                    <div style={{ fontSize: '0.8rem', color: '#71717a' }}>Check-in opens 10 minutes before your booking starts and closes 15 minutes after. Missing it may mark you as a no-show.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                  <Sparkles size={20} color="#8b5cf6" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#18181b' }}>AI-Powered Search</div>
                    <div style={{ fontSize: '0.8rem', color: '#71717a' }}>Use the Campus Dashboard to search facilities with natural language — e.g., "a quiet room with a projector for 50 people."</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
