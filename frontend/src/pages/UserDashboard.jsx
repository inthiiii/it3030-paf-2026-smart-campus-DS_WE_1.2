import { useState, useEffect } from 'react'
import axios from 'axios'
import { MapPin, Users, MonitorPlay, ServerCrash, Search } from 'lucide-react'

export default function UserDashboard() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('') // New state for the search bar

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

  // New function to handle the AI Semantic Search
  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (searchQuery.trim() === '') {
        // If the search bar is empty, fetch everything normally
        await fetchResources()
      } else {
        // Call your brand new AI search endpoint
        const response = await axios.get(`http://localhost:8080/api/resources/search?q=${searchQuery}`)
        setResources(response.data)
      }
    } catch (error) {
      console.error('Error searching resources:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard">
      <div className="header">
        <h1>Smart Campus Operations Hub</h1>
        <p>Public Facilities & Assets Catalogue</p>
      </div>

      {/* AI Semantic Search Bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <input 
          type="text" 
          placeholder="Ask the AI (e.g., 'I need a quiet room for 50 people with a projector')" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ 
            flex: 1, 
            padding: '1rem', 
            borderRadius: '8px', 
            border: '1px solid #d4d4d8',
            fontSize: '1rem',
            boxShadow: '0 2px 4px -2px rgb(0 0 0 / 0.05)'
          }} 
        />
        <button type="submit" className="btn btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
          <Search size={18} /> Search
        </button>
      </form>

      {loading ? (
        <h2>Searching Campus Brain...</h2>
      ) : (
        <>
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

          {resources.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#71717a' }}>
              <ServerCrash size={48} style={{ margin: '0 auto', marginBottom: '1rem' }} />
              <h3>No AI matches found</h3>
              <p>Try rephrasing your request or clear the search bar to see all resources.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}