import { useState, useEffect } from 'react'
import axios from 'axios'
import { Users, Server, ShieldAlert, Activity, CalendarCheck, Wrench, ArrowRight, Clock, CheckCircle, AlertTriangle, XCircle, Shield } from 'lucide-react'
import { getAllTickets } from '../services/ticketService'
import Toast from '../components/Toast'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('resources')
  const [toast, setToast] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Resource State
  const [resources, setResources] = useState([])
  const [formData, setFormData] = useState({
    name: '', type: 'LECTURE_HALL', capacity: 0, location: '', status: 'ACTIVE', features: '', imageUrl: ''
  })
  const [editingId, setEditingId] = useState(null)

  // User State
  const [users, setUsers] = useState([])

  // Audit Log State
  const [logs, setLogs] = useState([])

  const [allBookings, setAllBookings] = useState([])
  const [tickets, setTickets] = useState([])

  useEffect(() => {
    fetchResources()
    fetchUsers()
    fetchLogs()
    fetchAllBookings()
    fetchTickets()
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

  const fetchTickets = async () => {
    try {
      const data = await getAllTickets()
      setTickets(data)
    } catch (error) {
      console.error('Error fetching tickets:', error)
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
        setToast({ message: 'Resource updated successfully!', type: 'success' })
      } else {
        await axios.post('http://localhost:8080/api/resources', payload)
        setToast({ message: 'Resource created successfully!', type: 'success' })
      }
      setFormData({ name: '', type: 'LECTURE_HALL', capacity: 0, location: '', status: 'ACTIVE', features: '', imageUrl: '' })
      fetchResources()
    } catch (error) {
      console.error("Error saving resource:", error)
      setToast({ message: 'Failed to save resource. Please try again.', type: 'error' })
    }
  }

  const handleDeleteResource = (resource) => {
    setDeleteConfirm(resource)
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await axios.delete(`http://localhost:8080/api/resources/${deleteConfirm.id}`)
      fetchResources()
      setToast({ message: 'Resource deleted successfully.', type: 'success' })
    } catch (error) {
      console.error('Error deleting resource:', error)
      setToast({ message: 'Failed to delete resource.', type: 'error' })
    } finally {
      setDeleteConfirm(null)
    }
  }

  const handleEditResource = (resource) => {
    setEditingId(resource.id)
    setFormData({ ...resource, features: resource.features.join(', '), imageUrl: resource.imageUrl || '' })
    window.scrollTo(0, 0)
  }

  // --- User Handlers ---
  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`http://localhost:8080/api/users/${userId}/role`, { role: newRole })
      fetchUsers()
      setToast({ message: `Role updated to ${newRole}`, type: 'success' })
    } catch (error) {
      console.error("Error updating role:", error)
      setToast({ message: 'Failed to update role.', type: 'error' })
    }
  }

  // Handle Account Status Change (Suspend/Activate)
  const handleStatusChange = async (userId, newStatus) => {
    try {
      await axios.put(`http://localhost:8080/api/users/${userId}/status`, { status: newStatus })
      fetchUsers()
      setToast({ message: `Account status changed to ${newStatus}`, type: 'success' })
    } catch (error) {
      console.error("Error updating status:", error)
      setToast({ message: 'Failed to update account status.', type: 'error' })
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
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* PAGE HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #09090b 0%, #18181b 40%, #1e3a5f 100%)',
        borderRadius: '16px', padding: '2rem 2.5rem', color: 'white', marginBottom: '1.5rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
          top: '-100px', right: '-50px'
        }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Shield size={16} />
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#93c5fd' }}>Administration</span>
            </div>
            <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.75rem', fontWeight: 800 }}>Control Panel</h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.92rem' }}>Manage campus facilities, users, bookings & tickets</p>
          </div>

          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {[
              { key: 'resources', label: 'Resources', icon: Server },
              { key: 'logs', label: 'Logs', icon: Activity },
              { key: 'users', label: 'Users', icon: Users },
              { key: 'bookings', label: 'Bookings', icon: CalendarCheck },
              { key: 'tickets', label: 'Tickets', icon: Wrench },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)} style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.4rem 0.85rem', borderRadius: '8px', border: 'none',
                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                background: activeTab === key ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: activeTab === key ? 'white' : 'rgba(255,255,255,0.5)',
                backdropFilter: activeTab === key ? 'blur(4px)' : 'none',
                transition: 'all 0.2s'
              }}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- RESOURCES TAB --- */}
      {activeTab === 'resources' && (
        <>
          {/* Resource Form */}
          <div style={{
            background: 'white', borderRadius: '16px', border: '1px solid #e4e4e7',
            overflow: 'hidden', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{ background: '#09090b', padding: '1.25rem 1.5rem', color: 'white' }}>
              <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', fontWeight: 700 }}>
                {editingId ? '✏️ Edit Resource' : '➕ Add New Resource'}
              </h3>
              <p style={{ margin: 0, color: '#71717a', fontSize: '0.82rem' }}>
                {editingId ? 'Update the resource details below' : 'Fill in the details to create a new campus resource'}
              </p>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <form onSubmit={handleResourceSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#3f3f46', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleResourceChange} required placeholder="e.g., Lab A-201" style={{
                      width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px',
                      border: '1px solid #e4e4e7', fontSize: '0.92rem', background: '#fafafa', color: '#18181b', boxSizing: 'border-box',
                      transition: 'border-color 0.2s', outline: 'none'
                    }} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#e4e4e7'} />
                  </div>

                  {/* Type */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#3f3f46', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Type</label>
                    <select name="type" value={formData.type} onChange={handleResourceChange} style={{
                      width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px',
                      border: '1px solid #e4e4e7', fontSize: '0.92rem', background: '#fafafa', color: '#18181b', boxSizing: 'border-box', cursor: 'pointer'
                    }}>
                      <option value="LECTURE_HALL">Lecture Hall</option>
                      <option value="LAB">Lab</option>
                      <option value="MEETING_ROOM">Meeting Room</option>
                      <option value="EQUIPMENT">Equipment</option>
                    </select>
                  </div>

                  {/* Capacity */}
                  <div>
                    <label style={{ display: '0.78rem', fontSize: '0.78rem', fontWeight: 700, color: '#3f3f46', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Capacity</label>
                    <input type="number" name="capacity" value={formData.capacity} onChange={handleResourceChange} required style={{
                      width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px',
                      border: '1px solid #e4e4e7', fontSize: '0.92rem', background: '#fafafa', color: '#18181b', boxSizing: 'border-box',
                      transition: 'border-color 0.2s', outline: 'none'
                    }} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#e4e4e7'} />
                  </div>

                  {/* Location */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#3f3f46', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Location</label>
                    <input type="text" name="location" value={formData.location} onChange={handleResourceChange} required placeholder="e.g., Building C, Floor 2" style={{
                      width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px',
                      border: '1px solid #e4e4e7', fontSize: '0.92rem', background: '#fafafa', color: '#18181b', boxSizing: 'border-box',
                      transition: 'border-color 0.2s', outline: 'none'
                    }} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#e4e4e7'} />
                  </div>

                  {/* Status */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#3f3f46', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</label>
                    <select name="status" value={formData.status} onChange={handleResourceChange} style={{
                      width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px',
                      border: '1px solid #e4e4e7', fontSize: '0.92rem', background: '#fafafa', color: '#18181b', boxSizing: 'border-box', cursor: 'pointer'
                    }}>
                      <option value="ACTIVE">Active</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="OUT_OF_SERVICE">Out of Service</option>
                    </select>
                  </div>

                  {/* Features */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#3f3f46', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Features (comma separated)</label>
                    <input type="text" name="features" value={formData.features} onChange={handleResourceChange} placeholder="e.g., Projector, Whiteboard, AC" style={{
                      width: '100%', padding: '0.65rem 0.85rem', borderRadius: '10px',
                      border: '1px solid #e4e4e7', fontSize: '0.92rem', background: '#fafafa', color: '#18181b', boxSizing: 'border-box',
                      transition: 'border-color 0.2s', outline: 'none'
                    }} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#e4e4e7'} />
                  </div>
                </div>

                {/* Image URL — full width */}
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#3f3f46', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cover Image URL</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <input type="url" name="imageUrl" placeholder="https://example.com/image.jpg" value={formData.imageUrl || ''} onChange={handleResourceChange} style={{
                      flex: 1, padding: '0.65rem 0.85rem', borderRadius: '10px',
                      border: '1px solid #e4e4e7', fontSize: '0.92rem', background: '#fafafa', color: '#18181b', boxSizing: 'border-box',
                      transition: 'border-color 0.2s', outline: 'none'
                    }} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#e4e4e7'} />
                    {formData.imageUrl && (
                      <div style={{ width: '120px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#f4f4f5', flexShrink: 0, border: '1px solid #e4e4e7' }}>
                        <img
                          src={formData.imageUrl} alt="Preview" referrerPolicy="no-referrer"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.style.display = 'none' }}
                          onLoad={(e) => { e.target.style.display = 'block' }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit */}
                <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                  <button type="submit" style={{
                    padding: '0.7rem 1.5rem', fontSize: '0.92rem', fontWeight: 700,
                    background: 'linear-gradient(135deg, #18181b, #27272a)', color: 'white',
                    border: 'none', borderRadius: '10px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)', transition: 'opacity 0.2s'
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <Server size={15} /> {editingId ? 'Update Resource' : 'Save Resource'}
                  </button>
                  {editingId && (
                    <button type="button" onClick={() => {
                      setEditingId(null);
                      setFormData({ name: '', type: 'LECTURE_HALL', capacity: 0, location: '', status: 'ACTIVE', features: '', imageUrl: '' });
                    }} style={{
                      padding: '0.7rem 1.5rem', fontSize: '0.92rem', fontWeight: 600,
                      background: '#f4f4f5', color: '#52525b', border: 'none', borderRadius: '10px', cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#e4e4e7'}
                      onMouseLeave={e => e.currentTarget.style.background = '#f4f4f5'}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Resource Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total', count: resources.length, color: '#3b82f6' },
              { label: 'Active', count: resources.filter(r => r.status === 'ACTIVE').length, color: '#22c55e' },
              { label: 'Maintenance', count: resources.filter(r => r.status === 'MAINTENANCE').length, color: '#f59e0b' },
              { label: 'Out of Service', count: resources.filter(r => r.status === 'OUT_OF_SERVICE').length, color: '#ef4444' },
            ].map(({ label, count, color }, i) => (
              <div key={i} style={{
                background: 'white', borderRadius: '12px', padding: '1rem 1.25rem',
                border: '1px solid #e4e4e7', display: 'flex', alignItems: 'center', gap: '0.75rem'
              }}>
                <div style={{ width: '8px', height: '32px', borderRadius: '4px', background: color }} />
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#18181b' }}>{count}</div>
                  <div style={{ fontSize: '0.78rem', color: '#71717a', fontWeight: 600 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Resource Cards Grid */}
          <div className="grid">
            {resources.map((resource) => {
              const health = resource.currentHealthScore || 100;
              const healthColor = health > 70 ? '#22c55e' : health > 25 ? '#eab308' : '#ef4444';
              const statusBg = resource.status === 'ACTIVE' ? 'rgba(34,197,94,0.9)' : resource.status === 'MAINTENANCE' ? 'rgba(234,179,8,0.9)' : 'rgba(239,68,68,0.9)';

              return (
                <div key={resource.id} style={{
                  background: 'white', borderRadius: '14px', overflow: 'hidden',
                  border: resource.maintenanceAlert ? '2px solid #ef4444' : '1px solid #e4e4e7',
                  transition: 'transform 0.3s, box-shadow 0.3s', padding: 0
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  {/* Image Header */}
                  <div style={{ height: '200px', width: '100%', background: '#f4f4f5', position: 'relative' }}>
                    <img
                      src={resource.imageUrl || 'https://images.unsplash.com/photo-1598620617377-3bfb505b4384?auto=format&fit=crop&q=80&w=800'}
                      alt={resource.name} referrerPolicy="no-referrer"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { if (!e.target.dataset.fallback) { e.target.dataset.fallback = '1'; e.target.src = 'https://images.unsplash.com/photo-1598620617377-3bfb505b4384?auto=format&fit=crop&q=80&w=800'; } }}
                    />
                    <span style={{
                      position: 'absolute', top: '0.75rem', right: '0.75rem',
                      padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem',
                      fontWeight: 700, backdropFilter: 'blur(8px)', background: statusBg,
                      color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}>
                      {resource.status.replace(/_/g, ' ')}
                    </span>
                    {resource.maintenanceAlert && (
                      <span title="AI Maintenance Alert" style={{
                        position: 'absolute', top: '0.75rem', left: '0.75rem',
                        animation: 'pulse-red 2s infinite', fontSize: '1.1rem',
                        background: 'rgba(0,0,0,0.4)', borderRadius: '6px', padding: '0.2rem 0.5rem',
                        backdropFilter: 'blur(4px)'
                      }}>⚠️</span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '1.25rem' }}>
                    <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', fontWeight: 700, color: '#18181b' }}>{resource.name}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.82rem', color: '#71717a', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      <span style={{ background: '#f4f4f5', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                        {resource.type.replace(/_/g, ' ')}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>📍 {resource.location}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>👥 {resource.capacity}</span>
                    </div>

                    {/* Health Bar */}
                    <div style={{ background: '#f8fafc', padding: '0.6rem 0.75rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem', fontWeight: 700 }}>
                        <span style={{ color: '#52525b' }}>AI Health</span>
                        <span style={{ color: healthColor }}>{health}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: '#e4e4e7', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ width: `${health}%`, height: '100%', background: healthColor, borderRadius: '99px', transition: 'width 0.5s' }} />
                      </div>
                      {resource.maintenanceAlert && (
                        <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: '#ef4444', fontWeight: 700 }}>
                          ⚠ Predictive failure — service required
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleEditResource(resource)} style={{
                        flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #e4e4e7',
                        background: '#fafafa', color: '#18181b', fontSize: '0.82rem', fontWeight: 700,
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f4f4f5' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fafafa' }}
                      >✏️ Edit</button>
                      <button onClick={() => handleDeleteResource(resource)} style={{
                        flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #fecaca',
                        background: 'transparent', color: '#ef4444', fontSize: '0.82rem', fontWeight: 700,
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                      >🗑 Delete</button>
                    </div>
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
                    {new Date(booking.startTime).toLocaleDateString()} <br />
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

      {/* --- TICKETS TAB --- */}
      {activeTab === 'tickets' && (() => {
        const openT = tickets.filter(t => t.status === 'OPEN')
        const inProgT = tickets.filter(t => t.status === 'IN_PROGRESS')
        const resolvedT = tickets.filter(t => t.status === 'RESOLVED')
        const closedT = tickets.filter(t => t.status === 'CLOSED')
        const stages = [
          { label: 'Open', items: openT, icon: AlertTriangle, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
          { label: 'In Progress', items: inProgT, icon: Clock, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
          { label: 'Resolved', items: resolvedT, icon: CheckCircle, color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
          { label: 'Closed', items: closedT, icon: XCircle, color: '#71717a', bg: '#f4f4f5', border: '#e4e4e7' },
        ]
        return (
          <>
            {/* Summary Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              {stages.map(({ label, items, icon: Icon, color, bg }) => (
                <div key={label} style={{
                  background: 'white', borderRadius: '12px', padding: '1.25rem',
                  border: '1px solid #e4e4e7', textAlign: 'center'
                }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem' }}>
                    <Icon size={20} color={color} />
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#18181b' }}>{items.length}</div>
                  <div style={{ fontSize: '0.82rem', color: '#71717a', fontWeight: 600 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Workflow Pipeline */}
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e4e4e7', padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wrench size={18} color="#6366f1" /> Ticket Workflow
              </h3>

              {/* Pipeline Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                {stages.map(({ label, items, color, bg, border }, stageIdx) => (
                  <div key={label}>
                    {/* Column Header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.6rem 0.75rem', borderRadius: '8px', marginBottom: '0.75rem',
                      background: bg, border: `1px solid ${border}`
                    }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color }}>{label}</span>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 700, padding: '0.1rem 0.4rem',
                        borderRadius: '99px', background: color, color: 'white'
                      }}>{items.length}</span>
                    </div>

                    {/* Ticket Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: '100px' }}>
                      {items.slice(0, 6).map(ticket => (
                        <div key={ticket.id} style={{
                          background: '#fafafa', borderRadius: '8px', padding: '0.65rem 0.75rem',
                          border: '1px solid #e4e4e7', fontSize: '0.82rem',
                          transition: 'box-shadow 0.2s'
                        }}
                          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'}
                          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                        >
                          <div style={{ fontWeight: 700, color: '#18181b', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ticket.title}
                          </div>
                          <div style={{ color: '#a1a1aa', fontSize: '0.72rem' }}>
                            {ticket.reporterName} · {ticket.location}
                          </div>
                          {ticket.mlPriorityLevel && (
                            <span style={{
                              fontSize: '0.68rem', fontWeight: 700, marginTop: '0.25rem', display: 'inline-block',
                              padding: '0.1rem 0.4rem', borderRadius: '4px',
                              background: ticket.mlPriorityLevel <= 2 ? '#fef2f2' : '#f4f4f5',
                              color: ticket.mlPriorityLevel <= 2 ? '#ef4444' : '#71717a'
                            }}>P{ticket.mlPriorityLevel}</span>
                          )}
                        </div>
                      ))}
                      {items.length > 6 && (
                        <div style={{ fontSize: '0.78rem', color: '#a1a1aa', textAlign: 'center', padding: '0.25rem' }}>
                          +{items.length - 6} more
                        </div>
                      )}
                      {items.length === 0 && (
                        <div style={{ fontSize: '0.78rem', color: '#d4d4d8', textAlign: 'center', padding: '1.5rem 0.5rem' }}>
                          No tickets
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )
      })()}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease-out'
        }} onClick={() => setDeleteConfirm(null)}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '90%', maxWidth: '420px',
            overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.25)',
            animation: 'fadeIn 0.25s ease-out'
          }} onClick={e => e.stopPropagation()}>
            {/* Red Warning Header */}
            <div style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)', padding: '1.5rem',
              textAlign: 'center', color: 'white'
            }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 0.75rem', fontSize: '1.5rem'
              }}>🗑️</div>
              <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem', fontWeight: 800 }}>Delete Resource</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>This action cannot be undone</p>
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem' }}>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.92rem', color: '#3f3f46', textAlign: 'center', lineHeight: 1.6 }}>
                Are you sure you want to permanently delete
              </p>
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
                padding: '0.75rem 1rem', textAlign: 'center', marginBottom: '1.5rem'
              }}>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#18181b' }}>{deleteConfirm.name}</div>
                <div style={{ fontSize: '0.82rem', color: '#71717a', marginTop: '0.15rem' }}>
                  {deleteConfirm.type?.replace(/_/g, ' ')} · {deleteConfirm.location}
                </div>
              </div>

              <p style={{
                margin: '0 0 1.25rem', fontSize: '0.82rem', color: '#71717a', textAlign: 'center',
                lineHeight: 1.5, padding: '0 0.5rem'
              }}>
                All bookings associated with this resource will be affected. This operation is irreversible.
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setDeleteConfirm(null)} style={{
                  flex: 1, padding: '0.7rem', borderRadius: '10px', border: '1px solid #e4e4e7',
                  background: '#fafafa', color: '#3f3f46', fontSize: '0.92rem', fontWeight: 700,
                  cursor: 'pointer', transition: 'background 0.2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f4f4f5'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fafafa'}
                >
                  Cancel
                </button>
                <button onClick={confirmDelete} style={{
                  flex: 1, padding: '0.7rem', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white',
                  fontSize: '0.92rem', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.3)', transition: 'opacity 0.2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  🗑️ Delete Forever
                </button>
              </div>
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