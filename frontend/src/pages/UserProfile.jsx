import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Briefcase, Bell, AlertTriangle } from 'lucide-react';

export default function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    department: '',
    notificationsEnabled: true
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/users/me');
      setProfile(res.data);
      setFormData({
        name: res.data.name || '',
        phoneNumber: res.data.phoneNumber || '',
        department: res.data.department || '',
        notificationsEnabled: res.data.notificationsEnabled
      });
      setLoading(false);
    } catch (error) {
      console.error("Failed to load profile", error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await axios.put('http://localhost:8080/api/users/me', formData);
      setProfile(res.data);
      // Update local storage so the NavBar name changes instantly
      localStorage.setItem('user_name', res.data.name);
      alert("Profile updated successfully!");
    } catch (error) {
      alert("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirm1 = window.confirm("WARNING: This will permanently delete your account. You will lose access immediately. Are you sure?");
    if (confirm1) {
      const confirm2 = window.prompt("Type 'DELETE' to confirm.");
      if (confirm2 === 'DELETE') {
        try {
          await axios.delete('http://localhost:8080/api/users/me');
          localStorage.clear();
          navigate('/login');
        } catch (error) {
          alert("Failed to delete account.");
        }
      }
    }
  };

  if (loading) return <h2>Loading Profile...</h2>;

  return (
    <div className="dashboard" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="header" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <img src={profile.pictureUrl} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid white', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0' }}>{profile.name}</h1>
          <p style={{ margin: 0, color: '#71717a' }}>{profile.email} • {profile.role}</p>
        </div>
      </div>

      <div className="form-container" style={{ marginTop: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
          <User size={20} /> Personal Information
        </h2>
        
        <form onSubmit={handleUpdateProfile}>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label><Briefcase size={14} style={{ display: 'inline', marginBottom: '-2px' }}/> Department / Faculty</label>
              <input type="text" name="department" placeholder="e.g. Computing" value={formData.department} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label><Phone size={14} style={{ display: 'inline', marginBottom: '-2px' }}/> Phone Number</label>
              <input type="tel" name="phoneNumber" placeholder="+94 7X XXX XXXX" value={formData.phoneNumber} onChange={handleInputChange} />
            </div>
          </div>

          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Bell size={20} color="#3b82f6" />
            <div style={{ flex: 1 }}>
              <strong>System Notifications</strong>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Receive alerts for bookings and tickets.</p>
            </div>
            <label className="switch" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" name="notificationsEnabled" checked={formData.notificationsEnabled} onChange={handleInputChange} style={{ width: '20px', height: '20px' }} />
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="form-container" style={{ marginTop: '2rem', border: '1px solid #fecaca', background: '#fef2f2' }}>
        <h2 style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
          <AlertTriangle size={20} /> Danger Zone
        </h2>
        <p style={{ color: '#991b1b', marginBottom: '1.5rem' }}>Once you delete your account, there is no going back. Please be certain.</p>
        <button onClick={handleDeleteAccount} className="btn btn-danger">Permanently Delete Account</button>
      </div>
    </div>
  );
}