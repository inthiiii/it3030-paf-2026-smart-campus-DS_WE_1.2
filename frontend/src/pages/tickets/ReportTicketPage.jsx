import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket, fileToBase64 } from '../../services/ticketService';
import { AlertTriangle, ImagePlus, Send } from 'lucide-react';

export default function ReportTicketPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
  });
  const [imageFiles, setImageFiles] = useState([]); // max 3
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    setImageFiles(files);
    const previews = await Promise.all(files.map(fileToBase64));
    setImagePreviews(previews);
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
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Broken projector in Lab A"
                required
              />
            </div>

            <div className="form-group">
              <label>Location *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Building C, Room 201"
                required
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the issue in detail..."
                required
                rows={5}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #d4d4d8',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>
                <ImagePlus size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                Attach Images (max 3)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                style={{ padding: '0.5rem 0' }}
              />
              {imagePreviews.length > 0 && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  {imagePreviews.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`Preview ${i + 1}`}
                      style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e4e4e7' }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && (
            <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Send size={18} />
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
