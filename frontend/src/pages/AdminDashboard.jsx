import { useState, useEffect } from 'react'
import axios from 'axios'

export default function AdminDashboard() {
  const [resources, setResources] = useState([])
  // Form State
  const [formData, setFormData] = useState({
    name: '', type: 'LECTURE_HALL', capacity: 0, location: '', status: 'ACTIVE', features: ''
  })
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    fetchResources()
  }, [])

  const fetchResources = async () => {
    const response = await axios.get('http://localhost:8080/api/resources')
    setResources(response.data)
  }

  // Handle Input Changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Add or Update Resource (POST or PUT)
  const handleSubmit = async (e) => {
    e.preventDefault()
    // Convert comma-separated features string into an array
    const payload = {
      ...formData,
      features: formData.features.split(',').map(f => f.trim()).filter(f => f !== '')
    }

    try {
      if (editingId) {
        await axios.put(`http://localhost:8080/api/resources/${editingId}`, payload)
        setEditingId(null)
      } else {
        await axios.post('http://localhost:8080/api/resources', payload)
      }
      // Reset form and refresh data
      setFormData({ name: '', type: 'LECTURE_HALL', capacity: 0, location: '', status: 'ACTIVE', features: '' })
      fetchResources()
    } catch (error) {
      console.error("Error saving resource:", error)
    }
  }

  // Delete Resource
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this resource?")) {
      await axios.delete(`http://localhost:8080/api/resources/${id}`)
      fetchResources()
    }
  }

  // Populate form for editing
  const handleEdit = (resource) => {
    setEditingId(resource.id)
    setFormData({
      name: resource.name,
      type: resource.type,
      capacity: resource.capacity,
      location: resource.location,
      status: resource.status,
      features: resource.features.join(', ') // Convert array back to string for input
    })
    window.scrollTo(0, 0) // Scroll to top where form is
  }

  return (
    <div className="dashboard">
      <div className="header">
        <h1>Admin Control Panel</h1>
        <p>Manage Campus Facilities & Assets</p>
      </div>

      {/* The Input Form */}
      <div className="form-container">
        <h2>{editingId ? 'Edit Resource' : 'Add New Resource'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="LECTURE_HALL">Lecture Hall</option>
                <option value="LAB">Lab</option>
                <option value="MEETING_ROOM">Meeting Room</option>
                <option value="EQUIPMENT">Equipment</option>
              </select>
            </div>
            <div className="form-group">
              <label>Capacity</label>
              <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="ACTIVE">Active</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
              </select>
            </div>
            <div className="form-group">
              <label>Features</label>
              <input type="text" name="features" value={formData.features} onChange={handleChange} placeholder="e.g. Projector, AC, Whiteboard" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Update Resource' : 'Save New Resource'}
          </button>
        </form>
      </div>

      {/* The Management Grid */}
      <div className="grid">
        {resources.map((resource) => (
          <div key={resource.id} className="card">
            <h3 style={{ margin: '0 0 0.5rem 0' }}>{resource.name}</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#52525b' }}>{resource.type} • {resource.location}</p>
            
            <div className="admin-actions">
              <button onClick={() => handleEdit(resource)} className="btn btn-edit">Edit</button>
              <button onClick={() => handleDelete(resource.id)} className="btn btn-danger">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
