import { useState } from 'react'
import { ClipboardList, AlertTriangle } from 'lucide-react'
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
