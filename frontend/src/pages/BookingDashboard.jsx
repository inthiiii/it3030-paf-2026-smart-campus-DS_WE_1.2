import { useState, useEffect } from 'react'
import axios from 'axios'
import { CalendarDays, Clock, MapPin, XCircle, CheckCircle, QrCode, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

export default function BookingDashboard() {
  const [resources, setResources] = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // QR Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [selectedPass, setSelectedPass] = useState(null)

  const [formData, setFormData] = useState({
    resourceId: '',
    startTime: '',
    endTime: '',
    purpose: ''
  })

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('jwt_token')}` }
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [resResponse, bookingsResponse] = await Promise.all([
        axios.get('http://localhost:8080/api/resources'),
        axios.get('http://localhost:8080/api/bookings/my-bookings', authHeader())
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
    try {
      await axios.post('http://localhost:8080/api/bookings', formData, authHeader())
      setFormData(prev => ({ ...prev, startTime: '', endTime: '', purpose: '' }))
      fetchData()
      alert("Booking request submitted! Waiting for Admin approval.")
    } catch (err) {
      setError(err.response?.data || 'Failed to create booking.')
    }
  }

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      try {
        await axios.put(`http://localhost:8080/api/bookings/${bookingId}/cancel`, {}, authHeader())
        fetchData()
      } catch (err) {
        setError('Failed to cancel booking.')
      }
    }
  }

  const handleCheckIn = async (bookingId) => {
    try {
      await axios.put(`http://localhost:8080/api/bookings/${bookingId}/check-in`, {}, authHeader())
      fetchData() 
      alert("Checked in successfully! The room is yours.")
    } catch (err) {
      setError('Failed to check in.')
    }
  }

  const getResourceName = (id) => {
    const resource = resources.find(r => r.id === id)
    return resource ? resource.name : 'Unknown Resource'
  }

  // Handle opening the Digital Pass
  const openQRPass = (booking) => {
    setSelectedPass(booking)
    setQrModalOpen(true)
  }

  if (loading) return <h2>Loading Booking System...</h2>

  return (
    <div className="dashboard">
      <div className="header">
        <h1>My Reservations</h1>
        <p>Book campus facilities and manage your schedule</p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #f87171' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* NEW BOOKING FORM */}
        <div className="form-container" style={{ height: 'fit-content' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
            <CalendarDays size={20} /> New Reservation
          </h2>
          <form onSubmit={handleBookResource}>
            <div className="form-group">
              <label>Select Facility</label>
              <select name="resourceId" value={formData.resourceId} onChange={handleInputChange} required>
                {resources.map(res => (
                  <option key={res.id} value={res.id}>{res.name} ({res.type})</option>
                ))}
              </select>
            </div>
            <div className="form-group"><label>Start Time</label><input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleInputChange} required /></div>
            <div className="form-group"><label>End Time</label><input type="datetime-local" name="endTime" value={formData.endTime} onChange={handleInputChange} required /></div>
            <div className="form-group"><label>Purpose of Booking</label><input type="text" name="purpose" placeholder="e.g., Group Study" value={formData.purpose} onChange={handleInputChange} required /></div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Confirm Booking</button>
          </form>
        </div>

        {/* MY UPCOMING BOOKINGS */}
        <div>
          <h2>Active Schedule</h2>
          {myBookings.length === 0 ? (
            <div style={{ background: 'white', padding: '3rem', textAlign: 'center', borderRadius: '12px', border: '1px dashed #d4d4d8' }}>
              <Clock size={48} style={{ color: '#a1a1aa', margin: '0 auto 1rem' }} />
              <p style={{ color: '#71717a' }}>You have no active reservations.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myBookings.map(booking => {
                const now = new Date();
                const startTime = new Date(booking.startTime);
                const tenMinsBefore = new Date(startTime.getTime() - 10 * 60000);
                const fifteenMinsAfter = new Date(startTime.getTime() + 15 * 60000);
                const canCheckIn = booking.status === 'CONFIRMED' && !booking.checkedIn && now >= tenMinsBefore && now <= fifteenMinsAfter;

                return (
                  <div key={booking.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgb(0 0 0 / 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${booking.status === 'CANCELLED' || booking.status === 'NO_SHOW' || booking.status === 'REJECTED' ? '#ef4444' : booking.status === 'PENDING' ? '#eab308' : '#22c55e'}` }}>
                    
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem 0' }}>{getResourceName(booking.resourceId)}</h3>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#52525b', fontSize: '0.9rem' }}><strong>Purpose:</strong> {booking.purpose}</p>
                      <div style={{ display: 'flex', gap: '1.5rem', color: '#71717a', fontSize: '0.85rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CalendarDays size={14} /> {startTime.toLocaleString()}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>to {new Date(booking.endTime).toLocaleTimeString()}</span>
                      </div>
                      
                      {booking.checkedIn && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#16a34a', fontSize: '0.8rem', marginTop: '0.5rem', background: '#dcfce7', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                          <CheckCircle size={14} /> Checked In
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <span className={`status-badge status-${booking.status === 'CANCELLED' || booking.status === 'NO_SHOW' || booking.status === 'REJECTED' ? 'OUT_OF_SERVICE' : booking.status === 'PENDING' ? 'MAINTENANCE' : 'ACTIVE'}`}>
                        {booking.status}
                      </span>
                      
                      {/* NEW: QR CODE BUTTON */}
                      {booking.status === 'CONFIRMED' && !booking.checkedIn && (
                        <button onClick={() => openQRPass(booking)} className="btn" style={{ padding: '0.4rem 0.8rem', margin: 0, fontSize: '0.85rem', background: '#18181b', color: 'white', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <QrCode size={16} /> View Pass
                        </button>
                      )}

                      {canCheckIn && (
                        <button onClick={() => handleCheckIn(booking.id)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', margin: 0, fontSize: '0.85rem', animation: 'pulse-green 2s infinite' }}>
                          Check In Now
                        </button>
                      )}
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
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '90%', maxWidth: '350px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            {/* Header */}
            <div style={{ background: '#18181b', color: 'white', padding: '1.5rem', textAlign: 'center', position: 'relative' }}>
              <button onClick={() => setQrModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}><X size={20} /></button>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>Smart Campus Pass</h2>
              <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.9rem' }}>Verified Reservation</p>
            </div>

            {/* Content */}
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', color: '#3f3f46' }}>{getResourceName(selectedPass.resourceId)}</h3>
              
              <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '2px solid #f4f4f5', display: 'inline-block' }}>
                {/* The Dynamic QR Code Component */}
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

              <div style={{ marginTop: '1.5rem', background: '#f4f4f5', padding: '1rem', borderRadius: '8px', textAlign: 'left', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#71717a' }}>Start:</span>
                  <strong>{new Date(selectedPass.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#71717a' }}>User:</span>
                  <strong>{selectedPass.userEmail}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#71717a' }}>Booking ID:</span>
                  <span style={{ fontFamily: 'monospace', color: '#52525b' }}>{selectedPass.id.slice(-8).toUpperCase()}</span>
                </div>
              </div>
            </div>
            
            <div style={{ background: '#22c55e', color: 'white', padding: '1rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
              Scan at Facility Entrance
            </div>

          </div>
        </div>
      )}
    </div>
  )
}