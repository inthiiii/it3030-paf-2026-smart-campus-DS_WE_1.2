import { useState, useEffect } from 'react';
import {
  getAllTickets,
  updateTicketStatus,
  addComment,
  deleteTicket,
} from '../../services/ticketService';
import { Filter, MessageSquare, ArrowRight, Send, Clock, ChevronDown, ChevronUp, Wrench, AlertTriangle, Clock4, MapPin, User, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import SlaTimer from './SlaTimer';
import Toast from '../../components/Toast';
import axios from 'axios';

const STATUS_CONFIG = {
  OPEN: { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', label: 'Open' },
  IN_PROGRESS: { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'In Progress' },
  RESOLVED: { color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', label: 'Resolved' },
  CLOSED: { color: '#71717a', bg: '#f4f4f5', border: '#e4e4e7', label: 'Closed' },
};

const SEVERITY_COLORS = {
  LOW:      { bg: '#ecfdf5', text: '#10b981', border: '#10b98130' },
  MEDIUM:   { bg: '#fffbeb', text: '#f59e0b', border: '#f59e0b30' },
  HIGH:     { bg: '#fff7ed', text: '#f97316', border: '#f9731630' },
  CRITICAL: { bg: '#fef2f2', text: '#ef4444', border: '#ef444430' },
};

const ALL_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [toast, setToast] = useState(null);

  // Resolution Steps state
  const [resolutionSteps, setResolutionSteps] = useState({});
  const [showStepsFor, setShowStepsFor] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const data = await getAllTickets();
      setTickets(data);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to load tickets.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await updateTicketStatus(ticketId, newStatus);
      fetchTickets();
      setToast({ message: `Status updated to ${newStatus.replace('_', ' ')}`, type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to update status.', type: 'error' });
    }
  };

  const handleDeleteTicket = async (ticketId, ticketTitle) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${ticketTitle}"? This cannot be undone.`)) return;
    try {
      await deleteTicket(ticketId);
      fetchTickets();
      setToast({ message: 'Ticket deleted successfully.', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to delete ticket. Only admins can delete tickets.', type: 'error' });
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
    setCommentText('');
    setShowStepsFor(null);
  };

  const handleShowSteps = async (ticket) => {
    if (showStepsFor === ticket.id) { setShowStepsFor(null); return; }
    setShowStepsFor(ticket.id);
    if (resolutionSteps[ticket.id]?.data) return;
    setResolutionSteps(prev => ({ ...prev, [ticket.id]: { loading: true, data: null } }));
    try {
      const res = await axios.post('http://localhost:8000/api/resolution-steps', {
        faultCategory: ticket.mlFaultCategory || 'OTHER',
        severity: ticket.mlSeverity || 'MEDIUM',
        title: ticket.title,
        description: ticket.description,
        location: ticket.location,
        assignedTechnicianRole: ticket.mlAssignedTechnicianRole || 'GENERAL_MAINTENANCE',
      });
      setResolutionSteps(prev => ({ ...prev, [ticket.id]: { loading: false, data: res.data.resolution } }));
    } catch (err) {
      console.error(err);
      setResolutionSteps(prev => ({ ...prev, [ticket.id]: { loading: false, data: null } }));
      setToast({ message: 'Could not load resolution steps.', type: 'warning' });
    }
  };

  const handleAddComment = async (ticketId) => {
    if (!commentText.trim()) return;
    setCommenting(true);
    try {
      await addComment(ticketId, commentText);
      setCommentText('');
      fetchTickets();
      setToast({ message: 'Comment posted!', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to post comment.', type: 'error' });
    } finally {
      setCommenting(false);
    }
  };

  const visibleTickets =
    filterStatus === 'ALL'
      ? tickets
      : tickets.filter((t) => t.status === filterStatus);

  // Counts
  const counts = {
    ALL: tickets.length,
    OPEN: tickets.filter(t => t.status === 'OPEN').length,
    IN_PROGRESS: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    RESOLVED: tickets.filter(t => t.status === 'RESOLVED').length,
    CLOSED: tickets.filter(t => t.status === 'CLOSED').length,
  };

  if (loading) return (
    <div className="dashboard" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
      <div style={{ fontSize: '2rem', animation: 'pulse-green 2s infinite' }}>🔧</div>
      <h3 style={{ color: '#71717a', marginTop: '1rem' }}>Loading tickets...</h3>
    </div>
  );

  return (
    <div className="dashboard">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* PAGE HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #18181b 0%, #27272a 40%, #4c1d95 100%)',
        borderRadius: '16px', padding: '2rem 2.5rem', color: 'white', marginBottom: '1.5rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          top: '-100px', right: '-50px'
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Wrench size={16} />
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#c4b5fd' }}>Maintenance Management</span>
          </div>
          <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.75rem', fontWeight: 800 }}>Manage Tickets</h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.92rem' }}>Triage, diagnose, and resolve all reported incidents</p>
        </div>
      </div>

      {/* FILTER PILLS */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['ALL', ...ALL_STATUSES].map((s) => {
          const isActive = filterStatus === s;
          const conf = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: '0.4rem 0.85rem', borderRadius: '99px', border: 'none',
                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                background: isActive ? (conf ? conf.color : '#18181b') : '#f4f4f5',
                color: isActive ? 'white' : '#52525b',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '0.35rem'
              }}
            >
              {s === 'ALL' ? 'All' : conf.label}
              <span style={{
                fontSize: '0.7rem', fontWeight: 700,
                background: isActive ? 'rgba(255,255,255,0.2)' : '#e4e4e7',
                padding: '0.05rem 0.35rem', borderRadius: '99px',
                color: isActive ? 'white' : '#71717a'
              }}>
                {counts[s]}
              </span>
            </button>
          );
        })}
      </div>

      {/* TICKETS LIST */}
      {visibleTickets.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem', background: 'white',
          borderRadius: '16px', border: '1px dashed #d4d4d8'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px', background: '#f4f4f5',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem'
          }}>
            <CheckCircle size={28} color="#22c55e" />
          </div>
          <h3 style={{ margin: '0 0 0.5rem', color: '#3f3f46' }}>No Tickets Match</h3>
          <p style={{ color: '#71717a', fontSize: '0.92rem', margin: 0 }}>No tickets in this filter. Try selecting a different status.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {visibleTickets.map((ticket) => {
            const sc = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
            const isExpanded = expandedId === ticket.id;
            const sev = ticket.mlSeverity || 'MEDIUM';
            const sevStyle = SEVERITY_COLORS[sev] || SEVERITY_COLORS.MEDIUM;
            const steps = resolutionSteps[ticket.id];
            const stepsVisible = showStepsFor === ticket.id;

            return (
              <div key={ticket.id} style={{
                background: 'white', borderRadius: '14px',
                border: `1px solid ${sc.border}`, overflow: 'hidden',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                transition: 'box-shadow 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)'}
              >
                <div style={{ display: 'flex' }}>
                  {/* Status Strip */}
                  <div style={{ width: '4px', background: sc.color, flexShrink: 0 }} />

                  {/* Summary Row */}
                  <div
                    onClick={() => toggleExpand(ticket.id)}
                    style={{
                      flex: 1, padding: '1.15rem 1.25rem', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#18181b' }}>{ticket.title}</h3>
                        {ticket.mlPriorityLevel && (
                          <span style={{
                            fontSize: '0.68rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px',
                            background: ticket.mlPriorityLevel <= 2 ? '#fef2f2' : '#f4f4f5',
                            color: ticket.mlPriorityLevel <= 2 ? '#ef4444' : '#71717a'
                          }}>P{ticket.mlPriorityLevel}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', color: '#71717a', fontSize: '0.82rem', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <User size={12} color="#8b5cf6" /> {ticket.reporterName}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Clock size={12} color="#3b82f6" /> {new Date(ticket.createdAt).toLocaleString()}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <MapPin size={12} color="#f59e0b" /> {ticket.location}
                        </span>
                        {ticket.comments.length > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <MessageSquare size={12} color="#6366f1" /> {ticket.comments.length}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <span style={{
                        padding: '0.2rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem',
                        fontWeight: 700, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`
                      }}>{sc.label}</span>
                      {isExpanded ? <ChevronUp size={18} color="#a1a1aa" /> : <ChevronDown size={18} color="#a1a1aa" />}
                    </div>
                  </div>
                </div>

                {/* EXPANDED DETAIL */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #f4f4f5', padding: '1.25rem 1.5rem', background: '#fafafa' }}>
                    <p style={{ margin: '0 0 1.25rem', color: '#3f3f46', fontSize: '0.92rem', lineHeight: 1.6 }}>{ticket.description}</p>

                    {/* SLA Timers */}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                      <SlaTimer label="First Response" createdAt={ticket.createdAt} completedAt={ticket.firstResponseAt} slaMinutes={ticket.slaResponseMinutes} breached={ticket.slaResponseBreached} />
                      <SlaTimer label="Resolution" createdAt={ticket.createdAt} completedAt={ticket.resolvedAt} slaMinutes={ticket.slaResolutionMinutes} breached={ticket.slaResolutionBreached} />
                    </div>

                    {/* ML Assessment */}
                    {ticket.mlFaultCategory && (
                      <div style={{ marginBottom: '1.25rem', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${sevStyle.border}` }}>
                        <div style={{
                          background: sevStyle.text, padding: '0.6rem 1rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                          <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            🤖 AI Damage Assessment
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleShowSteps(ticket); }}
                            style={{
                              background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
                              color: 'white', borderRadius: '8px', padding: '0.3rem 0.75rem',
                              cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
                              display: 'flex', alignItems: 'center', gap: '0.3rem'
                            }}
                          >
                            <Wrench size={13} />
                            {steps?.loading ? 'Loading…' : stepsVisible ? 'Hide Steps' : 'Resolution Steps'}
                            {!steps?.loading && (stepsVisible ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                          </button>
                        </div>

                        <div style={{ background: sevStyle.bg, padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                            {[
                              { label: 'Category', value: (ticket.mlFaultCategory || '').replace(/_/g, ' ') },
                              { label: 'Severity', value: sev, color: sevStyle.text },
                              { label: 'Priority', value: `P${ticket.mlPriorityLevel}` },
                              { label: 'Route To', value: (ticket.mlAssignedTechnicianRole || '').replace(/_/g, ' ') },
                            ].map(({ label, value, color }, i) => (
                              <div key={i}>
                                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', marginBottom: '0.15rem' }}>{label}</div>
                                <strong style={{ fontSize: '0.88rem', color: color || '#18181b' }}>{value}</strong>
                              </div>
                            ))}
                          </div>
                          {ticket.mlSummary && (
                            <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '0.6rem', marginTop: '0.6rem' }}>
                              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', marginBottom: '0.2rem' }}>AI Summary</div>
                              <p style={{ margin: 0, fontSize: '0.85rem', color: '#3f3f46', lineHeight: 1.5 }}>{ticket.mlSummary}</p>
                            </div>
                          )}
                        </div>

                        {/* Resolution Steps Panel */}
                        {stepsVisible && (
                          <div style={{ borderTop: `2px solid ${sevStyle.border}`, background: 'white', padding: '1.25rem 1.5rem' }}>
                            {steps?.loading && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#6366f1' }}>
                                <Wrench size={18} />
                                <span style={{ fontWeight: 600 }}>AI is generating resolution steps…</span>
                              </div>
                            )}
                            {!steps?.loading && steps?.data && (
                              <>
                                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#52525b' }}>
                                    <Clock4 size={15} color="#6366f1" />
                                    <strong>Est. Time:</strong> {steps.data.estimatedTime}
                                  </div>
                                  {steps.data.toolsRequired?.length > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#52525b', flexWrap: 'wrap' }}>
                                      <Wrench size={15} color="#6366f1" />
                                      <strong>Tools:</strong>
                                      {steps.data.toolsRequired.map((t, i) => (
                                        <span key={i} style={{ background: '#e0e7ff', color: '#4338ca', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600 }}>{t}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {steps.data.safetyNotes && (
                                  <div style={{ display: 'flex', gap: '0.6rem', background: '#fffbeb', border: '1px solid #f59e0b40', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                                    <AlertTriangle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '1px' }} />
                                    <div>
                                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Safety Notes</div>
                                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#78350f' }}>{steps.data.safetyNotes}</p>
                                    </div>
                                  </div>
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                  {steps.data.steps.map((step, i) => (
                                    <div key={i} style={{
                                      display: 'flex', gap: '0.85rem', background: '#f8fafc',
                                      borderRadius: '10px', padding: '1rem', border: '1px solid #e4e4e7'
                                    }}>
                                      <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        background: '#6366f1', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 800, fontSize: '0.85rem', flexShrink: 0
                                      }}>{step.stepNumber || i + 1}</div>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, color: '#18181b', marginBottom: '0.25rem', fontSize: '0.92rem' }}>{step.title}</div>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#52525b', lineHeight: 1.6 }}>{step.details}</p>
                                        {step.warning && (
                                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem', marginTop: '0.5rem', padding: '0.35rem 0.6rem', background: '#fef2f2', borderRadius: '6px', border: '1px solid #ef444420' }}>
                                            <AlertTriangle size={13} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                                            <span style={{ fontSize: '0.78rem', color: '#b91c1c' }}>{step.warning}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                            {!steps?.loading && !steps?.data && (
                              <p style={{ color: '#ef4444', fontSize: '0.88rem', margin: 0 }}>Could not load resolution steps. Check that the AI service is running.</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Image Attachments */}
                    {ticket.imageBase64 && ticket.imageBase64.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                        {ticket.imageBase64.map((src, i) => (
                          <img key={i} src={src} alt={`Attachment ${i + 1}`}
                            style={{ width: '140px', height: '100px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #e4e4e7' }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Status Changer */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem',
                      background: 'white', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e4e4e7'
                    }}>
                      <ArrowRight size={16} color="#6366f1" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3f3f46' }}>Change Status:</span>
                      <select
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                        style={{
                          padding: '0.45rem 0.85rem', borderRadius: '8px', border: '1px solid #e4e4e7',
                          fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', background: '#fafafa',
                          color: '#18181b'
                        }}
                      >
                        {ALL_STATUSES.map((s) => (
                          <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                      </select>

                      <div style={{ marginLeft: 'auto' }}>
                        <button
                          onClick={() => handleDeleteTicket(ticket.id, ticket.title)}
                          style={{
                            padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #fecaca',
                            background: 'transparent', color: '#ef4444', fontSize: '0.82rem',
                            fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>

                    {/* Comment Thread */}
                    <div style={{ marginBottom: '0.75rem' }}>
                      <h4 style={{
                        margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#3f3f46'
                      }}>
                        <MessageSquare size={16} color="#6366f1" /> Comments ({ticket.comments.length})
                      </h4>

                      {ticket.comments.length === 0 && (
                        <p style={{ color: '#a1a1aa', fontSize: '0.88rem', margin: '0 0 0.5rem' }}>No comments yet.</p>
                      )}

                      {ticket.comments.map((c, i) => (
                        <div key={i} style={{
                          background: 'white', borderRadius: '10px', padding: '0.75rem 1rem',
                          marginBottom: '0.5rem',
                          border: '1px solid #e4e4e7', borderLeftWidth: '3px',
                          borderLeftColor: c.authorRole === 'USER' ? '#6366f1' : c.authorRole === 'TECHNICIAN' ? '#f59e0b' : '#22c55e',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                            <strong style={{ fontSize: '0.85rem', color: '#18181b' }}>{c.authorName}</strong>
                            <span style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>
                              {c.authorRole} · {new Date(c.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.9rem', color: '#3f3f46' }}>{c.body}</p>
                        </div>
                      ))}
                    </div>

                    {/* Add Staff Comment */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Add a staff comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(ticket.id)}
                        style={{
                          flex: 1, padding: '0.65rem 0.85rem', borderRadius: '10px',
                          border: '1px solid #e4e4e7', fontSize: '0.9rem', background: 'white', color: '#18181b',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        onClick={() => handleAddComment(ticket.id)}
                        disabled={commenting}
                        style={{
                          padding: '0.6rem 1rem', borderRadius: '10px', border: 'none',
                          background: '#18181b', color: 'white', fontSize: '0.85rem',
                          fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem',
                          opacity: commenting ? 0.6 : 1
                        }}
                      >
                        <Send size={14} /> Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
