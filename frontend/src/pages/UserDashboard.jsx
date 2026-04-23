import { useState, useEffect } from 'react'
import axios from 'axios'
import { MapPin, Users, MonitorPlay, ServerCrash, Search, LayoutGrid, Map, Filter, X, Zap } from 'lucide-react'

export default function UserDashboard() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [filterType, setFilterType] = useState('ALL')
  const [minCapacity, setMinCapacity] = useState(0)

  // Map Enhancement & AI Alternatives State
  const [selectedResource, setSelectedResource] = useState(null)
  const [aiAlternatives, setAiAlternatives] = useState([])
  const [findingAlternatives, setFindingAlternatives] = useState(false)

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

  // Handle Standard AI Text Search
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

  // NEW AI FEATURE: Smart Alternatives Finder
  const findAlternatives = async (brokenResource) => {
    setFindingAlternatives(true)
    try {
      // Ask Pinecone to find rooms with similar features/types
      const query = `${brokenResource.type} with ${brokenResource.features.join(', ')}`
      const response = await axios.get(`http://localhost:8080/api/resources/search?q=${query}`)
      
      // Filter out the broken room itself, and only suggest ACTIVE rooms
      const activeAlternatives = response.data.filter(
        r => r.id !== brokenResource.id && r.status === 'ACTIVE'
      )
      setAiAlternatives(activeAlternatives.slice(0, 2)) // Show top 2 best matches
    } catch (error) {
      console.error('Error finding alternatives:', error)
    } finally {
      setFindingAlternatives(false)
    }
  }

  // Handle Modal Open
  const handleNodeClick = (resource) => {
    setSelectedResource(resource)
    if (resource.status !== 'ACTIVE') {
      findAlternatives(resource)
    } else {
      setAiAlternatives([])
    }
  }

  // Apply Traditional Filters to the data
  const filteredResources = resources.filter(res => {
    const matchType = filterType === 'ALL' || res.type === filterType;
    const matchCap = res.capacity >= minCapacity;
    return matchType && matchCap;
  });

  const groupedResources = filteredResources.reduce((acc, resource) => {
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

      {/* SEARCH AND FILTERS */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <input 
            type="text" 
            placeholder="Ask the AI (e.g., 'I need a quiet room for 50 people with a projector')" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #d4d4d8', fontSize: '1rem' }} 
          />
          <button type="submit" className="btn btn-primary" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Search size={18} /> Search
          </button>
        </form>

        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #f4f4f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#52525b' }}>
            <Filter size={18} /> <strong>Filters:</strong>
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px' }}>
            <option value="ALL">All Types</option>
            <option value="LECTURE_HALL">Lecture Halls</option>
            <option value="LAB">Laboratories</option>
            <option value="MEETING_ROOM">Meeting Rooms</option>
            <option value="EQUIPMENT">Equipment</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Min Capacity: <strong>{minCapacity}</strong></span>
            <input 
              type="range" min="0" max="500" step="10" 
              value={minCapacity} onChange={(e) => setMinCapacity(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* VIEW TOGGLES */}
      <div className="view-toggle">
        <button 
          className={`btn ${viewMode === 'grid' ? 'btn-primary' : ''}`} 
          onClick={() => setViewMode('grid')}
          style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, background: viewMode !== 'grid' ? '#e4e4e7' : '', color: viewMode !== 'grid' ? '#3f3f46' : '' }}
        >
          <LayoutGrid size={18} /> Card View
        </button>
        <button 
          className={`btn ${viewMode === 'map' ? 'btn-primary' : ''}`} 
          onClick={() => setViewMode('map')}
          style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, background: viewMode !== 'map' ? '#e4e4e7' : '', color: viewMode !== 'map' ? '#3f3f46' : '' }}
        >
          <Map size={18} /> Dynamic Campus Map
        </button>
      </div>

      {/* CONTENT RENDERER */}
      {loading ? (
        <h2>Searching Campus Brain...</h2>
      ) : filteredResources.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#71717a' }}>
          <ServerCrash size={48} style={{ margin: '0 auto', marginBottom: '1rem' }} />
          <h3>No matches found based on your filters</h3>
        </div>
      ) : (
        <>
          {/* GRID VIEW */}
          {viewMode === 'grid' && (
            <div className="grid">
              {filteredResources.map((resource) => (
                <div key={resource.id} className="card" onClick={() => handleNodeClick(resource)} style={{ cursor: 'pointer', overflow: 'hidden', padding: 0 }}>
                  
                  {/* The Image Header with the SINGLE Status Badge */}
                  <div style={{ height: '200px', width: '100%', background: '#f4f4f5', position: 'relative' }}>
                    <img 
                      src={resource.imageUrl || 'https://images.unsplash.com/photo-1598620617377-3bfb505b4384?auto=format&fit=crop&q=80&w=800'} 
                      alt={resource.name} 
                      referrerPolicy="no-referrer"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { if (!e.target.dataset.fallback) { e.target.dataset.fallback = '1'; e.target.src = 'https://images.unsplash.com/photo-1598620617377-3bfb505b4384?auto=format&fit=crop&q=80&w=800'; } }} 
                    />
                    <span className={`status-badge status-${resource.status}`} style={{ position: 'absolute', top: '1rem', right: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                      {resource.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* The Text Details (Redundant badge removed, padding added) */}
                  <div style={{ padding: '1.5rem' }}>
                    <h2 style={{ margin: '0 0 0.5rem 0' }}>{resource.name}</h2>
                    <div className="icon-text"><MonitorPlay size={18} /><span>{resource.type.replace(/_/g, ' ')}</span></div>
                    <div className="icon-text"><Users size={18} /><span>Capacity: {resource.capacity}</span></div>
                    <div className="icon-text"><MapPin size={18} /><span>{resource.location}</span></div>
                  </div>
                  
                </div>
              ))}
            </div>
          )}

          {/* MAP VIEW */}
          {viewMode === 'map' && (
            <div className="campus-map">
              {Object.entries(groupedResources).map(([location, items]) => (
                <div key={location} className="map-zone">
                  <h3><MapPin size={20} /> {location}</h3>
                  <div className="zone-grid">
                    {items.map(resource => (
                      <div key={resource.id} className="map-node" onClick={() => handleNodeClick(resource)}>
                        <div className={`pulse-ring pulse-${resource.status}`}></div>
                        <h4 style={{ margin: '0.5rem 0', color: '#18181b' }}>{resource.name}</h4>
                        <span style={{ fontSize: '0.8rem', color: '#71717a', fontWeight: 'bold' }}>{resource.type.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* MAP ENHANCEMENT: QUICK VIEW MODAL */}
      {selectedResource && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '12px', width: '90%', maxWidth: '500px', position: 'relative', overflow: 'hidden' }}>
            <button onClick={() => setSelectedResource(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.8)', border: 'none', cursor: 'pointer', borderRadius: '50%', padding: '0.3rem', zIndex: 10 }}><X /></button>
            
            {/* NEW: Modal Header Image */}
            <div style={{ height: '200px', width: '100%' }}>
              <img 
                 src={selectedResource.imageUrl || 'https://images.unsplash.com/photo-1598620617377-3bfb505b4384?auto=format&fit=crop&q=80&w=800'} 
                 alt={selectedResource.name} 
                 referrerPolicy="no-referrer"
                 style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                 onError={(e) => { if (!e.target.dataset.fallback) { e.target.dataset.fallback = '1'; e.target.src = 'https://images.unsplash.com/photo-1598620617377-3bfb505b4384?auto=format&fit=crop&q=80&w=800'; } }}
              />
            </div>

            <div style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '-0.5rem' }}>
                <h2 style={{ margin: 0 }}>{selectedResource.name}</h2>
                <span className={`status-badge status-${selectedResource.status}`}>{selectedResource.status.replace(/_/g, ' ')}</span>
              </div>
              
              <div style={{ marginTop: '1.5rem' }}>
                <p><strong>Type:</strong> {selectedResource.type}</p>
                <p><strong>Location:</strong> {selectedResource.location}</p>
                <p><strong>Capacity:</strong> {selectedResource.capacity} seats</p>
                <p><strong>Features:</strong> {selectedResource.features.join(', ')}</p>
              </div>

              {/* AI SMART ALTERNATIVES MODULE */}
              {selectedResource.status !== 'ACTIVE' && (
                <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534' }}>
                    <Zap size={18} fill="#22c55e" /> AI Suggested Alternatives
                  </h4>
                  
                  {findingAlternatives ? (
                    <p style={{ color: '#166534', margin: 0 }}>AI is calculating best matches...</p>
                  ) : aiAlternatives.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {aiAlternatives.map(alt => (
                        <div key={alt.id} style={{ background: 'white', padding: '0.75rem', borderRadius: '6px', border: '1px solid #dcfce7', cursor: 'pointer' }} onClick={() => handleNodeClick(alt)}>
                          <strong>{alt.name}</strong> ({alt.location})
                          <div style={{ fontSize: '0.8rem', color: '#52525b', marginTop: '0.25rem' }}>Match found based on: {alt.features.slice(0,2).join(', ')}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#991b1b', margin: 0 }}>No active alternatives found right now.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}