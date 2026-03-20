import { useState, useEffect } from 'react';
import api from '../utils/api';
import Layout from '../components/Layout';
import './Staff.css';

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', role: '', pin: '', max_hours_week: 40 });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchStaff(); }, []);

  async function fetchStaff() {
    try {
      const { data } = await api.get('/staff');
      setStaff(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      await api.post('/staff', form);
      setShowForm(false);
      setForm({ full_name: '', email: '', phone: '', role: '', pin: '', max_hours_week: 40 });
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add staff member');
    } finally { setSaving(false); }
  }

  async function handleDeactivate(id) {
    if (!window.confirm('Deactivate this staff member?')) return;
    try {
      await api.delete(`/staff/${id}`);
      fetchStaff();
    } catch (err) { console.error(err); }
  }

  const roles = ['Server', 'Cook', 'Host', 'Bartender', 'Dishwasher', 'Manager', 'Other'];

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff</h1>
          <p className="page-sub">{staff.length} active team members</p>
        </div>
        <button className="btn-primary-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add staff'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3 className="form-title">New staff member</h3>
          {error && <div className="form-error">{error}</div>}
          <form onSubmit={handleSubmit} className="staff-form">
            <div className="form-row">
              <div className="field"><label>Full name *</label><input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required /></div>
              <div className="field"><label>Role *</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} required>
                  <option value="">Select role</option>
                  {roles.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="field"><label>Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              <div className="field"><label>Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            </div>
            <div className="form-row">
              <div className="field"><label>PIN (4 digits) *</label><input value={form.pin} onChange={e => setForm({...form, pin: e.target.value})} maxLength={4} required /></div>
              <div className="field"><label>Max hours/week</label><input type="number" value={form.max_hours_week} onChange={e => setForm({...form, max_hours_week: parseInt(e.target.value)})} /></div>
            </div>
            <button type="submit" className="btn-primary-sm" disabled={saving}>{saving ? 'Saving...' : 'Add staff member'}</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading staff...</div>
      ) : (
        <div className="staff-list">
          {staff.map(member => (
            <div key={member.id} className="staff-card">
              <div className="staff-avatar">{member.full_name.split(' ').map(n => n[0]).join('').slice(0,2)}</div>
              <div className="staff-info">
                <div className="staff-name">{member.full_name}</div>
                <div className="staff-meta">{member.role}{member.email ? ` · ${member.email}` : ''}</div>
              </div>
              <div className="staff-pin">PIN: {member.pin}</div>
              <button className="deactivate-btn" onClick={() => handleDeactivate(member.id)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
