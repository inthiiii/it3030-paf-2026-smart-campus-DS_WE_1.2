import { useState, useEffect } from 'react'
import axios from 'axios'
import { CalendarDays, Clock, MapPin, XCircle, CheckCircle } from 'lucide-react'

export default function BookingDashboard() {
  const [resources, setResources] = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Form State
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
      // Fetch both active resources and the user's personal bookings
      const [resResponse, bookingsResponse] = await Promise.all([
        axios.get('http://localhost:8080/api/resources'),
        axios.get('http://localhost:8080/api/bookings/my-bookings')
      ])
      
      // Only let users book resources that are currently ACTIVE
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
      await axios.post('http://localhost:8080/api/bookings', formData)
      
      // Reset form times and refresh bookings
      setFormData(prev => ({ ...prev, startTime: '', endTime: '', purpose: '' }))
      fetchData()
      alert("Booking confirmed!")
    } catch (err) {
      // Display the specific error from our Java Backend (e.g., Double Booking)
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

  // Helper function to find the resource name for a booking
  const getResourceName = (id) => {
    const resource = resources.find(r => r.id === id)
    return resource ? resource.name : 'Unknown Resource'
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
        
        {/* LEFT COLUMN: NEW BOOKING FORM */}
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
            
            <div className="form-group">
              <label>Start Time</label>
              <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleInputChange} required />
            </div>
            
            <div className="form-group">
              <label>End Time</label>
              <input type="datetime-local" name="endTime" value={formData.endTime} onChange={handleInputChange} required />
            </div>
            
            <div className="form-group">
              <label>Purpose of Booking</label>
              <input type="text" name="purpose" placeholder="e.g., Group Study, Club Meeting" value={formData.purpose} onChange={handleInputChange} required />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Confirm Booking</button>
          </form>
        </div>

        {/* RIGHT COLUMN: MY UPCOMING BOOKINGS */}
        <div>
          <h2>Active Schedule</h2>
          {myBookings.length === 0 ? (
            <div style={{ background: 'white', padding: '3rem', textAlign: 'center', borderRadius: '12px', border: '1px dashed #d4d4d8' }}>
              <Clock size={48} style={{ color: '#a1a1aa', margin: '0 auto 1rem' }} />
              <p style={{ color: '#71717a' }}>You have no active reservations.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myBookings.map(booking => (
                <div key={booking.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgb(0 0 0 / 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',  borderLeft: `4px solid ${booking.status === 'CANCELLED' || booking.status === 'REJECTED' ? '#ef4444' : booking.status === 'PENDING' ? '#eab308' : '#22c55e'}` }}>
                  
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>{getResourceName(booking.resourceId)}</h3>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#52525b', fontSize: '0.9rem' }}><strong>Purpose:</strong> {booking.purpose}</p>
                    <div style={{ display: 'flex', gap: '1.5rem', color: '#71717a', fontSize: '0.85rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><CalendarDays size={14} /> {new Date(booking.startTime).toLocaleString()}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>to {new Date(booking.endTime).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <span className={`status-badge status-${booking.status === 'CANCELLED' || booking.status === 'REJECTED' ? 'OUT_OF_SERVICE' : booking.status === 'PENDING' ? 'MAINTENANCE' : 'ACTIVE'}`}>
                      {booking.status}
                    </span>
                    {booking.status !== 'CANCELLED' && (
                      <button onClick={() => handleCancelBooking(booking.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <XCircle size={14} /> Cancel
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}