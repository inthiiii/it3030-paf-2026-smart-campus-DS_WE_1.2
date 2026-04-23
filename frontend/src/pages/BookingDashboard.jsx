import { useState, useEffect } from 'react'
import axios from 'axios'
import { CalendarDays, Clock, MapPin, XCircle, CheckCircle, QrCode, X, Sparkles, ArrowRight, Users, MonitorPlay, AlertTriangle } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

export default function BookingDashboard() {
  const [resources, setResources] = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // QR Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [selectedPass, setSelectedPass] = useState(null)

  const [formData, setFormData] = useState({
    resourceId: '',
    startTime: '',
    endTime: '',
    purpose: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [resResponse, bookingsResponse] = await Promise.all([
        axios.get('http://localhost:8080/api/resources'),
        axios.get('http://localhost:8080/api/bookings/my-bookings')
      ])
      
      const activeResources = resResponse.data.filter(r => r.status === 'ACTIVE')
      setResources(activeResources)
      
      if (activeResources.length > 0) {
        setFormData(prev => ({ ...prev, resourceId: activeResources[0].id }))
      }
      
      setMyBookings(bookingsResponse.data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load dashboard data.')
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleBookResource = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await axios.post('http://localhost:8080/api/bookings', formData)
      setFormData(prev => ({ ...prev, startTime: '', endTime: '', purpose: '' }))
      fetchData()
      setSuccess('Booking request submitted! Waiting for Admin approval.')
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err.response?.data || 'Failed to create booking.')
    }
  }

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      try {
        await axios.put(`http://localhost:8080/api/bookings/${bookingId}/cancel`)
        fetchData()
      } catch (err) {
        setError('Failed to cancel booking.')
      }
    }
  }

  const handleCheckIn = async (bookingId) => {
    try {
      await axios.put(`http://localhost:8080/api/bookings/${bookingId}/check-in`)
      fetchData() 
      setSuccess('Checked in successfully! The room is yours.')
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError('Failed to check in.')
    }
  }

  const getResourceName = (id) => {
    const resource = resources.find(r => r.id === id)
    return resource ? resource.name : 'Unknown Resource'
  }

  const getResource = (id) => {
    return resources.find(r => r.id === id)
  }

  const selectedResource = resources.find(r => r.id === formData.resourceId)

  // Handle opening the Digital Pass
  const openQRPass = (booking) => {
    setSelectedPass(booking)
    setQrModalOpen(true)
  }

  const getStatusConfig = (status) => {
    switch(status) {
      case 'CONFIRMED': return { color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', label: 'Confirmed' }
      case 'PENDING': return { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'Pending' }
      case 'CANCELLED': return { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'Cancelled' }
      case 'REJECTED': return { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'Rejected' }
      case 'NO_SHOW': return { color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'No Show' }
      default: return { color: '#71717a', bg: '#f4f4f5', border: '#e4e4e7', label: status }
    }
  }

  if (loading) return (
    <div className="dashboard" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
      <div style={{ fontSize: '2.5rem', animation: 'pulse-green 2s infinite' }}>📅</div>
      <h2 style={{ color: '#71717a', marginTop: '1rem' }}>Loading Booking System...</h2>
    </div>
  )

  return (
    <div className="dashboard">
      {/* PAGE HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #1e3a5f 100%)',
        borderRadius: '16px', padding: '2rem 2.5rem', color: 'white', marginBottom: '2rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <CalendarDays size={16} />
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#93c5fd' }}>Campus Bookings</span>
        </div>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.75rem', fontWeight: 800 }}>My Reservations</h1>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.92rem' }}>Book campus facilities and manage your schedule</p>
      </div>

      {/* TOAST NOTIFICATIONS */}
      {error && (
        <div style={{
          background: '#fef2f2', color: '#991b1b', padding: '0.85rem 1.25rem', borderRadius: '10px',
          marginBottom: '1.5rem', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.9rem', animation: 'fadeIn 0.3s'
        }}>
          <XCircle size={18} color="#ef4444" /> {error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b' }}><X size={16} /></button>
        </div>
      )}
      {success && (
        <div style={{
          background: '#f0fdf4', color: '#166534', padding: '0.85rem 1.25rem', borderRadius: '10px',
          marginBottom: '1.5rem', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontSize: '0.9rem', animation: 'fadeIn 0.3s'
        }}>
          <CheckCircle size={18} color="#22c55e" /> {success}
          <button onClick={() => setSuccess('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#166534' }}><X size={16} /></button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '440px 1fr', gap: '2rem' }}>
        
        {/* ============ NEW BOOKING FORM ============ */}
        <div style={{ height: 'fit-content' }}>
          <div style={{
            background: 'white', borderRadius: '16px', overflow: 'hidden',
            border: '1px solid #e4e4e7', boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
          }}>
            {/* Form Header with selected resource preview */}
            <div style={{
              background: '#09090b', padding: '1.5rem', color: 'white', position: 'relative'
            }}>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', fontWeight: 700 }}>New Reservation</h3>
              <p style={{ margin: 0, color: '#71717a', fontSize: '0.82rem' }}>Select a facility and pick your time slot</p>

              {/* Mini resource preview */}
              {selectedResource && (
                <div style={{
                  marginTop: '1rem', background: 'rgba(255,255,255,0.06)',
                  borderRadius: '10px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', gap: '0.75rem', alignItems: 'center'
                }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#27272a' }}>
                    <img
                      src={selectedResource.imageUrl || 'https://images.unsplash.com/photo-1598620617377-3bfb505b4384?auto=format&fit=crop&q=80&w=200'}
                      alt={selectedResource.name}
                      referrerPolicy="no-referrer"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { if (!e.target.dataset.fallback) { e.target.dataset.fallback = '1'; e.target.src = 'https://images.unsplash.com/photo-1598620617377-3bfb505b4384?auto=format&fit=crop&q=80&w=200' } }}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedResource.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#71717a', display: 'flex', gap: '0.5rem', marginTop: '0.15rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}><Users size={10} /> {selectedResource.capacity}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}><MapPin size={10} /> {selectedResource.location}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Body */}
            <div style={{ padding: '1.5rem' }}>
              <form onSubmit={handleBookResource}>
                {/* Facility Select */}
                <div style={{ marginBottom: '1.15rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#3f3f46', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Facility
                  </label>
                  <select name="resourceId" value={formData.resourceId} onChange={handleInputChange} required style={{
                    width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px',
                    border: '1px solid #e4e4e7', fontSize: '0.92rem', background: '#fafafa',
                    color: '#18181b', cursor: 'pointer', appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%2371717a\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E")',
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center',
                    boxSizing: 'border-box'
                  }}>
                    {resources.map(res => (
                      <option key={res.id} value={res.id}>{res.name} — {res.type.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>

                {/* Time Fields - Stacked */}
                <div style={{ marginBottom: '1.15rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#3f3f46', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Start Time
                  </label>
                  <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleInputChange} required style={{
                    width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px',
                    border: '1px solid #e4e4e7', fontSize: '0.92rem', background: '#fafafa', color: '#18181b',
                    boxSizing: 'border-box'
                  }} />
                </div>
                <div style={{ marginBottom: '1.15rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#3f3f46', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    End Time
                  </label>
                  <input type="datetime-local" name="endTime" value={formData.endTime} onChange={handleInputChange} required style={{
                    width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px',
                    border: '1px solid #e4e4e7', fontSize: '0.92rem', background: '#fafafa', color: '#18181b',
                    boxSizing: 'border-box'
                  }} />
                </div>

                {/* Purpose */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#3f3f46', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Purpose
                  </label>
                  <input type="text" name="purpose" placeholder="e.g., Team Meeting, Group Study, Workshop..." value={formData.purpose} onChange={handleInputChange} required style={{
                    width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px',
                    border: '1px solid #e4e4e7', fontSize: '0.92rem', background: '#fafafa', color: '#18181b',
                    boxSizing: 'border-box'
                  }} />
                </div>

                {/* Submit */}
                <button type="submit" style={{
                  width: '100%', padding: '0.8rem', fontSize: '0.95rem', fontWeight: 700,
                  background: 'linear-gradient(135deg, #18181b, #27272a)', color: 'white',
                  border: 'none', borderRadius: '12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  transition: 'opacity 0.2s, transform 0.2s',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <CalendarDays size={17} /> Confirm Booking
                </button>
              </form>

              {/* Info Hint */}
              <div style={{
                marginTop: '1rem', padding: '0.6rem 0.75rem', background: '#eff6ff',
                borderRadius: '8px', fontSize: '0.78rem', color: '#1d4ed8',
                display: 'flex', alignItems: 'flex-start', gap: '0.4rem', lineHeight: 1.5
              }}>
                <AlertTriangle size={14} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                Bookings require admin approval. You'll receive a notification once your request is reviewed.
              </div>
            </div>
          </div>
        </div>

        {/* ============ BOOKINGS LIST ============ */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#18181b' }}>Active Schedule</h2>
            <span style={{ fontSize: '0.82rem', color: '#71717a', background: '#f4f4f5', padding: '0.3rem 0.75rem', borderRadius: '99px', fontWeight: 600 }}>
              {myBookings.length} total
            </span>
          </div>

          {myBookings.length === 0 ? (
            <div style={{
              background: 'white', padding: '4rem 2rem', textAlign: 'center', borderRadius: '16px',
              border: '1px dashed #d4d4d8'
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '16px', background: '#f4f4f5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}>
                <Clock size={28} color="#a1a1aa" />
              </div>
              <h3 style={{ margin: '0 0 0.5rem', color: '#3f3f46' }}>No Reservations Yet</h3>
              <p style={{ color: '#71717a', margin: '0 0 1.5rem', fontSize: '0.92rem' }}>
                Use the form to book your first campus facility.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {myBookings.map(booking => {
                const now = new Date();
                const startTime = new Date(booking.startTime);
                const endTime = new Date(booking.endTime);
                const tenMinsBefore = new Date(startTime.getTime() - 10 * 60000);
                const fifteenMinsAfter = new Date(startTime.getTime() + 15 * 60000);
                const canCheckIn = booking.status === 'CONFIRMED' && !booking.checkedIn && now >= tenMinsBefore && now <= fifteenMinsAfter;
                const statusConfig = getStatusConfig(booking.status);
                const res = getResource(booking.resourceId);

                return (
                  <div key={booking.id} style={{
                    background: 'white', borderRadius: '14px',
                    border: `1px solid ${statusConfig.border}`,
                    overflow: 'hidden',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    transition: 'box-shadow 0.2s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)'}
                  >
                    <div style={{ display: 'flex' }}>
                      {/* Status Strip */}
                      <div style={{ width: '4px', background: statusConfig.color, flexShrink: 0 }} />

                      {/* Content */}
                      <div style={{ flex: 1, padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                        {/* Left Info */}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#18181b' }}>{getResourceName(booking.resourceId)}</h3>
                            {res && (
                              <span style={{ fontSize: '0.7rem', color: '#71717a', background: '#f4f4f5', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                                {res.type.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>

                          <p style={{ margin: '0 0 0.5rem', color: '#52525b', fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: 600 }}>Purpose:</span> {booking.purpose}
                          </p>

                          <div style={{ display: 'flex', gap: '1.25rem', color: '#71717a', fontSize: '0.82rem', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <CalendarDays size={13} color="#3b82f6" /> {startTime.toLocaleDateString()}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Clock size={13} color="#8b5cf6" /> {startTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} – {endTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                            </span>
                            {res?.location && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <MapPin size={13} color="#f59e0b" /> {res.location}
                              </span>
                            )}
                          </div>
                          
                          {booking.checkedIn && (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                              color: '#16a34a', fontSize: '0.78rem', marginTop: '0.5rem',
                              background: '#dcfce7', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 600
                            }}>
                              <CheckCircle size={13} /> Checked In
                            </span>
                          )}
                        </div>

                        {/* Right Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                          <span style={{
                            padding: '0.25rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem',
                            fontWeight: 700, color: statusConfig.color, background: statusConfig.bg,
                            border: `1px solid ${statusConfig.border}`
                          }}>
                            {statusConfig.label}
                          </span>
                          
                          {booking.status === 'CONFIRMED' && !booking.checkedIn && (
                            <button onClick={() => openQRPass(booking)} style={{
                              padding: '0.35rem 0.7rem', margin: 0, fontSize: '0.8rem',
                              background: '#18181b', color: 'white', border: 'none', borderRadius: '8px',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
                              fontWeight: 600, transition: 'opacity 0.2s'
                            }}>
                              <QrCode size={14} /> View Pass
                            </button>
                          )}

                          {canCheckIn && (
                            <button onClick={() => handleCheckIn(booking.id)} style={{
                              padding: '0.35rem 0.7rem', margin: 0, fontSize: '0.8rem',
                              background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white',
                              border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
                              animation: 'pulse-green 2s infinite',
                              display: 'flex', alignItems: 'center', gap: '0.3rem'
                            }}>
                              <CheckCircle size={14} /> Check In
                            </button>
                          )}

                          {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && !booking.checkedIn && (
                            <button onClick={() => handleCancelBooking(booking.id)} style={{
                              padding: '0.3rem 0.6rem', margin: 0, fontSize: '0.75rem',
                              background: 'transparent', color: '#ef4444', border: '1px solid #fecaca',
                              borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
                              transition: 'all 0.2s'
                            }}>
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- QR CODE MODAL (DIGITAL PASS) --- */}
      {qrModalOpen && selectedPass && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '90%', maxWidth: '360px',
            overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.3)',
            animation: 'fadeIn 0.3s'
          }}>
            
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #18181b, #1e3a5f)', color: 'white',
              padding: '1.75rem', textAlign: 'center', position: 'relative'
            }}>
              <button onClick={() => setQrModalOpen(false)} style={{
                position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.1)',
                border: 'none', color: 'white', cursor: 'pointer', borderRadius: '8px',
                width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}><X size={16} /></button>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px', margin: '0 auto 0.75rem',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <QrCode size={20} color="white" />
              </div>
              <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem', fontWeight: 700 }}>Smart Campus Pass</h2>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>Verified Reservation</p>
            </div>

            {/* Content */}
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 1.25rem', color: '#18181b', fontSize: '1.05rem' }}>{getResourceName(selectedPass.resourceId)}</h3>
              
              <div style={{
                background: '#fafafa', padding: '1.25rem', borderRadius: '14px',
                border: '2px dashed #e4e4e7', display: 'inline-block'
              }}>
                <QRCodeSVG 
                  value={JSON.stringify({
                    booking_id: selectedPass.id,
                    user: selectedPass.userEmail,
                    resource: selectedPass.resourceId,
                    time: selectedPass.startTime
                  })} 
                  size={180} 
                  level="H" 
                />
              </div>

              <div style={{
                marginTop: '1.25rem', background: '#f8fafc', padding: '1rem',
                borderRadius: '10px', textAlign: 'left', fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#71717a' }}>Start:</span>
                  <strong style={{ color: '#18181b' }}>{new Date(selectedPass.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#71717a' }}>User:</span>
                  <strong style={{ color: '#18181b', fontSize: '0.82rem' }}>{selectedPass.userEmail}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#71717a' }}>Booking ID:</span>
                  <span style={{ fontFamily: 'monospace', color: '#3b82f6', fontWeight: 700, fontSize: '0.82rem' }}>{selectedPass.id.slice(-8).toUpperCase()}</span>
                </div>
              </div>
            </div>
            
            <div style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white',
              padding: '0.85rem', textAlign: 'center', fontSize: '0.88rem', fontWeight: 700,
              letterSpacing: '0.02em'
            }}>
              ✓ Scan at Facility Entrance
            </div>
          </div>
        </div>
      )}

      {/* Inline animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}