import { useState, useEffect } from 'react'
import axios from 'axios'
import { Users, Server, ShieldAlert, Activity, CalendarCheck } from 'lucide-react'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('resources') // 'resources' or 'users'
  
  // Resource State
  const [resources, setResources] = useState([])
  const [formData, setFormData] = useState({
    name: '', type: 'LECTURE_HALL', capacity: 0, location: '', status: 'ACTIVE', features: ''
  })
  const [editingId, setEditingId] = useState(null)

  // User State
  const [users, setUsers] = useState([])

  // Audit Log State
  const [logs, setLogs] = useState([])

  const [allBookings, setAllBookings] = useState([])

  useEffect(() => {
    fetchResources()
    fetchUsers()
    fetchLogs()
    fetchAllBookings()
  }, [])

  const fetchResources = async () => {
    const response = await axios.get('http://localhost:8080/api/resources')
    setResources(response.data)
  }

  const fetchUsers = async () => {
    const response = await axios.get('http://localhost:8080/api/users')
    setUsers(response.data)
  }

  const fetchLogs = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/audit')
      setLogs(response.data)
    } catch (error) {
      console.error("Error fetching logs:", error)
    }
  }

  const fetchAllBookings = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/bookings/all')
      setAllBookings(response.data)
    } catch (error) {
      console.error("Error fetching bookings:", error)
    }
  }

  // --- Resource Handlers ---
  const handleResourceChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })
  
  const handleResourceSubmit = async (e) => {
    e.preventDefault()
    const payload = { ...formData, features: formData.features.split(',').map(f => f.trim()).filter(f => f !== '') }
    try {
      if (editingId) {
        await axios.put(`http://localhost:8080/api/resources/${editingId}`, payload)
        setEditingId(null)
      } else {
        await axios.post('http://localhost:8080/api/resources', payload)
      }
      setFormData({ name: '', type: 'LECTURE_HALL', capacity: 0, location: '', status: 'ACTIVE', features: '' })
      fetchResources()
    } catch (error) {
      console.error("Error saving resource:", error)
    }
  }

  const handleDeleteResource = async (id) => {
    if (window.confirm("Delete this resource?")) {
      await axios.delete(`http://localhost:8080/api/resources/${id}`)
      fetchResources()
    }
  }

  const handleEditResource = (resource) => {
    setEditingId(resource.id)
    setFormData({ ...resource, features: resource.features.join(', ') })
    window.scrollTo(0, 0)
  }

  // --- User Handlers ---
  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`http://localhost:8080/api/users/${userId}/role`, { role: newRole })
      fetchUsers() 
    } catch (error) {
      console.error("Error updating role:", error)
      alert("Failed to update role. Check console.")
    }
  }

  // NEW: Handle Account Status Change (Suspend/Activate)
  const handleStatusChange = async (userId, newStatus) => {
    try {
      await axios.put(`http://localhost:8080/api/users/${userId}/status`, { status: newStatus })
      fetchUsers() 
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Failed to update account status. Check console.")
    }
  }

  const handleBookingAction = async (id, newStatus) => {
    try {
      await axios.put(`http://localhost:8080/api/bookings/${id}/status`, { status: newStatus })
      fetchAllBookings() 
    } catch (error) {
      console.error("Failed to update booking:", error)
    }
  }

  return (
    <div className="dashboard">
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1>Admin Control Panel</h1>
          <p>Manage Campus Facilities & User Access</p>
        </div>
        
        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className={`btn ${activeTab === 'resources' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('resources')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, background: activeTab !== 'resources' ? '#e4e4e7' : '', color: activeTab !== 'resources' ? '#3f3f46' : '' }}
          >
            <Server size={18} /> Resources
          </button>
          <button 
            className={`btn ${activeTab === 'logs' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('logs')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, background: activeTab !== 'logs' ? '#e4e4e7' : '', color: activeTab !== 'logs' ? '#3f3f46' : '' }}
          >
            <Activity size={18} /> System Logs
          </button>
          <button 
            className={`btn ${activeTab === 'users' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('users')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, background: activeTab !== 'users' ? '#e4e4e7' : '', color: activeTab !== 'users' ? '#3f3f46' : '' }}
          >
            <Users size={18} /> User Access
          </button>
          <button 
            className={`btn ${activeTab === 'bookings' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('bookings')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, background: activeTab !== 'bookings' ? '#e4e4e7' : '', color: activeTab !== 'bookings' ? '#3f3f46' : '' }}
          >
            <CalendarCheck size={18} /> Booking Requests
          </button>
        </div>
      </div>

      {/* --- RESOURCES TAB --- */}
      {activeTab === 'resources' && (
        <>
          <div className="form-container">
            <h2>{editingId ? 'Edit Resource' : 'Add New Resource'}</h2>
            <form onSubmit={handleResourceSubmit}>
              <div className="form-grid">
                <div className="form-group"><label>Name</label><input type="text" name="name" value={formData.name} onChange={handleResourceChange} required /></div>
                <div className="form-group"><label>Type</label><select name="type" value={formData.type} onChange={handleResourceChange}><option value="LECTURE_HALL">Lecture Hall</option><option value="LAB">Lab</option><option value="MEETING_ROOM">Meeting Room</option><option value="EQUIPMENT">Equipment</option></select></div>
                <div className="form-group"><label>Capacity</label><input type="number" name="capacity" value={formData.capacity} onChange={handleResourceChange} required /></div>
                <div className="form-group"><label>Location</label><input type="text" name="location" value={formData.location} onChange={handleResourceChange} required /></div>
                <div className="form-group"><label>Status</label><select name="status" value={formData.status} onChange={handleResourceChange}><option value="ACTIVE">Active</option><option value="MAINTENANCE">Maintenance</option><option value="OUT_OF_SERVICE">Out of Service</option></select></div>
                <div className="form-group"><label>Features (comma separated)</label><input type="text" name="features" value={formData.features} onChange={handleResourceChange} /></div>
              </div>
              <button type="submit" className="btn btn-primary">{editingId ? 'Update Resource' : 'Save New Resource'}</button>
            </form>
          </div>

          <div className="grid">
            {resources.map((resource) => {
              // Health Bar Color Logic
              const health = resource.currentHealthScore || 100;
              const healthColor = health > 70 ? '#22c55e' : health > 25 ? '#eab308' : '#ef4444';

              return (
                <div key={resource.id} className="card" style={{ border: resource.maintenanceAlert ? '2px solid #ef4444' : '1px solid #e4e4e7' }}>
                  
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>{resource.name}</h3>
                    {resource.maintenanceAlert && (
                      <span title="AI Maintenance Alert" style={{ animation: 'pulse-red 2s infinite' }}>⚠️</span>
                    )}
                  </div>
                  
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#52525b' }}>
                    {resource.type} • {resource.location}
                  </p>

                  {/* NEW: AI Predictive Health Bar */}
                  <div style={{ marginTop: '1rem', background: '#f4f4f5', padding: '0.75rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem', fontWeight: 'bold', color: '#3f3f46' }}>
                      <span>AI Health Forecast</span>
                      <span style={{ color: healthColor }}>{health}%</span>
                    </div>
                    {/* The Progress Bar */}
                    <div style={{ width: '100%', height: '8px', background: '#e4e4e7', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${health}%`, height: '100%', background: healthColor, transition: 'width 0.5s ease-in-out' }}></div>
                    </div>
                    {resource.maintenanceAlert && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold' }}>
                        Predictive Failure Imminent. Service required.
                      </div>
                    )}
                  </div>

                  <div className="admin-actions" style={{ marginTop: '1rem' }}>
                    <button onClick={() => handleEditResource(resource)} className="btn btn-edit">Edit</button>
                    <button onClick={() => handleDeleteResource(resource.id)} className="btn btn-danger">Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* --- USERS TAB  --- */}
      {activeTab === 'users' && (
        <div className="form-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#ef4444' }}>
            <ShieldAlert size={24} />
            <h2 style={{ margin: 0 }}>Access Control Management</h2>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e4e4e7' }}>
                <th style={{ padding: '1rem 0.5rem' }}>User</th>
                <th style={{ padding: '1rem 0.5rem' }}>Email</th>
                <th style={{ padding: '1rem 0.5rem' }}>System Role</th>
                <th style={{ padding: '1rem 0.5rem' }}>Account Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f4f4f5', opacity: user.accountStatus === 'DELETED' ? 0.6 : 1 }}>
                  <td style={{ padding: '1rem 0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src={user.pictureUrl} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', filter: user.accountStatus === 'DELETED' ? 'grayscale(100%)' : 'none' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong>{user.name}</strong>
                      {user.accountStatus === 'SUSPENDED' && <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold' }}>Suspended Access</span>}
                      {user.accountStatus === 'DELETED' && <span style={{ fontSize: '0.75rem', color: '#71717a', fontWeight: 'bold' }}>Soft Deleted</span>}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 0.5rem', color: '#52525b' }}>{user.email}</td>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <select 
                      value={user.role} 
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      style={{ padding: '0.4rem', borderRadius: '6px', border: '1px solid #d4d4d8' }}
                      disabled={user.email === 'ihthishamirshad781@gmail.com' || user.accountStatus === 'DELETED'} 
                    >
                      <option value="USER">User (Student/Staff)</option>
                      <option value="TECHNICIAN">Technician</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </td>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <select 
                      value={user.accountStatus || 'ACTIVE'} 
                      onChange={(e) => handleStatusChange(user.id, e.target.value)}
                      style={{ 
                        padding: '0.4rem', 
                        borderRadius: '6px', 
                        border: `1px solid ${user.accountStatus === 'SUSPENDED' ? '#ef4444' : '#d4d4d8'}`,
                        backgroundColor: user.accountStatus === 'SUSPENDED' ? '#fef2f2' : 'white',
                        color: user.accountStatus === 'SUSPENDED' ? '#991b1b' : 'inherit',
                        fontWeight: user.accountStatus === 'SUSPENDED' ? 'bold' : 'normal'
                      }}
                      disabled={user.email === 'ihthishamirshad781@gmail.com'} 
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="DELETED">Deleted</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* --- AUDIT LOGS TAB --- */}
      {activeTab === 'logs' && (
        <div className="form-container" style={{ background: '#09090b', color: '#a1a1aa', fontFamily: 'monospace' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#10b981' }}>
            <Activity size={24} />
            <h2 style={{ margin: 0, color: 'white', fontFamily: 'sans-serif' }}>Active Audit Trail</h2>
          </div>
          
          <div style={{ maxHeight: '500px', overflowY: 'auto', padding: '1rem', background: 'black', borderRadius: '8px', border: '1px solid #27272a' }}>
            {logs.length === 0 ? (
              <p>No system activity recorded yet...</p>
            ) : (
              logs.map((log) => {
                const date = new Date(log.timestamp).toLocaleString()
                
                const isSuspicious = log.action === 'SUSPICIOUS_LOGIN' || log.action === 'FAILED_LOGIN';
                const actionColor = isSuspicious ? '#ef4444' : '#f59e0b';
                
                return (
                  <div key={log.id} style={{ marginBottom: '1rem', borderBottom: '1px dashed #27272a', paddingBottom: '0.5rem', background: isSuspicious ? 'rgba(239, 68, 68, 0.1)' : 'transparent' }}>
                    <span style={{ color: '#3b82f6' }}>[{date}]</span>{' '}
                    <span style={{ color: actionColor, fontWeight: 'bold' }}>{log.action}</span>{' '}
                    <span style={{ color: 'white' }}>| User: {log.userEmail}</span>
                    <br />
                    <span style={{ color: isSuspicious ? '#ef4444' : '#10b981', marginLeft: '1rem', fontWeight: isSuspicious ? 'bold' : 'normal' }}>
                      ► {log.details}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
      
      {/* --- BOOKING REQUESTS TAB --- */}
      {activeTab === 'bookings' && (
        <div className="form-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#2563eb' }}>
            <CalendarCheck size={24} />
            <h2 style={{ margin: 0 }}>Reservation Approval Inbox</h2>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e4e4e7' }}>
                <th style={{ padding: '1rem 0.5rem' }}>User</th>
                <th style={{ padding: '1rem 0.5rem' }}>Resource ID</th>
                <th style={{ padding: '1rem 0.5rem' }}>Date & Time</th>
                <th style={{ padding: '1rem 0.5rem' }}>Purpose</th>
                <th style={{ padding: '1rem 0.5rem' }}>Status</th>
                <th style={{ padding: '1rem 0.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allBookings.map(booking => (
                <tr key={booking.id} style={{ borderBottom: '1px solid #f4f4f5', background: booking.aiRiskScore >= 50 ? '#fef2f2' : 'transparent' }}>
                  <td style={{ padding: '1rem 0.5rem' }}><strong>{booking.userEmail}</strong></td>
                  <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem', color: '#71717a' }}>{booking.resourceId.slice(-6)}</td>
                  <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem' }}>
                    {new Date(booking.startTime).toLocaleDateString()} <br/>
                    {new Date(booking.startTime).toLocaleTimeString()} - {new Date(booking.endTime).toLocaleTimeString()}
                  </td>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    {booking.purpose}
                    {booking.aiRiskScore !== null && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', color: booking.aiRiskScore > 40 ? '#ef4444' : '#22c55e' }}>
                        🤖 AI Risk: {booking.aiRiskScore}%
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <span className={`status-badge status-${booking.status === 'PENDING' ? 'MAINTENANCE' : booking.status === 'CONFIRMED' ? 'ACTIVE' : 'OUT_OF_SERVICE'}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 0.5rem', display: 'flex', gap: '0.5rem' }}>
                    {booking.status === 'PENDING' && (
                      <>
                        <button onClick={() => handleBookingAction(booking.id, 'CONFIRMED')} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', margin: 0, fontSize: '0.8rem' }}>Approve</button>
                        <button onClick={() => handleBookingAction(booking.id, 'REJECTED')} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', margin: 0, fontSize: '0.8rem' }}>Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}