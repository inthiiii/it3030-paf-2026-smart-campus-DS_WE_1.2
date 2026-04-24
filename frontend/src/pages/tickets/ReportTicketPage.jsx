import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket, fileToBase64 } from '../../services/ticketService';
import { AlertTriangle, ImagePlus, Send, Cpu, Zap, Wrench, MapPin, FileText, X } from 'lucide-react';
import axios from 'axios';
import Toast from '../../components/Toast';

const SEVERITY_COLORS = {
  LOW: { bg: '#ecfdf5', text: '#10b981', border: '#10b98130' },
  MEDIUM: { bg: '#fffbeb', text: '#f59e0b', border: '#f59e0b30' },
  HIGH: { bg: '#fff7ed', text: '#f97316', border: '#f9731630' },
  CRITICAL: { bg: '#fef2f2', text: '#ef4444', border: '#ef444430' },
};

const PRIORITY_LABELS = {
  1: '🔴 P1 – Critical',
  2: '🟠 P2 – High',
  3: '🟡 P3 – Medium',
  4: '🟢 P4 – Low',
};

export default function ReportTicketPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', description: '', location: '' });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // ML Assessment state
  const [mlAnalyzing, setMlAnalyzing] = useState(false);
  const [mlResult, setMlResult] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    setImageFiles(files);
    const previews = await Promise.all(files.map(fileToBase64));
    setImagePreviews(previews);

    // Trigger AI analysis on the first image immediately
    if (files.length > 0) {
      setMlResult(null);
      setMlAnalyzing(true);
      try {
        const firstBase64 = previews[0];
        const res = await axios.post('http://localhost:8000/api/analyze-damage', {
          imageBase64: firstBase64,
          title: formData.title,
          description: formData.description,
        });
        setMlResult(res.data.assessment);
      } catch (err) {
        console.error('AI analysis failed:', err);
        setMlResult(null);
      } finally {
        setMlAnalyzing(false);
      }
    }
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    if (index === 0) setMlResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    try {
      const imageBase64 = await Promise.all(imageFiles.map(fileToBase64));
      await createTicket({ ...formData, imageBase64 });
      setToast({ message: 'Ticket submitted successfully! Redirecting...', type: 'success' });
      setTimeout(() => navigate('/tickets'), 1500);
    } catch (err) {
      setToast({ message: 'Failed to submit ticket. Please try again.', type: 'error' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const severityStyle = mlResult ? SEVERITY_COLORS[mlResult.severity] || SEVERITY_COLORS.MEDIUM : null;

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem' }}>
        {/* LEFT — Form */}
        <div style={{
          background: 'white', borderRadius: '16px', border: '1px solid #e4e4e7',
          overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          {/* Form Header */}
          <div style={{
            background: '#09090b', padding: '1.5rem', color: 'white'
          }}>
            <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', fontWeight: 700 }}>Report an Issue</h3>
            <p style={{ margin: 0, color: '#71717a', fontSize: '0.82rem' }}>
              Describe the problem and our AI will assess the severity automatically
            </p>
          </div>

          {/* Form Body */}
          <div style={{ padding: '1.5rem' }}>
            <form onSubmit={handleSubmit}>
              {/* Title */}
              <div style={{ marginBottom: '1.15rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: '#3f3f46', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  <FileText size={13} /> Issue Title
                </label>
                <input type="text" name="title" value={formData.title} onChange={handleChange}
                  placeholder="e.g., Broken projector in Lab A" required
                  style={{
                    width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px',
                    border: '1px solid #e4e4e7', fontSize: '0.92rem', background: '#fafafa', color: '#18181b',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Location */}
              <div style={{ marginBottom: '1.15rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: '#3f3f46', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  <MapPin size={13} /> Location
                </label>
                <input type="text" name="location" value={formData.location} onChange={handleChange}
                  placeholder="e.g., Building C, Room 201" required
                  style={{
                    width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px',
                    border: '1px solid #e4e4e7', fontSize: '0.92rem', background: '#fafafa', color: '#18181b',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1.15rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: '#3f3f46', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  <AlertTriangle size={13} /> Description
                </label>
                <textarea name="description" value={formData.description} onChange={handleChange}
                  placeholder="Describe the issue in detail..." required rows={5}
                  style={{
                    width: '100%', padding: '0.7rem 0.85rem', borderRadius: '10px',
                    border: '1px solid #e4e4e7', fontSize: '0.92rem', background: '#fafafa', color: '#18181b',
                    fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Image Upload */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: '#3f3f46', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  <ImagePlus size={13} /> Attach Images (max 3)
                </label>
                <p style={{ fontSize: '0.78rem', color: '#a1a1aa', margin: '0 0 0.5rem' }}>
                  AI will automatically analyze uploaded images for damage assessment
                </p>

                <div style={{
                  border: '2px dashed #e4e4e7', borderRadius: '12px', padding: '1.5rem',
                  textAlign: 'center', cursor: 'pointer', background: '#fafafa',
                  transition: 'border-color 0.2s', position: 'relative'
                }}
                  onClick={() => document.getElementById('ticket-image-input').click()}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#a1a1aa'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e4e4e7'}
                >
                  <input id="ticket-image-input" type="file" accept="image/*" multiple onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <ImagePlus size={28} color="#a1a1aa" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                  <p style={{ fontSize: '0.85rem', color: '#71717a', margin: 0 }}>
                    Click to upload or drag & drop
                  </p>
                </div>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    {imagePreviews.map((src, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img src={src} alt={`Preview ${i + 1}`}
                          style={{ width: '100px', height: '75px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e4e4e7' }}
                        />
                        <button onClick={() => removeImage(i)} style={{
                          position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px',
                          borderRadius: '50%', background: '#ef4444', border: 'none', color: 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                          fontSize: '0.7rem', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '0.8rem', fontSize: '0.95rem', fontWeight: 700,
                background: 'linear-gradient(135deg, #18181b, #27272a)', color: 'white',
                border: 'none', borderRadius: '12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                opacity: loading ? 0.6 : 1, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'opacity 0.2s'
              }}>
                <Send size={17} />
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT — AI Analysis Panel */}
        <div style={{ height: 'fit-content' }}>
          {/* AI Analysis Card */}
          <div style={{
            background: 'white', borderRadius: '16px', border: '1px solid #e4e4e7',
            overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #4c1d95, #6d28d9)', padding: '1.25rem', color: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cpu size={18} />
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>AI Damage Assessment</h3>
              </div>
              <p style={{ margin: '0.25rem 0 0', color: '#c4b5fd', fontSize: '0.78rem' }}>
                Upload an image to trigger automatic analysis
              </p>
            </div>

            <div style={{ padding: '1.25rem' }}>
              {/* No analysis yet */}
              {!mlAnalyzing && !mlResult && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#a1a1aa' }}>
                  <Cpu size={36} color="#d4d4d8" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
                  <p style={{ fontSize: '0.85rem', margin: '0 0 0.25rem', color: '#71717a' }}>No analysis yet</p>
                  <p style={{ fontSize: '0.78rem', margin: 0, color: '#a1a1aa' }}>Upload an image to see AI results</p>
                </div>
              )}

              {/* Analyzing... */}
              {mlAnalyzing && (
                <div style={{
                  padding: '1.5rem', textAlign: 'center', borderRadius: '10px',
                  background: '#f0f9ff', border: '1px solid #93c5fd'
                }}>
                  <div style={{ fontSize: '1.5rem', animation: 'pulse-green 1.5s infinite', marginBottom: '0.5rem' }}>🤖</div>
                  <p style={{ margin: '0 0 0.25rem', fontWeight: 700, color: '#1d4ed8', fontSize: '0.9rem' }}>Analyzing Image...</p>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#60a5fa' }}>Assessing damage, category & routing</p>
                </div>
              )}

              {/* Results */}
              {mlResult && !mlAnalyzing && (
                <div>
                  {/* Severity Badge */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    padding: '0.6rem', borderRadius: '10px', marginBottom: '1rem',
                    background: severityStyle.bg, border: `1px solid ${severityStyle.border}`
                  }}>
                    <Zap size={16} color={severityStyle.text} />
                    <span style={{ fontWeight: 800, color: severityStyle.text, fontSize: '0.9rem' }}>
                      {mlResult.severity} Severity
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      { label: 'Fault Category', value: (mlResult.faultCategory || 'OTHER').replace(/_/g, ' ') },
                      { label: 'Priority', value: PRIORITY_LABELS[mlResult.priorityLevel] || `P${mlResult.priorityLevel}` },
                      { label: 'Route To', value: (mlResult.assignedTechnicianRole || 'GENERAL').replace(/_/g, ' '), icon: Wrench },
                    ].map(({ label, value, icon: Icon }, i) => (
                      <div key={i} style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.2rem' }}>
                          {label}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#18181b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          {Icon && <Icon size={13} color={severityStyle.text} />}
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* AI Summary */}
                  {mlResult.summary && (
                    <div style={{
                      marginTop: '0.75rem', padding: '0.75rem 0.85rem', borderRadius: '8px',
                      background: '#f4f4f5', borderLeft: `3px solid ${severityStyle.text}`
                    }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.25rem' }}>
                        AI Assessment
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#3f3f46', lineHeight: 1.5 }}>
                        {mlResult.summary}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tips Card */}
          <div style={{
            marginTop: '1rem', background: '#eff6ff', borderRadius: '12px',
            padding: '1rem', border: '1px solid #bfdbfe', fontSize: '0.82rem'
          }}>
            <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <AlertTriangle size={14} /> Tips for Better Reports
            </div>
            <ul style={{ margin: 0, paddingLeft: '1rem', color: '#1d4ed8', lineHeight: 1.8 }}>
              <li>Include clear, well-lit photos</li>
              <li>Be specific about the room/location</li>
              <li>Describe what's broken in detail</li>
              <li>Mention any safety concerns</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
