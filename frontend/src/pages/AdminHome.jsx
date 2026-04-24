import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Shield, Bell, Server, Activity, Users, CalendarCheck,
  ArrowRight, AlertTriangle, CheckCircle, XCircle, Wrench,
  TrendingUp, UserX, Trash2, ClipboardList
} from 'lucide-react'
import { getAllTickets } from '../services/ticketService'

export default function AdminHome() {
  const navigate = useNavigate()
  const userName = localStorage.getItem('user_name') || 'Admin'
  const userEmail = localStorage.getItem('user_email')
  const userPicture = localStorage.getItem('user_picture')

  const [unreadCount, setUnreadCount] = useState(0)
  const [resources, setResources] = useState([])
  const [logs, setLogs] = useState([])
  const [users, setUsers] = useState([])
  const [bookings, setBookings] = useState([])
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get(`http://localhost:8080/api/notifications/${userEmail}`).catch(() => ({ data: [] })),
      axios.get('http://localhost:8080/api/resources').catch(() => ({ data: [] })),
      axios.get('http://localhost:8080/api/audit').catch(() => ({ data: [] })),
      axios.get('http://localhost:8080/api/users').catch(() => ({ data: [] })),
      axios.get('http://localhost:8080/api/bookings/all').catch(() => ({ data: [] }))
    ]).then(([notifRes, resRes, logRes, userRes, bookRes]) => {
      setUnreadCount(notifRes.data.filter(n => !n.read).length)
      setResources(resRes.data)
      setLogs(logRes.data)
      setUsers(userRes.data)
      setBookings(bookRes.data)
      setLoading(false)
    })

    // Fetch tickets separately (uses auth header from ticketService)
    getAllTickets().then(data => setTickets(data)).catch(() => setTickets([]))
  }, [userEmail])

  // Derived data
  const activeResources = resources.filter(r => r.status === 'ACTIVE').length
  const maintenanceResources = resources.filter(r => r.status === 'MAINTENANCE').length
  const oosResources = resources.filter(r => r.status === 'OUT_OF_SERVICE').length
  const healthAlerts = resources.filter(r => r.maintenanceAlert).length
  const avgHealth = resources.length > 0
    ? Math.round(resources.reduce((sum, r) => sum + (r.currentHealthScore || 100), 0) / resources.length)
    : 100

  const suspiciousLogs = logs.filter(l => l.action === 'SUSPICIOUS_LOGIN' || l.action === 'FAILED_LOGIN')
  const recentSuspicious = suspiciousLogs.slice(0, 3)
  const suspendedUsers = users.filter(u => u.accountStatus === 'SUSPENDED')
  const deletedUsers = users.filter(u => u.accountStatus === 'DELETED')

  const latestLogs = logs.slice(0, 5)
  const pendingBookings = bookings.filter(b => b.status === 'PENDING').slice(0, 5)
  const totalPending = bookings.filter(b => b.status === 'PENDING').length

  // Ticket stats
  const openTickets = tickets.filter(t => t.status === 'OPEN')
  const inProgressTickets = tickets.filter(t => t.status === 'IN_PROGRESS')
  const allOpenTickets = [...openTickets, ...inProgressTickets]
  const recentOpenTickets = allOpenTickets.slice(0, 5)

  if (loading) {
    return (
      <div className="dashboard" style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '2rem', animation: 'pulse-green 2s infinite' }}>⚙️</div>
        <h2 style={{ color: '#71717a' }}>Loading Admin Dashboard...</h2>
      </div>
    )
  }

  return (
    <div className="dashboard">

      {/* WELCOME BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%)',
        borderRadius: '16px',
        padding: '2.5rem',
        color: 'white',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Shield size={16} />
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#a1a1aa' }}>Administrator</span>
          </div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>Welcome back, {userName.split(' ')[0]} 👋</h1>
          <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.95rem' }}>
            Here's what's happening across your campus today.
          </p>
        </div>
        {userPicture && (
          <img src={userPicture} alt="Admin" style={{ width: '64px', height: '64px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.2)' }} />
        )}
      </div>

      {/* QUICK STATS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {/* Notifications */}
        <div onClick={() => navigate('/admin/manage')} style={{
          background: unreadCount > 0 ? '#fef2f2' : 'white',
          border: unreadCount > 0 ? '1px solid #fecaca' : '1px solid #e4e4e7',
          borderRadius: '12px', padding: '1.25rem', cursor: 'pointer', transition: 'transform 0.2s'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Bell size={18} color={unreadCount > 0 ? '#ef4444' : '#71717a'} />
            <span style={{ fontSize: '0.85rem', color: '#71717a', fontWeight: 600 }}>Notifications</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: unreadCount > 0 ? '#ef4444' : '#18181b' }}>
            {unreadCount}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#71717a' }}>unread alerts</span>
        </div>

        {/* Total Resources */}
        <div onClick={() => navigate('/admin/manage')} style={{
          background: 'white', border: '1px solid #e4e4e7',
          borderRadius: '12px', padding: '1.25rem', cursor: 'pointer', transition: 'transform 0.2s'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Server size={18} color="#3b82f6" />
            <span style={{ fontSize: '0.85rem', color: '#71717a', fontWeight: 600 }}>Resources</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#18181b' }}>{resources.length}</div>
          <span style={{ fontSize: '0.8rem', color: '#71717a' }}>total facilities</span>
        </div>

        {/* Health Alerts */}
        <div onClick={() => navigate('/admin/manage')} style={{
          background: healthAlerts > 0 ? '#fffbeb' : 'white',
          border: healthAlerts > 0 ? '1px solid #fde68a' : '1px solid #e4e4e7',
          borderRadius: '12px', padding: '1.25rem', cursor: 'pointer', transition: 'transform 0.2s'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <AlertTriangle size={18} color={healthAlerts > 0 ? '#f59e0b' : '#71717a'} />
            <span style={{ fontSize: '0.85rem', color: '#71717a', fontWeight: 600 }}>Health Alerts</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: healthAlerts > 0 ? '#f59e0b' : '#18181b' }}>{healthAlerts}</div>
          <span style={{ fontSize: '0.8rem', color: '#71717a' }}>need attention</span>
        </div>

        {/* Pending Bookings */}
        <div onClick={() => navigate('/admin/manage')} style={{
          background: totalPending > 0 ? '#eff6ff' : 'white',
          border: totalPending > 0 ? '1px solid #bfdbfe' : '1px solid #e4e4e7',
          borderRadius: '12px', padding: '1.25rem', cursor: 'pointer', transition: 'transform 0.2s'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <CalendarCheck size={18} color={totalPending > 0 ? '#3b82f6' : '#71717a'} />
            <span style={{ fontSize: '0.85rem', color: '#71717a', fontWeight: 600 }}>Pending</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: totalPending > 0 ? '#3b82f6' : '#18181b' }}>{totalPending}</div>
          <span style={{ fontSize: '0.8rem', color: '#71717a' }}>awaiting approval</span>
        </div>

        {/* Open Tickets */}
        <div onClick={() => navigate('/all-tickets')} style={{
          background: allOpenTickets.length > 0 ? '#fef2f2' : 'white',
          border: allOpenTickets.length > 0 ? '1px solid #fecaca' : '1px solid #e4e4e7',
          borderRadius: '12px', padding: '1.25rem', cursor: 'pointer', transition: 'transform 0.2s'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <ClipboardList size={18} color={allOpenTickets.length > 0 ? '#ef4444' : '#71717a'} />
            <span style={{ fontSize: '0.85rem', color: '#71717a', fontWeight: 600 }}>Open Tickets</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: allOpenTickets.length > 0 ? '#ef4444' : '#18181b' }}>{allOpenTickets.length}</div>
          <span style={{ fontSize: '0.8rem', color: '#71717a' }}>need resolution</span>
        </div>
      </div>

      {/* MAIN CONTENT — TWO COLUMN LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* RESOURCE SUMMARY */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e4e4e7', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Server size={18} color="#3b82f6" /> Resource Overview
            </h3>
            <button onClick={() => navigate('/admin/manage')} className="btn" style={{ margin: 0, padding: '0.3rem 0.75rem', fontSize: '0.8rem', background: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              Manage <ArrowRight size={14} />
            </button>
          </div>

          {/* Status Breakdown */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ flex: 1, background: '#dcfce7', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#166534' }}>{activeResources}</div>
              <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 600 }}>Active</div>
            </div>
            <div style={{ flex: 1, background: '#fef08a', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#854d0e' }}>{maintenanceResources}</div>
              <div style={{ fontSize: '0.75rem', color: '#854d0e', fontWeight: 600 }}>Maintenance</div>
            </div>
            <div style={{ flex: 1, background: '#fee2e2', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#991b1b' }}>{oosResources}</div>
              <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600 }}>Out of Service</div>
            </div>
          </div>

          {/* Average Health */}
          <div style={{ background: '#f4f4f5', padding: '0.75rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, color: '#3f3f46' }}>
                <TrendingUp size={14} /> Campus Avg Health
              </span>
              <span style={{ fontWeight: 700, color: avgHealth > 70 ? '#22c55e' : avgHealth > 25 ? '#eab308' : '#ef4444' }}>{avgHealth}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#e4e4e7', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${avgHealth}%`, height: '100%', background: avgHealth > 70 ? '#22c55e' : avgHealth > 25 ? '#eab308' : '#ef4444', borderRadius: '4px', transition: 'width 0.5s' }} />
            </div>
          </div>
        </div>

        {/* USER ACCESS ALERTS */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e4e4e7', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="#ef4444" /> User Access Alerts
            </h3>
            <button onClick={() => navigate('/admin/manage')} className="btn" style={{ margin: 0, padding: '0.3rem 0.75rem', fontSize: '0.8rem', background: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              Manage <ArrowRight size={14} />
            </button>
          </div>

          {/* Suspicious Logins */}
          {recentSuspicious.length > 0 ? (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <AlertTriangle size={14} /> Suspicious Activity ({suspiciousLogs.length} total)
              </div>
              {recentSuspicious.map(log => (
                <div key={log.id} style={{ background: '#fef2f2', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '0.4rem', fontSize: '0.8rem', border: '1px solid #fecaca' }}>
                  <strong style={{ color: '#991b1b' }}>{log.action}</strong>
                  <span style={{ color: '#71717a' }}> — {log.userEmail}</span>
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.15rem' }}>{log.details}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={16} /> No suspicious login activity detected
            </div>
          )}

          {/* Suspended / Deleted Users */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 1, background: suspendedUsers.length > 0 ? '#fef2f2' : '#f4f4f5', padding: '0.6rem', borderRadius: '8px', textAlign: 'center' }}>
              <UserX size={16} color={suspendedUsers.length > 0 ? '#ef4444' : '#71717a'} style={{ margin: '0 auto 0.25rem' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: suspendedUsers.length > 0 ? '#ef4444' : '#3f3f46' }}>{suspendedUsers.length}</div>
              <div style={{ fontSize: '0.7rem', color: '#71717a' }}>Suspended</div>
            </div>
            <div style={{ flex: 1, background: deletedUsers.length > 0 ? '#f4f4f5' : '#f4f4f5', padding: '0.6rem', borderRadius: '8px', textAlign: 'center' }}>
              <Trash2 size={16} color="#71717a" style={{ margin: '0 auto 0.25rem' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3f3f46' }}>{deletedUsers.length}</div>
              <div style={{ fontSize: '0.7rem', color: '#71717a' }}>Soft Deleted</div>
            </div>
            <div style={{ flex: 1, background: '#f4f4f5', padding: '0.6rem', borderRadius: '8px', textAlign: 'center' }}>
              <Users size={16} color="#3b82f6" style={{ margin: '0 auto 0.25rem' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3f3f46' }}>{users.length}</div>
              <div style={{ fontSize: '0.7rem', color: '#71717a' }}>Total Users</div>
            </div>
          </div>
        </div>

        {/* SYSTEM LOGS */}
        <div style={{ background: '#09090b', borderRadius: '12px', padding: '1.5rem', border: '1px solid #27272a', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
              <Activity size={18} color="#10b981" /> System Logs
            </h3>
            <button onClick={() => navigate('/admin/manage')} className="btn" style={{ margin: 0, padding: '0.3rem 0.75rem', fontSize: '0.8rem', background: '#27272a', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
            {latestLogs.length === 0 ? (
              <p style={{ color: '#71717a' }}>No logs recorded yet...</p>
            ) : (
              latestLogs.map(log => {
                const isSuspicious = log.action === 'SUSPICIOUS_LOGIN' || log.action === 'FAILED_LOGIN'
                return (
                  <div key={log.id} style={{ marginBottom: '0.6rem', paddingBottom: '0.6rem', borderBottom: '1px dashed #27272a', background: isSuspicious ? 'rgba(239,68,68,0.1)' : 'transparent', padding: '0.4rem', borderRadius: '4px' }}>
                    <span style={{ color: '#3b82f6' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                    <span style={{ color: isSuspicious ? '#ef4444' : '#f59e0b', fontWeight: 'bold' }}>{log.action}</span>{' '}
                    <span style={{ color: '#a1a1aa' }}>— {log.userEmail}</span>
                    <div style={{ color: isSuspicious ? '#ef4444' : '#10b981', marginLeft: '0.5rem', marginTop: '0.15rem', fontSize: '0.75rem' }}>
                      ► {log.details}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* BOOKING REQUESTS */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e4e4e7', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarCheck size={18} color="#2563eb" /> Booking Requests
            </h3>
            <button onClick={() => navigate('/admin/manage')} className="btn" style={{ margin: 0, padding: '0.3rem 0.75rem', fontSize: '0.8rem', background: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              View All <ArrowRight size={14} />
            </button>
          </div>

          {pendingBookings.length === 0 ? (
            <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', textAlign: 'center', color: '#166534', fontSize: '0.9rem' }}>
              <CheckCircle size={20} style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ margin: 0 }}>All booking requests have been processed!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {pendingBookings.map(booking => (
                <div key={booking.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', borderLeft: '3px solid #eab308' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#18181b' }}>{booking.userEmail}</div>
                    <div style={{ fontSize: '0.75rem', color: '#71717a' }}>
                      {new Date(booking.startTime).toLocaleDateString()} • {booking.purpose}
                    </div>
                    {booking.aiRiskScore !== null && booking.aiRiskScore > 40 && (
                      <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700, marginTop: '0.15rem' }}>
                        🤖 AI Risk: {booking.aiRiskScore}%
                      </div>
                    )}
                  </div>
                  <span className="status-badge status-MAINTENANCE" style={{ fontSize: '0.75rem' }}>PENDING</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TICKET OVERVIEW — FULL WIDTH */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e4e4e7', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList size={18} color="#6366f1" /> Maintenance Tickets
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ background: '#e0e7ff', color: '#4338ca', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
              {openTickets.length} Open
            </div>
            <div style={{ background: '#fef3c7', color: '#92400e', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
              {inProgressTickets.length} In Progress
            </div>
            <button onClick={() => navigate('/all-tickets')} className="btn" style={{ margin: 0, padding: '0.3rem 0.75rem', fontSize: '0.8rem', background: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              Manage All <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {recentOpenTickets.length === 0 ? (
          <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', textAlign: 'center', color: '#166534', fontSize: '0.9rem' }}>
            <CheckCircle size={20} style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ margin: 0 }}>All tickets have been resolved! 🎉</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentOpenTickets.map(ticket => {
              const statusColor = { OPEN: '#3b82f6', IN_PROGRESS: '#f59e0b' }[ticket.status] || '#71717a'
              return (
                <div key={ticket.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.75rem', background: '#f8fafc', borderRadius: '8px',
                  borderLeft: `3px solid ${statusColor}`
                }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#18181b' }}>{ticket.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#71717a' }}>
                      {ticket.reporterName} • {ticket.location} • {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                    {ticket.mlSeverity && (ticket.mlSeverity === 'HIGH' || ticket.mlSeverity === 'CRITICAL') && (
                      <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700, marginTop: '0.15rem' }}>
                        🤖 AI Severity: {ticket.mlSeverity}
                      </div>
                    )}
                  </div>
                  <span style={{
                    background: statusColor, color: 'white',
                    padding: '0.2rem 0.6rem', borderRadius: '999px',
                    fontWeight: 700, fontSize: '0.7rem'
                  }}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
