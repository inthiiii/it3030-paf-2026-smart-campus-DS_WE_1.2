import { useState, useEffect } from 'react';
import {
  getAllTickets,
  updateTicketStatus,
  addComment,
} from '../../services/ticketService';
import { Filter, MessageSquare, ArrowRight, Send, Clock } from 'lucide-react';
import SlaTimer from './SlaTimer';

const STATUS_COLORS = {
  OPEN: '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  RESOLVED: '#10b981',
  CLOSED: '#6b7280',
};

const ALL_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);

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
