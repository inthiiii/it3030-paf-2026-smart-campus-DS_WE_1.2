import { useState, useEffect } from 'react';
import {
  getAllTickets,
  updateTicketStatus,
  addComment,
} from '../../services/ticketService';
import { Filter, MessageSquare, ArrowRight, Send, Clock, ChevronDown, ChevronUp, Wrench, AlertTriangle, Clock4 } from 'lucide-react';
import SlaTimer from './SlaTimer';
import axios from 'axios';

const STATUS_COLORS = {
  OPEN: '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  RESOLVED: '#10b981',
  CLOSED: '#6b7280',
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

  // Resolution Steps state: { [ticketId]: { loading, data } }
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
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await updateTicketStatus(ticketId, newStatus);
      fetchTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
    setCommentText('');
    setShowStepsFor(null);
  };

  // Fetch resolution steps from Python AI (cached per session)
  const handleShowSteps = async (ticket) => {
    if (showStepsFor === ticket.id) { setShowStepsFor(null); return; }
    setShowStepsFor(ticket.id);
    if (resolutionSteps[ticket.id]?.data) return; // already cached
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
    }
  };

  const handleAddComment = async (ticketId) => {
    if (!commentText.trim()) return;
    setCommenting(true);
    try {
      await addComment(ticketId, commentText);
      setCommentText('');
      fetchTickets();
    } catch (err) {
      console.error(err);
    } finally {
      setCommenting(false);
    }
  };

  const visibleTickets =
    filterStatus === 'ALL'
      ? tickets
      : tickets.filter((t) => t.status === filterStatus);

  return (
    <div className="dashboard">
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Maintenance Tickets</h1>
          <p>Manage and resolve all reported incidents</p>
        </div>

        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['ALL', ...ALL_STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`btn ${filterStatus === s ? 'btn-primary' : ''}`}
              style={{
                width: 'auto',
                margin: 0,
                background: filterStatus !== s ? '#e4e4e7' : undefined,
                color: filterStatus !== s ? '#3f3f46' : undefined,
                fontSize: '0.85rem',
              }}
            >
              <Filter size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p>Loading tickets…</p>
      ) : visibleTickets.length === 0 ? (
        <p style={{ color: '#71717a', textAlign: 'center', padding: '2rem' }}>No tickets match this filter.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {visibleTickets.map((ticket) => (
            <div key={ticket.id} className="card">
              {/* Ticket Summary Row */}
              <div
                onClick={() => toggleExpand(ticket.id)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0' }}>{ticket.title}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#71717a' }}>
                    Reported by <strong>{ticket.reporterName}</strong> ({ticket.reporterEmail}) ·{' '}
                    <Clock size={13} style={{ verticalAlign: 'middle' }} />{' '}
                    {new Date(ticket.createdAt).toLocaleString()} · {ticket.location}
                  </p>
                </div>
                <span style={{
                  background: STATUS_COLORS[ticket.status],
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                }}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>

              {/* Expanded Detail Panel */}
              {expandedId === ticket.id && (
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid #f4f4f5', paddingTop: '1.5rem' }}>
                  <p style={{ marginBottom: '1.5rem' }}>{ticket.description}</p>

                  {/* ===== SLA TIMERS ===== */}
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    marginBottom: '1.5rem',
                  }}>
                    <SlaTimer
                      label="First Response"
                      createdAt={ticket.createdAt}
                      completedAt={ticket.firstResponseAt}
                      slaMinutes={ticket.slaResponseMinutes}
                      breached={ticket.slaResponseBreached}
                    />
                    <SlaTimer
                      label="Resolution"
                      createdAt={ticket.createdAt}
                      completedAt={ticket.resolvedAt}
                      slaMinutes={ticket.slaResolutionMinutes}
                      breached={ticket.slaResolutionBreached}
                    />
                  </div>

                  {/* ===== ML DAMAGE ASSESSMENT ===== */}
                  {ticket.mlFaultCategory && (() => {
                    const sev = ticket.mlSeverity || 'MEDIUM';
                    const sevStyle = SEVERITY_COLORS[sev] || SEVERITY_COLORS.MEDIUM;
                    const steps = resolutionSteps[ticket.id];
                    const stepsVisible = showStepsFor === ticket.id;
                    return (
                      <div style={{ marginBottom: '1.5rem', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${sevStyle.border}` }}>
                        {/* Assessment Header */}
                        <div style={{ background: sevStyle.text, padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: '700' }}>🤖 AI Damage Assessment</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleShowSteps(ticket); }}
                            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.5)', color: 'white', borderRadius: '6px', padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <Wrench size={14} />
                            {steps?.loading ? 'Loading…' : stepsVisible ? 'Hide Steps' : 'Show Resolution Steps'}
                            {!steps?.loading && (stepsVisible ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
                          </button>
                        </div>
                        {/* Assessment Body */}
                        <div style={{ background: sevStyle.bg, padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                            <div><div style={{ fontSize: '0.7rem', color: '#71717a', fontWeight: '700', textTransform: 'uppercase' }}>Category</div><strong>{(ticket.mlFaultCategory || '').replace(/_/g, ' ')}</strong></div>
                            <div><div style={{ fontSize: '0.7rem', color: '#71717a', fontWeight: '700', textTransform: 'uppercase' }}>Severity</div><strong style={{ color: sevStyle.text }}>{sev}</strong></div>
                            <div><div style={{ fontSize: '0.7rem', color: '#71717a', fontWeight: '700', textTransform: 'uppercase' }}>Priority</div><strong>P{ticket.mlPriorityLevel}</strong></div>
                            <div><div style={{ fontSize: '0.7rem', color: '#71717a', fontWeight: '700', textTransform: 'uppercase' }}>Route To</div><strong>{(ticket.mlAssignedTechnicianRole || '').replace(/_/g, ' ')}</strong></div>
                          </div>
                          {ticket.mlSummary && (
                            <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                              <div style={{ fontSize: '0.7rem', color: '#71717a', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.25rem' }}>AI Summary</div>
                              <p style={{ margin: 0, fontSize: '0.875rem', color: '#3f3f46' }}>{ticket.mlSummary}</p>
                            </div>
                          )}
                        </div>

                        {/* ===== RESOLUTION STEPS PANEL ===== */}
                        {stepsVisible && (
                          <div style={{ borderTop: `2px solid ${sevStyle.border}`, background: '#fafafa', padding: '1.25rem 1.5rem' }}>
                            {steps?.loading && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#6366f1' }}>
                                <Wrench size={18} />
                                <span style={{ fontWeight: '600' }}>AI is generating resolution steps…</span>
                              </div>
                            )}
                            {!steps?.loading && steps?.data && (
                              <>
                                {/* Meta Info */}
                                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: '#52525b' }}>
                                    <Clock4 size={15} color="#6366f1" />
                                    <strong>Est. Time:</strong> {steps.data.estimatedTime}
                                  </div>
                                  {steps.data.toolsRequired?.length > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: '#52525b', flexWrap: 'wrap' }}>
                                      <Wrench size={15} color="#6366f1" />
                                      <strong>Tools:</strong>
                                      {steps.data.toolsRequired.map((t, i) => (
                                        <span key={i} style={{ background: '#e0e7ff', color: '#4338ca', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>{t}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {/* Safety Notes */}
                                {steps.data.safetyNotes && (
                                  <div style={{ display: 'flex', gap: '0.6rem', background: '#fffbeb', border: '1px solid #f59e0b40', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
                                    <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '1px' }} />
                                    <div>
                                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Safety Notes</div>
                                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#78350f' }}>{steps.data.safetyNotes}</p>
                                    </div>
                                  </div>
                                )}
                                {/* Steps List */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                  {steps.data.steps.map((step, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '1rem', background: 'white', borderRadius: '8px', padding: '1rem', border: '1px solid #e4e4e7', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.9rem', flexShrink: 0 }}>
                                        {step.stepNumber || i + 1}
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '700', color: '#18181b', marginBottom: '0.3rem', fontSize: '0.95rem' }}>{step.title}</div>
                                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#52525b', lineHeight: 1.6 }}>{step.details}</p>
                                        {step.warning && (
                                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginTop: '0.5rem', padding: '0.4rem 0.75rem', background: '#fef2f2', borderRadius: '6px', border: '1px solid #ef444430' }}>
                                            <AlertTriangle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                                            <span style={{ fontSize: '0.8rem', color: '#b91c1c' }}>{step.warning}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                            {!steps?.loading && !steps?.data && (
                              <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>Could not load resolution steps. Check that the AI service is running.</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Image Attachments */}
                  {ticket.imageBase64 && ticket.imageBase64.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                      {ticket.imageBase64.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt={`Attachment ${i + 1}`}
                          style={{ width: '160px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e4e4e7' }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Status Changer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', background: '#f9f9f9', padding: '1rem', borderRadius: '8px' }}>
                    <ArrowRight size={18} color="#6366f1" />
                    <strong>Change Status:</strong>
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                      style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #d4d4d8', fontWeight: '600', cursor: 'pointer' }}
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>

                  {/* Comment Thread */}
                  <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MessageSquare size={18} /> Comments ({ticket.comments.length})
                  </h4>
                  {ticket.comments.length === 0 && (
                    <p style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>No comments yet.</p>
                  )}
                  {ticket.comments.map((c, i) => (
                    <div key={i} style={{
                      background: '#f9f9f9',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      marginBottom: '0.75rem',
                      borderLeft: `4px solid ${c.authorRole === 'USER' ? '#6366f1' : '#f59e0b'}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <strong style={{ fontSize: '0.9rem' }}>{c.authorName}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                          {c.authorRole} · {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.95rem' }}>{c.body}</p>
                    </div>
                  ))}

                  {/* Add Staff Comment */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <input
                      type="text"
                      placeholder="Add a staff comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment(ticket.id)}
                      style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', border: '1px solid #d4d4d8', fontSize: '0.95rem' }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={() => handleAddComment(ticket.id)}
                      disabled={commenting}
                      style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}
                    >
                      <Send size={16} /> Post
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
