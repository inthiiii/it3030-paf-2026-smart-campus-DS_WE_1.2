import { useState, useEffect } from 'react'
import axios from 'axios'
import { MapPin, Users, MonitorPlay, ServerCrash, Search, LayoutGrid, Map } from 'lucide-react'

export default function UserDashboard() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid') // NEW: State for view toggle

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

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (searchQuery.trim() === '') {
        await fetchResources()
      } else {
        const response = await axios.get(`http://localhost:8080/api/resources/search?q=${searchQuery}`)
        setResources(response.data)
      }
    } catch (error) {
      console.error('Error searching resources:', error)
    } finally {
      setLoading(false)
    }
  }

  // NEW: Group resources by location for the Map View
  const groupedResources = resources.reduce((acc, resource) => {
    const loc = resource.location || 'Unassigned Location';
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(resource);
    return acc;
  }, {});

  return (
    <div className="dashboard">
      <div className="header">
        <h1>Smart Campus Operations Hub</h1>
        <p>Public Facilities & Assets Catalogue</p>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <input 
          type="text" 
          placeholder="Ask the AI (e.g., 'I need a quiet room for 50 people with a projector')" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: '1px solid #d4d4d8', fontSize: '1rem' }} 
        />
        <button type="submit" className="btn btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
          <Search size={18} /> Search
        </button>
      </form>

      {/* NEW: View Toggle Buttons */}
      <div className="view-toggle">
        <button 
          className={`btn ${viewMode === 'grid' ? 'btn-primary' : ''}`} 
          style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, background: viewMode !== 'grid' ? '#e4e4e7' : '', color: viewMode !== 'grid' ? '#3f3f46' : '' }}
          onClick={() => setViewMode('grid')}
        >
          <LayoutGrid size={18} /> Card View
        </button>
        <button 
          className={`btn ${viewMode === 'map' ? 'btn-primary' : ''}`} 
          style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, background: viewMode !== 'map' ? '#e4e4e7' : '', color: viewMode !== 'map' ? '#3f3f46' : '' }}
          onClick={() => setViewMode('map')}
        >
          <Map size={18} /> Dynamic Campus Map
        </button>
      </div>

      {loading ? (
        <h2>Searching Campus Brain...</h2>
      ) : resources.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#71717a' }}>
          <ServerCrash size={48} style={{ margin: '0 auto', marginBottom: '1rem' }} />
          <h3>No matches found</h3>
        </div>
      ) : (
        <>
          {/* STANDARD GRID VIEW */}
          {viewMode === 'grid' && (
            <div className="grid">
              {resources.map((resource) => (
                <div key={resource.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h2 style={{ margin: '0 0 0.5rem 0' }}>{resource.name}</h2>
                    <span className={`status-badge status-${resource.status}`}>{resource.status.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="icon-text"><MonitorPlay size={18} /><span>{resource.type.replace(/_/g, ' ')}</span></div>
                  <div className="icon-text"><Users size={18} /><span>Capacity: {resource.capacity}</span></div>
                  <div className="icon-text"><MapPin size={18} /><span>{resource.location}</span></div>
                  <div className="features">
                    {resource.features.map((f, i) => <span key={i} className="feature-tag">{f}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* NEW: DYNAMIC MAP VIEW */}
          {viewMode === 'map' && (
            <div className="campus-map">
              {Object.entries(groupedResources).map(([location, items]) => (
                <div key={location} className="map-zone">
                  <h3><MapPin size={20} /> {location}</h3>
                  <div className="zone-grid">
                    {items.map(resource => (
                      <div key={resource.id} className="map-node">
                        <div className={`pulse-ring pulse-${resource.status}`}></div>
                        <h4 style={{ margin: '0.5rem 0', color: '#18181b' }}>{resource.name}</h4>
                        <span style={{ fontSize: '0.8rem', color: '#71717a', fontWeight: 'bold' }}>
                          {resource.type.replace(/_/g, ' ')}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '0.5rem' }}>
                          Cap: {resource.capacity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}