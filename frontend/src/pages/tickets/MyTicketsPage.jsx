import { useState, useEffect } from 'react';
import { getMyTickets, addComment } from '../../services/ticketService';
import { MessageSquare, Clock, ChevronDown, ChevronUp, Send } from 'lucide-react';
import SlaTimer from './SlaTimer';

// Utility: map status to a badge color
const STATUS_COLORS = {
  OPEN: '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  RESOLVED: '#10b981',
  CLOSED: '#6b7280',
};

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const data = await getMyTickets();
      setTickets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  return (
    <div className="dashboard">
      <div className="header">
        <h1>My Tickets</h1>
        <p>Track any issues you have reported</p>
      </div>

      {loading ? (
        <p>Loading your tickets…</p>
      ) : tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#71717a' }}>
          <MessageSquare size={48} style={{ margin: '0 auto 1rem' }} />
          <h3>No tickets yet</h3>
          <p>Use the "Report Issue" link to submit your first ticket.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tickets.map((ticket) => (
            <div key={ticket.id} className="card" style={{ cursor: 'pointer' }}>
              {/* Ticket Header Row */}
              <div
                onClick={() => toggleExpand(ticket.id)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0' }}>{ticket.title}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#71717a' }}>
                    <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    {new Date(ticket.createdAt).toLocaleString()} · {ticket.location}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{
                    background: STATUS_COLORS[ticket.status],
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    letterSpacing: '0.05em',
                  }}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                  {expandedId === ticket.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {/* Expanded Detail Panel */}
              {expandedId === ticket.id && (
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid #f4f4f5', paddingTop: '1.5rem' }}>
                  <p style={{ marginBottom: '1rem' }}>{ticket.description}</p>

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
                          style={{ width: '150px', height: '110px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e4e4e7' }}
                        />
                      ))}
                    </div>
                  )}

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

                  {/* Add Comment Input */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <input
                      type="text"
                      placeholder="Add a comment..."
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
