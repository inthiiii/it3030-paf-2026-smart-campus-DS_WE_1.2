import { useState } from 'react'
import { ClipboardList, AlertTriangle, Wrench } from 'lucide-react'
import MyTicketsPage from './tickets/MyTicketsPage'
import ReportTicketPage from './tickets/ReportTicketPage'

const TABS = [
  { key: 'my-tickets', label: 'My Tickets', icon: ClipboardList },
  { key: 'raise-ticket', label: 'Raise a Ticket', icon: AlertTriangle },
]

export default function TicketsPage() {
  const [activeTab, setActiveTab] = useState('my-tickets')

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      {/* Page Header */}
      <div style={{
        background: 'linear-gradient(135deg, #18181b 0%, #27272a 40%, #4c1d95 100%)',
        borderRadius: '16px', padding: '2rem 2.5rem', color: 'white', marginBottom: '1.5rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', width: '250px', height: '250px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
          top: '-80px', right: '-30px'
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Wrench size={16} />
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#c4b5fd' }}>Support Center</span>
          </div>
          <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.75rem', fontWeight: 800 }}>Maintenance Tickets</h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.92rem' }}>Report issues and track your maintenance requests</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{
        display: 'flex', gap: '0.25rem',
        background: '#f4f4f5', borderRadius: '12px',
        padding: '0.3rem', marginBottom: '1.5rem',
        width: 'fit-content'
      }}>
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 1.25rem',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#ffffff' : '#52525b',
                background: isActive ? '#18181b' : 'transparent',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'my-tickets' && <MyTicketsPage />}
      {activeTab === 'raise-ticket' && <ReportTicketPage />}
    </div>
  )
}
