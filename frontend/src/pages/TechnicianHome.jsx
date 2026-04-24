import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllTickets } from '../services/ticketService'
import axios from 'axios'
import {
  Wrench, ClipboardList, Clock, AlertTriangle, CheckCircle,
  ArrowRight, Bell, User, TrendingUp, XCircle
} from 'lucide-react'

const STATUS_COLORS = {
  OPEN: { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', label: 'Open' },
  IN_PROGRESS: { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'In Progress' },
  RESOLVED: { color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', label: 'Resolved' },
  CLOSED: { color: '#71717a', bg: '#f4f4f5', border: '#e4e4e7', label: 'Closed' },
}

export default function TechnicianHome() {
  const navigate = useNavigate()
  const name = localStorage.getItem('user_name') || 'Technician'
  const [tickets, setTickets] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getAllTickets().catch(() => []),
      axios.get('http://localhost:8080/api/notifications').then(r => r.data).catch(() => [])
    ]).then(([ticketData, notifData]) => {
      setTickets(ticketData)
      setNotifications(notifData)
      setLoading(false)
    })
  }, [])

  const openTickets = tickets.filter(t => t.status === 'OPEN')
  const inProgressTickets = tickets.filter(t => t.status === 'IN_PROGRESS')
  const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED')
  const closedTickets = tickets.filter(t => t.status === 'CLOSED')
  const unreadNotifs = notifications.filter(n => !n.read).length
  const recentTickets = tickets.slice(0, 5)

  // Tickets with high priority or SLA breaches
  const urgentTickets = tickets.filter(t =>
    (t.status === 'OPEN' || t.status === 'IN_PROGRESS') &&
    (t.mlPriorityLevel <= 2 || t.slaResponseBreached || t.slaResolutionBreached)
  ).slice(0, 3)

  if (loading) return (
    <div className="dashboard" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
      <div style={{ fontSize: '2.5rem', animation: 'pulse-green 2s infinite' }}>🔧</div>
      <h2 style={{ color: '#71717a', marginTop: '1rem' }}>Loading Dashboard...</h2>
    </div>
  )

  return (
    <div className="dashboard">
      {/* PAGE HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #18181b 0%, #1e3a5f 60%, #6366f1 100%)',
        borderRadius: '16px', padding: '2.5rem', color: 'white', marginBottom: '2rem',
        boxShadow: '0 15px 30px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          top: '-100px', right: '-50px'
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Wrench size={16} />
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#a5b4fc' }}>Maintenance Hub</span>
          </div>
          <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.75rem', fontWeight: 800 }}>Welcome back, {name.split(' ')[0]}</h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.92rem' }}>Here's your maintenance overview for today</p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Open', count: openTickets.length, icon: AlertTriangle, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'In Progress', count: inProgressTickets.length, icon: Clock, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Resolved', count: resolvedTickets.length, icon: CheckCircle, color: '#22c55e', bg: '#f0fdf4' },
          { label: 'Closed', count: closedTickets.length, icon: XCircle, color: '#71717a', bg: '#f4f4f5' },
          { label: 'Unread Alerts', count: unreadNotifs, icon: Bell, color: '#ef4444', bg: '#fef2f2' }
        ].map(({ label, count, icon: Icon, color, bg }, i) => (
          <div key={i} onClick={() => navigate('/manage-tickets')} style={{
            background: 'white', borderRadius: '14px', padding: '1.25rem',
            border: '1px solid #e4e4e7', cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} />
              </div>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#18181b' }}>{count}</span>
            </div>
            <span style={{ fontSize: '0.82rem', color: '#71717a', fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* URGENT / SLA BREACHED TICKETS */}
        <div style={{
          background: 'white', borderRadius: '14px', border: '1px solid #e4e4e7', overflow: 'hidden'
        }}>
          <div style={{
            padding: '1rem 1.25rem', borderBottom: '1px solid #f4f4f5',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} color="#ef4444" /> Urgent Tickets
            </h3>
            <button onClick={() => navigate('/manage-tickets')} style={{
              background: '#f4f4f5', border: 'none', borderRadius: '6px',
              padding: '0.3rem 0.6rem', fontSize: '0.78rem', cursor: 'pointer',
              fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem'
            }}>
              View All <ArrowRight size={12} />
            </button>
          </div>
          <div style={{ padding: '0.75rem 1.25rem' }}>
            {urgentTickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#71717a' }}>
                <CheckCircle size={32} color="#22c55e" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                <p style={{ margin: 0, fontSize: '0.88rem' }}>No urgent tickets — great job!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {urgentTickets.map(ticket => {
                  const sc = STATUS_COLORS[ticket.status] || STATUS_COLORS.OPEN
                  return (
                    <div key={ticket.id} onClick={() => navigate('/manage-tickets')} style={{
                      padding: '0.75rem', borderRadius: '10px', border: '1px solid #fecaca',
                      background: '#fef2f2', cursor: 'pointer', transition: 'background 0.2s'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.88rem', color: '#18181b' }}>{ticket.title}</strong>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem',
                          borderRadius: '99px', background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`
                        }}>{sc.label}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#71717a', marginTop: '0.25rem', display: 'flex', gap: '0.75rem' }}>
                        <span>📍 {ticket.location}</span>
                        {ticket.mlPriorityLevel && <span style={{ color: '#ef4444', fontWeight: 700 }}>P{ticket.mlPriorityLevel}</span>}
                        {(ticket.slaResponseBreached || ticket.slaResolutionBreached) && (
                          <span style={{ color: '#ef4444', fontWeight: 700 }}>⚠ SLA Breached</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* RECENT TICKETS */}
        <div style={{
          background: 'white', borderRadius: '14px', border: '1px solid #e4e4e7', overflow: 'hidden'
        }}>
          <div style={{
            padding: '1rem 1.25rem', borderBottom: '1px solid #f4f4f5',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardList size={18} color="#6366f1" /> Recent Tickets
            </h3>
            <button onClick={() => navigate('/manage-tickets')} style={{
              background: '#f4f4f5', border: 'none', borderRadius: '6px',
              padding: '0.3rem 0.6rem', fontSize: '0.78rem', cursor: 'pointer',
              fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem'
            }}>
              Manage <ArrowRight size={12} />
            </button>
          </div>
          <div style={{ padding: '0.5rem 1.25rem' }}>
            {recentTickets.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#71717a', padding: '2rem 0' }}>No tickets yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentTickets.map((ticket, i) => {
                  const sc = STATUS_COLORS[ticket.status] || STATUS_COLORS.OPEN
                  return (
                    <div key={ticket.id} style={{
                      padding: '0.65rem 0', borderBottom: i < recentTickets.length - 1 ? '1px solid #f4f4f5' : 'none',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#18181b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ticket.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                          {ticket.reporterName} · {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem',
                        borderRadius: '99px', flexShrink: 0, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`
                      }}>{sc.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TICKET DISTRIBUTION BAR */}
      <div style={{
        marginTop: '1.5rem', background: 'white', borderRadius: '14px',
        border: '1px solid #e4e4e7', padding: '1.5rem'
      }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} color="#6366f1" /> Ticket Distribution
        </h3>
        {tickets.length > 0 ? (
          <>
            <div style={{ display: 'flex', height: '12px', borderRadius: '99px', overflow: 'hidden', background: '#f4f4f5' }}>
              {[
                { count: openTickets.length, color: '#3b82f6' },
                { count: inProgressTickets.length, color: '#f59e0b' },
                { count: resolvedTickets.length, color: '#22c55e' },
                { count: closedTickets.length, color: '#71717a' }
              ].filter(s => s.count > 0).map((s, i) => (
                <div key={i} style={{
                  width: `${(s.count / tickets.length * 100)}%`,
                  background: s.color, transition: 'width 0.5s'
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Open', count: openTickets.length, color: '#3b82f6' },
                { label: 'In Progress', count: inProgressTickets.length, color: '#f59e0b' },
                { label: 'Resolved', count: resolvedTickets.length, color: '#22c55e' },
                { label: 'Closed', count: closedTickets.length, color: '#71717a' }
              ].map(({ label, count, color }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: '#52525b' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: color }} />
                  {label}: <strong>{count}</strong>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p style={{ color: '#71717a', margin: 0 }}>No ticket data available.</p>
        )}
      </div>
    </div>
  )
}
