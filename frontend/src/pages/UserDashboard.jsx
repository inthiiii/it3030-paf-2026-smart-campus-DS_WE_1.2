import { useState, useEffect } from 'react'
import axios from 'axios'
import { MapPin, Users, MonitorPlay, ServerCrash } from 'lucide-react'

export default function UserDashboard() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResources()
  }, [])

  const fetchResources = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/resources')
      setResources(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching resources:', error)
      setLoading(false)
    }
  }

  if (loading) return <h2>Loading Smart Campus Resources...</h2>

  return (
    <div className="dashboard">
      <div className="header">
        <h1>Smart Campus Operations Hub</h1>
        <p>Public Facilities & Assets Catalogue</p>
      </div>

      <div className="grid">
        {resources.map((resource) => (
          <div key={resource.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 style={{ margin: '0 0 0.5rem 0' }}>{resource.name}</h2>
              <span className={`status-badge status-${resource.status}`}>
                {resource.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="icon-text"><MonitorPlay size={18} /><span>{resource.type.replace(/_/g, ' ')}</span></div>
            <div className="icon-text"><Users size={18} /><span>Capacity: {resource.capacity}</span></div>
            <div className="icon-text"><MapPin size={18} /><span>{resource.location}</span></div>
            <div className="features">
              {resource.features.map((feature, index) => (
                <span key={index} className="feature-tag">{feature}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
