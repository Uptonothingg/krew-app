import { useState, useEffect } from 'react';
import api from '../utils/api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import './Staff.css';

const ALL_ROLES = ['Manager', 'Host', 'Bartender', 'Server', 'Cook', 'Dishwasher', 'Other'];
const APP_ROLES = ['Manager'];
const STAFF_ROLE_ORDER = ['Manager', 'Host', 'Bartender', 'Server', 'Cook', 'Dishwasher', 'Other'];

export default function Staff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', role: '', pin: '', max_hours_week: 40 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [myRole, setMyRole] = useState('');

  const isManagerRole = APP_ROLES.includes(form.role) || form.role === 'Manager';

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [staffRes, teamRes] = await Promise.all([
        api.get('/staff'),
        api.get('/team'),
      ]);
      setStaff(staffRes.data);
      setManagers(teamRes.data);
      const me = teamRes.data.find(m => m.email === user?.email);
      if (me) setMyRole(me.role);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);
    try {
      if (isManagerRole) {
        const { data } = await api.post('/team/invite', {
          full_name: form.full_name,
          email: form.email,
          pin: form.pin,
          role: 'manager',
        });
        setSuccess(data.message);
      } else {
        if (editingStaff) {
          await api.put(`/staff/${editingStaff.id}`, form);
        } else {
          await api.post('/staff', form);
        }
      }
      setShowForm(false);
      setEditingStaff(null);
      setForm({ full_name: '', email: '', phone: '', role: '', pin: '', max_hours_week: 40 });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  }

  function startEdit(member) {
    setEditingStaff(member);
    setForm({
      full_name: member.full_name,
      email: member.email || '',
      phone: member.phone || '',
      role: member.role,
      pin: member.pin,
      max_hours_week: member.max_hours_week,
    });
    setShowForm(true);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openNew() {
    setEditingStaff(null);
    setForm({ full_name: '', email: '', phone: '', role: '', pin: '', max_hours_week: 40 });
    setShowForm(!showForm);
    setError('');
  }

  async function handleDeactivateStaff(id) {
    if (!window.confirm('Remove this staff member?')) return;
    try {
      await api.delete(`/staff/${id}`);
      fetchAll();
    } catch (err) { console.error(err); }
  }

  async function handleRemoveManager(id, name) {
    if (!window.confirm(`Remove ${name} from the team?`)) return;
    try {
      await api.delete(`/team/${id}`);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove manager');
    }
  }

  const isOwner = myRole === 'owner';

  const roleBadge = (role) => {
    const styles = { owner: 'badge-owner', manager: 'badge-admin' };
    const labels = { owner: 'Owner', manager: 'Manager' };
    return <span className={`badge ${styles[role]}`}>{labels[role] || role}</span>;
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff</h1>
          <p className="page-sub">{staff.length} staff members · {managers.length} with app access</p>
        </div>
        <button className="btn-primary-sm" onClick={openNew}>
          {showForm && !editingStaff ? 'Cancel' : '+ Add staff'}
        </button>
      </div>

      {success && <div className="alert-success">{success}</div>}
      {error && <div className="alert-error">{error}</div>}

      {showForm && (
        <div className="form-card">
          <h3 className="form-title">{editingStaff ? `Edit ${editingStaff.full_name}` : 'Add staff member'}</h3>

          <form onSubmit={handleSubmit} className="staff-form">
            <div className="form-row">
              <div className="field">
                <label>Full name *</label>
                <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required />
              </div>
              <div className="field">
                <label>Role *</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} required>
                  <option value="">Select role</option>
                  {ALL_ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {isManagerRole ? (
              <>
                <div className="role-notice">
                  Managers get app access to build schedules and manage staff. They'll receive an invite email to set their password.
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>Email *</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                  </div>
                  <div className="field">
                    <label>PIN (4 digits) *</label>
                    <input value={form.pin} onChange={e => setForm({...form, pin: e.target.value})} maxLength={4} required />
                  </div>
                </div>
              </>
            ) : form.role && (
              <>
                <div className="form-row">
                  <div className="field">
                    <label>Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                  <div className="field">
                    <label>Phone</label>
                    <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>PIN (4 digits) *</label>
                    <input value={form.pin} onChange={e => setForm({...form, pin: e.target.value})} maxLength={4} required />
                  </div>
                  <div className="field">
                    <label>Max hours/week</label>
                    <input type="number" value={form.max_hours_week} onChange={e => setForm({...form, max_hours_week: parseInt(e.target.value)})} />
                  </div>
                </div>
              </>
            )}

            {form.role && (
              <div style={{display:'flex', gap:'8px', marginTop:'4px'}}>
                <button type="submit" className="btn-primary-sm" disabled={saving}>
                  {saving ? 'Saving...' : isManagerRole ? 'Send invite email' : editingStaff ? 'Save changes' : 'Add staff member'}
                </button>
                {editingStaff && (
                  <button type="button" className="btn-secondary-sm" onClick={() => { setEditingStaff(null); setShowForm(false); }}>Cancel</button>
                )}
              </div>
            )}
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="section-header">App access</div>
          <div className="staff-list" style={{marginBottom:'1.5rem'}}>
            {managers.map(manager => (
              <div key={manager.id} className="staff-card">
                <div className="staff-avatar manager-avatar">
                  {manager.full_name.split(' ').map(n => n[0]).join('').slice(0,2)}
                </div>
                <div className="staff-info">
                  <div className="staff-name">
                    {manager.full_name}
                    {manager.email === user?.email && <span className="you-tag">you</span>}
                  </div>
                  <div className="staff-meta">{manager.email}</div>
                </div>
                {roleBadge(manager.role)}
                {isOwner && manager.role !== 'owner' && manager.email !== user?.email && (
                  <button className="deactivate-btn" onClick={() => handleRemoveManager(manager.id, manager.full_name)}>Remove</button>
                )}
              </div>
            ))}
          </div>

          {STAFF_ROLE_ORDER.filter(r => r !== 'Manager').map(role => {
            const roleStaff = staff.filter(m => m.role === role);
            if (roleStaff.length === 0) return null;
            return (
              <div key={role}>
                <div className="section-header">{role}s</div>
                <div className="staff-list" style={{marginBottom:'1rem'}}>
                  {roleStaff.map(member => (
                    <div key={member.id} className="staff-card">
                      <div className="staff-avatar">
                        {member.full_name.split(' ').map(n => n[0]).join('').slice(0,2)}
                      </div>
                      <div className="staff-info">
                        <div className="staff-name">{member.full_name}</div>
                        <div className="staff-meta">{member.role}{member.email ? ` · ${member.email}` : ''}</div>
                      </div>
                      <div className="staff-pin">PIN: {member.pin}</div>
                      <button className="edit-btn" onClick={() => startEdit(member)}>Edit</button>
                      <button className="deactivate-btn" onClick={() => handleDeactivateStaff(member.id)}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </Layout>
  );
}
