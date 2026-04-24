import { useState, useEffect } from 'react'
import axios from 'axios'
import { MapPin, Users, MonitorPlay, ServerCrash, Search, LayoutGrid, Map, Filter, X, Zap, Sparkles, Brain, Target, Shuffle } from 'lucide-react'

export default function UserDashboard() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [filterType, setFilterType] = useState('ALL')
  const [minCapacity, setMinCapacity] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)

  // Exact vs Alternative matches
  const [exactMatches, setExactMatches] = useState([])
  const [alternativeMatches, setAlternativeMatches] = useState([])

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
      setHasSearched(false)
      setExactMatches([])
      setAlternativeMatches([])
    } catch (error) {
      console.error('Error fetching resources:', error)
      setLoading(false)
    }
  }

  // Improved search: local keyword matching + AI semantic, split into exact & alternative
  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (searchQuery.trim() === '') {
        await fetchResources()
        return
      }

      // 1. Fetch ALL resources for local keyword matching
      const allRes = await axios.get('http://localhost:8080/api/resources')
      const allResources = allRes.data
      const query = searchQuery.toLowerCase().trim()
      const queryTerms = query.split(/\s+/).filter(t => t.length > 1)

      // 2. Local exact keyword scoring
      const scored = allResources.map(r => {
        let score = 0
        const name = (r.name || '').toLowerCase()
        const type = (r.type || '').toLowerCase().replace(/_/g, ' ')
        const location = (r.location || '').toLowerCase()
        const features = (r.features || []).join(' ').toLowerCase()
        const combined = `${name} ${type} ${location} ${features}`

        // Exact name match = highest weight
        if (name.includes(query)) score += 100
        // Type match
        if (type.includes(query)) score += 80
        // Location match
        if (location.includes(query)) score += 60

        // Individual term matching
        for (const term of queryTerms) {
          if (name.includes(term)) score += 40
          if (type.includes(term)) score += 30
          if (location.includes(term)) score += 20
          if (features.includes(term)) score += 15
        }

        // Capacity match (if query mentions a number)
        const numberMatch = query.match(/\d+/)
        if (numberMatch && r.capacity >= parseInt(numberMatch[0])) score += 10

        return { ...r, localScore: score }
      })

      // 3. Separate exact (local keyword) hits vs not
      const localExact = scored.filter(r => r.localScore > 0).sort((a, b) => b.localScore - a.localScore)
      const localExactIds = new Set(localExact.map(r => r.id))

      // 4. Also fetch AI semantic results
      let semanticResults = []
      try {
        const aiRes = await axios.get(`http://localhost:8080/api/resources/search?q=${encodeURIComponent(searchQuery)}`)
        semanticResults = aiRes.data
      } catch (err) {
        console.error('Semantic search failed, using local only:', err)
      }

      // 5. Alternative = AI semantic results NOT already in exact matches
      const alternatives = semanticResults.filter(r => !localExactIds.has(r.id))

      // 6. If no local exact matches, promote top 3 semantic results to exact
      if (localExact.length === 0 && semanticResults.length > 0) {
        setExactMatches(semanticResults.slice(0, 3))
        setAlternativeMatches(semanticResults.slice(3))
      } else {
        setExactMatches(localExact)
        setAlternativeMatches(alternatives)
      }

      // Combined for filters & map view
      const combined = [...localExact, ...alternatives.filter(r => !localExactIds.has(r.id))]
      setResources(combined.length > 0 ? combined : [])
      setHasSearched(true)
    } catch (error) {
      console.error('Error searching resources:', error)
    } finally {
      setLoading(false)
    }
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery('')
    setHasSearched(false)
    setExactMatches([])
    setAlternativeMatches([])
    fetchResources()
  }

  // Smart Alternatives Finder for non-active resources
  const findAlternatives = async (brokenResource) => {
    setFindingAlternatives(true)
    try {
      const query = `${brokenResource.type} with ${brokenResource.features.join(', ')}`
      const response = await axios.get(`http://localhost:8080/api/resources/search?q=${query}`)
      const activeAlternatives = response.data.filter(
        r => r.id !== brokenResource.id && r.status === 'ACTIVE'
      )
      setAiAlternatives(activeAlternatives.slice(0, 2))
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

  // Resource card component
  const ResourceCard = ({ resource }) => (
    <div onClick={() => handleNodeClick(resource)} style={{
      cursor: 'pointer', overflow: 'hidden', padding: 0,
      background: 'white', borderRadius: '14px',
      border: '1px solid #e4e4e7', transition: 'transform 0.3s, box-shadow 0.3s'
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.08)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
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
          fontWeight: 700, backdropFilter: 'blur(8px)',
          background: resource.status === 'ACTIVE' ? 'rgba(34,197,94,0.9)' : resource.status === 'MAINTENANCE' ? 'rgba(234,179,8,0.9)' : 'rgba(239,68,68,0.9)',
          color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}>
          {resource.status.replace(/_/g, ' ')}
        </span>
      </div>
      <div style={{ padding: '1.25rem' }}>
        <h3 style={{ margin: '0 0 0.6rem', fontSize: '1.05rem', fontWeight: 700, color: '#18181b' }}>{resource.name}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#52525b' }}>
            <MonitorPlay size={15} color="#8b5cf6" /> {resource.type.replace(/_/g, ' ')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#52525b' }}>
            <Users size={15} color="#3b82f6" /> Capacity: {resource.capacity}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#52525b' }}>
            <MapPin size={15} color="#f59e0b" /> {resource.location}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="dashboard">
      {/* PAGE HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #09090b 0%, #18181b 40%, #1e3a5f 100%)',
        borderRadius: '16px', padding: '2.5rem', color: 'white', marginBottom: '2rem',
        boxShadow: '0 15px 30px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
          top: '-100px', right: '-50px'
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Search size={16} />
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#93c5fd' }}>AI-Powered Discovery</span>
          </div>
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '2rem', fontWeight: 800 }}>Browse Resources</h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>
            Explore campus facilities with AI-powered semantic search
          </p>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div style={{
        background: 'white', padding: '1.5rem', borderRadius: '14px', marginBottom: '1.5rem',
        border: '1px solid #e4e4e7', boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        {/* AI Search Bar */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0 1rem', borderRadius: '12px', border: '2px solid #e4e4e7',
            background: '#fafafa', transition: 'border-color 0.2s'
          }}>
            <Brain size={20} color="#8b5cf6" />
            <input 
              type="text" 
              placeholder="Ask the AI — e.g., 'a quiet room for 50 people with a projector'" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1, padding: '0.8rem 0', border: 'none', fontSize: '0.95rem',
                background: 'transparent', outline: 'none', color: '#18181b'
              }} 
            />
            {searchQuery && (
              <button type="button" onClick={clearSearch} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa', padding: '0.2rem'
              }}><X size={16} /></button>
            )}
          </div>
          <button type="submit" style={{
            padding: '0 1.5rem', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, #18181b, #27272a)', color: 'white',
            fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            transition: 'opacity 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Search size={16} /> Search
          </button>
        </form>

        {/* Filters Row */}
        <div style={{
          display: 'flex', gap: '1.5rem', alignItems: 'center',
          paddingTop: '1rem', borderTop: '1px solid #f4f4f5', flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#71717a', fontSize: '0.85rem', fontWeight: 700 }}>
            <Filter size={15} /> Filters:
          </div>

          {/* Type Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[
              { value: 'ALL', label: 'All' },
              { value: 'LECTURE_HALL', label: 'Lecture Halls' },
              { value: 'LAB', label: 'Labs' },
              { value: 'MEETING_ROOM', label: 'Meeting Rooms' },
              { value: 'EQUIPMENT', label: 'Equipment' }
            ].map(opt => (
              <button key={opt.value} onClick={() => setFilterType(opt.value)} style={{
                padding: '0.35rem 0.85rem', borderRadius: '99px', border: 'none',
                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                background: filterType === opt.value ? '#18181b' : '#f4f4f5',
                color: filterType === opt.value ? 'white' : '#52525b',
                transition: 'all 0.2s'
              }}>
                {opt.label}
              </button>
            ))}
          </div>

          <div style={{ width: '1px', height: '20px', background: '#e4e4e7' }} />

          {/* Capacity Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#52525b' }}>
            <Users size={14} />
            <span>Min: <strong style={{ color: '#18181b' }}>{minCapacity}</strong></span>
            <input 
              type="range" min="0" max="500" step="10" 
              value={minCapacity} onChange={(e) => setMinCapacity(Number(e.target.value))}
              style={{ width: '120px', accentColor: '#18181b' }}
            />
          </div>
        </div>
      </div>

      {/* VIEW TOGGLES */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button 
          onClick={() => setViewMode('grid')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1rem', borderRadius: '10px', border: 'none',
            fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
            background: viewMode === 'grid' ? '#18181b' : '#f4f4f5',
            color: viewMode === 'grid' ? 'white' : '#52525b',
            transition: 'all 0.2s'
          }}
        >
          <LayoutGrid size={16} /> Card View
        </button>
        <button 
          onClick={() => setViewMode('map')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1rem', borderRadius: '10px', border: 'none',
            fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
            background: viewMode === 'map' ? '#18181b' : '#f4f4f5',
            color: viewMode === 'map' ? 'white' : '#52525b',
            transition: 'all 0.2s'
          }}
        >
          <Map size={16} /> Campus Map
        </button>

        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem',
          fontSize: '0.85rem', color: '#71717a', background: '#f4f4f5',
          padding: '0.4rem 0.85rem', borderRadius: '99px', fontWeight: 600
        }}>
          <Sparkles size={14} /> {filteredResources.length} results
        </div>
      </div>

      {/* CONTENT RENDERER */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '2rem', animation: 'pulse-green 2s infinite' }}>🧠</div>
          <h3 style={{ color: '#71717a', marginTop: '1rem' }}>Searching Campus Brain...</h3>
        </div>
      ) : filteredResources.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem', background: 'white',
          borderRadius: '16px', border: '1px dashed #d4d4d8'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px', background: '#f4f4f5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <ServerCrash size={28} color="#a1a1aa" />
          </div>
          <h3 style={{ margin: '0 0 0.5rem', color: '#3f3f46' }}>No Matches Found</h3>
          <p style={{ color: '#71717a', fontSize: '0.92rem', margin: 0 }}>Try adjusting your filters or search with different keywords.</p>
        </div>
      ) : (
        <>
          {/* SEARCH RESULTS — SPLIT VIEW */}
          {hasSearched && viewMode === 'grid' && (
            <>
              {/* Exact Matches Section */}
              {exactMatches.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem',
                    padding: '0.75rem 1rem', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0'
                  }}>
                    <Target size={18} color="#16a34a" />
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#166534' }}>
                      Exact Matches
                    </h3>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700, padding: '0.1rem 0.4rem',
                      borderRadius: '99px', background: '#22c55e', color: 'white'
                    }}>{exactMatches.filter(r => {
                      const matchType = filterType === 'ALL' || r.type === filterType;
                      return matchType && r.capacity >= minCapacity;
                    }).length}</span>
                    <span style={{ fontSize: '0.82rem', color: '#166534', marginLeft: '0.25rem' }}>
                      — Resources matching your query directly
                    </span>
                  </div>
                  <div className="grid">
                    {exactMatches.filter(r => {
                      const matchType = filterType === 'ALL' || r.type === filterType;
                      return matchType && r.capacity >= minCapacity;
                    }).map(resource => (
                      <ResourceCard key={resource.id} resource={resource} />
                    ))}
                  </div>
                </div>
              )}

              {/* Alternative Matches Section */}
              {alternativeMatches.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem',
                    padding: '0.75rem 1rem', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe'
                  }}>
                    <Shuffle size={18} color="#2563eb" />
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e40af' }}>
                      AI-Suggested Alternatives
                    </h3>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700, padding: '0.1rem 0.4rem',
                      borderRadius: '99px', background: '#3b82f6', color: 'white'
                    }}>{alternativeMatches.filter(r => {
                      const matchType = filterType === 'ALL' || r.type === filterType;
                      return matchType && r.capacity >= minCapacity;
                    }).length}</span>
                    <span style={{ fontSize: '0.82rem', color: '#1e40af', marginLeft: '0.25rem' }}>
                      — Semantically similar resources found by AI
                    </span>
                  </div>
                  <div className="grid">
                    {alternativeMatches.filter(r => {
                      const matchType = filterType === 'ALL' || r.type === filterType;
                      return matchType && r.capacity >= minCapacity;
                    }).map(resource => (
                      <ResourceCard key={resource.id} resource={resource} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* REGULAR GRID (no search or map view) */}
          {(!hasSearched && viewMode === 'grid') && (
            <div className="grid">
              {filteredResources.map(resource => (
                <ResourceCard key={resource.id} resource={resource} />
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

      {/* RESOURCE DETAIL MODAL */}
      {selectedResource && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center',
          alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '90%', maxWidth: '520px',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 30px 60px rgba(0,0,0,0.25)', animation: 'fadeIn 0.3s'
          }}>
            <button onClick={() => setSelectedResource(null)} style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer',
              borderRadius: '8px', width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 10, color: 'white', backdropFilter: 'blur(4px)'
            }}><X size={16} /></button>
            
            <div style={{ height: '220px', width: '100%', position: 'relative' }}>
              <img 
                 src={selectedResource.imageUrl || 'https://images.unsplash.com/photo-1598620617377-3bfb505b4384?auto=format&fit=crop&q=80&w=800'} 
                 alt={selectedResource.name} referrerPolicy="no-referrer"
                 style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                 onError={(e) => { if (!e.target.dataset.fallback) { e.target.dataset.fallback = '1'; e.target.src = 'https://images.unsplash.com/photo-1598620617377-3bfb505b4384?auto=format&fit=crop&q=80&w=800'; } }}
              />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.5))'
              }} />
            </div>

            <div style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#18181b' }}>{selectedResource.name}</h2>
                <span style={{
                  padding: '0.25rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem',
                  fontWeight: 700, flexShrink: 0,
                  background: selectedResource.status === 'ACTIVE' ? '#f0fdf4' : selectedResource.status === 'MAINTENANCE' ? '#fffbeb' : '#fef2f2',
                  color: selectedResource.status === 'ACTIVE' ? '#16a34a' : selectedResource.status === 'MAINTENANCE' ? '#d97706' : '#dc2626',
                  border: `1px solid ${selectedResource.status === 'ACTIVE' ? '#bbf7d0' : selectedResource.status === 'MAINTENANCE' ? '#fde68a' : '#fecaca'}`
                }}>
                  {selectedResource.status.replace(/_/g, ' ')}
                </span>
              </div>
              
              <div style={{
                marginTop: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem'
              }}>
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Type</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#18181b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MonitorPlay size={14} color="#8b5cf6" /> {selectedResource.type.replace(/_/g, ' ')}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Capacity</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#18181b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Users size={14} color="#3b82f6" /> {selectedResource.capacity} seats
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Location</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#18181b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={14} color="#f59e0b" /> {selectedResource.location}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#71717a', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Features</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#18181b' }}>
                    {selectedResource.features?.length > 0 ? selectedResource.features.join(', ') : 'N/A'}
                  </div>
                </div>
              </div>

              {/* AI SMART ALTERNATIVES MODULE */}
              {selectedResource.status !== 'ACTIVE' && (
                <div style={{
                  marginTop: '1.25rem', padding: '1rem', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
                  border: '1px solid #bbf7d0'
                }}>
                  <h4 style={{
                    margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    color: '#166534', fontSize: '0.92rem', fontWeight: 700
                  }}>
                    <Zap size={16} fill="#22c55e" color="#22c55e" /> AI Suggested Alternatives
                  </h4>
                  
                  {findingAlternatives ? (
                    <p style={{ color: '#166534', margin: 0, fontSize: '0.88rem' }}>AI is calculating best matches...</p>
                  ) : aiAlternatives.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {aiAlternatives.map(alt => (
                        <div key={alt.id} style={{
                          background: 'white', padding: '0.75rem', borderRadius: '8px',
                          border: '1px solid #dcfce7', cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                          onClick={() => handleNodeClick(alt)}
                          onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                          onMouseLeave={e => e.currentTarget.style.background = 'white'}
                        >
                          <strong style={{ color: '#18181b', fontSize: '0.9rem' }}>{alt.name}</strong>
                          <span style={{ color: '#71717a', fontSize: '0.85rem' }}> • {alt.location}</span>
                          <div style={{ fontSize: '0.78rem', color: '#52525b', marginTop: '0.25rem' }}>
                            Match based on: {alt.features?.slice(0,2).join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#991b1b', margin: 0, fontSize: '0.88rem' }}>No active alternatives found right now.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}