import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket, fileToBase64 } from '../../services/ticketService';
import { AlertTriangle, ImagePlus, Send, Cpu, Zap, Wrench } from 'lucide-react';
import axios from 'axios';

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
  const [error, setError] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const imageBase64 = await Promise.all(imageFiles.map(fileToBase64));
      await createTicket({ ...formData, imageBase64 });
      navigate('/my-tickets');
    } catch (err) {
      setError('Failed to submit ticket. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const severityStyle = mlResult ? SEVERITY_COLORS[mlResult.severity] || SEVERITY_COLORS.MEDIUM : null;

  return (
    <div className="dashboard">
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <AlertTriangle size={32} color="#f97316" />
          <div>
            <h1>Report an Issue</h1>
            <p>Submit a maintenance or incident report</p>
          </div>
        </div>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Issue Title *</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange}
                placeholder="e.g. Broken projector in Lab A" required />
            </div>

            <div className="form-group">
              <label>Location *</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange}
                placeholder="e.g. Building C, Room 201" required />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Description *</label>
              <textarea name="description" value={formData.description} onChange={handleChange}
                placeholder="Describe the issue in detail..." required rows={5}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px',
                  border: '1px solid #d4d4d8', fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>
                <ImagePlus size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                Attach Images (max 3) — AI will analyze the damage automatically
              </label>
              <input type="file" accept="image/*" multiple onChange={handleImageChange}
                style={{ padding: '0.5rem 0' }} />

              {imagePreviews.length > 0 && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  {imagePreviews.map((src, i) => (
                    <img key={i} src={src} alt={`Preview ${i + 1}`}
                      style={{ width: '120px', height: '90px', objectFit: 'cover',
                        borderRadius: '8px', border: '2px solid #e4e4e7' }} />
                  ))}
                </div>
              )}

              {/* === AI ANALYSIS CARD === */}
              {mlAnalyzing && (
                <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', borderRadius: '10px',
                  background: '#f0f9ff', border: '1px solid #93c5fd',
                  display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Cpu size={20} color="#3b82f6" style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: '#1d4ed8', fontSize: '0.9rem' }}>AI is analyzing your image…</strong>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#60a5fa' }}>
                      Assessing damage category, severity, and routing to the right technician
                    </p>
                  </div>
                </div>
              )}

              {mlResult && !mlAnalyzing && (
                <div style={{ marginTop: '1rem', borderRadius: '10px', overflow: 'hidden',
                  border: `1px solid ${severityStyle.border}` }}>

                  {/* Header bar */}
                  <div style={{ background: severityStyle.text, padding: '0.6rem 1rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Cpu size={16} color="white" />
                    <strong style={{ color: 'white', fontSize: '0.85rem' }}>
                      🤖 AI Damage Assessment Complete
                    </strong>
                  </div>

                  {/* Body */}
                  <div style={{ background: severityStyle.bg, padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>

                      <div style={{ flex: 1, minWidth: '160px' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#71717a',
                          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                          Fault Category
                        </div>
                        <div style={{ fontWeight: '700', color: '#18181b', fontSize: '0.95rem' }}>
                          {(mlResult.faultCategory || 'OTHER').replace(/_/g, ' ')}
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#71717a',
                          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                          Severity
                        </div>
                        <span style={{ fontWeight: '800', color: severityStyle.text, fontSize: '0.95rem' }}>
                          {mlResult.severity}
                        </span>
                      </div>

                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#71717a',
                          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                          Priority
                        </div>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#18181b' }}>
                          {PRIORITY_LABELS[mlResult.priorityLevel] || `P${mlResult.priorityLevel}`}
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#71717a',
                          textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                          Routing To
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Wrench size={14} color={severityStyle.text} />
                          <span style={{ fontWeight: '700', color: '#18181b', fontSize: '0.9rem' }}>
                            {(mlResult.assignedTechnicianRole || 'GENERAL_MAINTENANCE').replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: `1px solid ${severityStyle.border}`, paddingTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#71717a',
                        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                        AI Assessment
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#3f3f46', lineHeight: 1.5 }}>
                        {mlResult.summary}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={18} />
            {loading ? 'Submitting…' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
