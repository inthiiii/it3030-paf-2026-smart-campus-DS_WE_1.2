import { useState, useEffect } from 'react';
import { getMyTickets, addComment } from '../../services/ticketService';
import { MessageSquare, Clock, ChevronDown, ChevronUp, Send, MapPin, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import SlaTimer from './SlaTimer';
import Toast from '../../components/Toast';

const STATUS_CONFIG = {
  OPEN: { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', label: 'Open' },
  IN_PROGRESS: { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'In Progress' },
  RESOLVED: { color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0', label: 'Resolved' },
  CLOSED: { color: '#71717a', bg: '#f4f4f5', border: '#e4e4e7', label: 'Closed' },
};

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const data = await getMyTickets();
      setTickets(data);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to load tickets.', type: 'error' });
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
      setToast({ message: 'Comment posted successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to post comment.', type: 'error' });
    } finally {
      setCommenting(false);
    }
  };

  // Counts
  const openCount = tickets.filter(t => t.status === 'OPEN').length;
  const inProgCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <div style={{ fontSize: '2rem', animation: 'pulse-green 2s infinite' }}>🔧</div>
      <h3 style={{ color: '#71717a', marginTop: '1rem' }}>Loading your tickets...</h3>
    </div>
  );

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Open', count: openCount, icon: AlertTriangle, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'In Progress', count: inProgCount, icon: Clock, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Resolved', count: resolvedCount, icon: CheckCircle, color: '#22c55e', bg: '#f0fdf4' },
        ].map(({ label, count, icon: Icon, color, bg }, i) => (
          <div key={i} style={{
            background: 'white', borderRadius: '12px', padding: '1rem 1.25rem',
            border: '1px solid #e4e4e7', display: 'flex', alignItems: 'center', gap: '0.75rem'
          }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#18181b' }}>{count}</div>
              <div style={{ fontSize: '0.78rem', color: '#71717a', fontWeight: 600 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {tickets.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem', background: 'white',
          borderRadius: '16px', border: '1px dashed #d4d4d8'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px', background: '#f4f4f5',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem'
          }}>
            <MessageSquare size={28} color="#a1a1aa" />
          </div>
          <h3 style={{ margin: '0 0 0.5rem', color: '#3f3f46' }}>No Tickets Yet</h3>
          <p style={{ color: '#71717a', fontSize: '0.92rem', margin: 0 }}>
            Switch to "Raise a Ticket" to submit your first maintenance report.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {tickets.map((ticket) => {
            const sc = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.OPEN;
            const isExpanded = expandedId === ticket.id;
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

                  {/* Ticket Summary */}
                  <div
                    onClick={() => toggleExpand(ticket.id)}
                    style={{
                      flex: 1, padding: '1.15rem 1.25rem', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ margin: '0 0 0.3rem', fontSize: '1rem', fontWeight: 700, color: '#18181b' }}>{ticket.title}</h3>
                      <div style={{ display: 'flex', gap: '1rem', color: '#71717a', fontSize: '0.82rem', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={13} color="#8b5cf6" /> {new Date(ticket.createdAt).toLocaleString()}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin size={13} color="#f59e0b" /> {ticket.location}
                        </span>
                        {ticket.comments.length > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <MessageSquare size={13} color="#3b82f6" /> {ticket.comments.length}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                      <span style={{
                        padding: '0.2rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem',
                        fontWeight: 700, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`
                      }}>
                        {sc.label}
                      </span>
                      {isExpanded ? <ChevronUp size={18} color="#a1a1aa" /> : <ChevronDown size={18} color="#a1a1aa" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #f4f4f5', padding: '1.25rem 1.5rem', background: '#fafafa' }}>
                    <p style={{ margin: '0 0 1.25rem', color: '#3f3f46', fontSize: '0.92rem', lineHeight: 1.6 }}>{ticket.description}</p>

                    {/* SLA Timers */}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                      <SlaTimer label="First Response" createdAt={ticket.createdAt} completedAt={ticket.firstResponseAt} slaMinutes={ticket.slaResponseMinutes} breached={ticket.slaResponseBreached} />
                      <SlaTimer label="Resolution" createdAt={ticket.createdAt} completedAt={ticket.resolvedAt} slaMinutes={ticket.slaResolutionMinutes} breached={ticket.slaResolutionBreached} />
                    </div>

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

                    {/* Comment Thread */}
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{
                        margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#3f3f46'
                      }}>
                        <MessageSquare size={16} color="#6366f1" /> Comments ({ticket.comments.length})
                      </h4>

                      {ticket.comments.length === 0 && (
                        <p style={{ color: '#a1a1aa', fontSize: '0.88rem', margin: 0 }}>No comments yet. Start the conversation below.</p>
                      )}

                      {ticket.comments.map((c, i) => (
                        <div key={i} style={{
                          background: 'white', borderRadius: '10px', padding: '0.75rem 1rem',
                          marginBottom: '0.5rem', borderLeft: `3px solid ${c.authorRole === 'USER' ? '#6366f1' : c.authorRole === 'TECHNICIAN' ? '#f59e0b' : '#22c55e'}`,
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

                    {/* Add Comment */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Write a comment..."
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
