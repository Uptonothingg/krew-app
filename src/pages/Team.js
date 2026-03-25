import { useState, useEffect } from 'react';
import api from '../utils/api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import './Team.css';

export default function Team() {
  const { user } = useAuth();
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', role: 'admin' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [myRole, setMyRole] = useState('');

  useEffect(() => { fetchTeam(); }, []);

  async function fetchTeam() {
    try {
      const { data } = await api.get('/team');
      setManagers(data);
      const me = data.find(m => m.email === user?.email);
      if (me) setMyRole(me.role);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleInvite(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);
    try {
      const { data } = await api.post('/team/invite', form);
      setSuccess(data.message);
      setShowForm(false);
      setForm({ full_name: '', email: '', role: 'admin' });
      fetchTeam();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send invite');
    } finally { setSaving(false); }
  }

  async function handleRemove(id, name) {
    if (!window.confirm(`Remove ${name} from the team?`)) return;
    try {
      await api.delete(`/team/${id}`);
      fetchTeam();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove manager');
    }
  }

  async function handleRoleChange(id, role) {
    try {
      await api.put(`/team/${id}/role`, { role });
      fetchTeam();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update role');
    }
  }

  const isOwner = myRole === 'owner';

  const roleBadge = (role) => {
    const styles = {
      owner: 'badge-owner',
      admin: 'badge-admin',
      viewer: 'badge-viewer',
    };
    return <span className={`badge ${styles[role]}`}>{role}</span>;
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-sub">{managers.length} team member{managers.length !== 1 ? 's' : ''}</p>
        </div>
        {isOwner && (
          <button className="btn-primary-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Invite member'}
          </button>
        )}
      </div>

      {success && <div className="alert-success">{success}</div>}
      {error && <div className="alert-error">{error}</div>}

      {showForm && (
        <div className="form-card">
          <h3 className="form-title">Invite a team member</h3>
          <form onSubmit={handleInvite} className="invite-form">
            <div className="form-row">
              <div className="field">
                <label>Full name *</label>
                <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required />
              </div>
              <div className="field">
                <label>Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              </div>
            </div>
            <div className="field" style={{maxWidth: '200px'}}>
              <label>Role *</label>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                <option value="admin">Admin — can edit everything</option>
                <option value="viewer">Viewer — read only</option>
              </select>
            </div>
            <div className="role-explainer">
              <div className="role-row"><strong>Admin</strong> — can add/edit/delete shifts and staff</div>
              <div className="role-row"><strong>Viewer</strong> — can only view the schedule</div>
            </div>
            <button type="submit" className="btn-primary-sm" disabled={saving}>
              {saving ? 'Sending invite...' : 'Send invite email'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading team...</div>
      ) : (
        <div className="team-list">
          {managers.map(manager => (
            <div key={manager.id} className="team-card">
              <div className="team-avatar">
                {manager.full_name.split(' ').map(n => n[0]).join('').slice(0,2)}
              </div>
              <div className="team-info">
                <div className="team-name">
                  {manager.full_name}
                  {manager.email === user?.email && <span className="you-tag">you</span>}
                </div>
                <div className="team-email">{manager.email}</div>
              </div>
              <div className="team-role">
                {isOwner && manager.role !== 'owner' && manager.email !== user?.email ? (
                  <select
                    value={manager.role}
                    onChange={e => handleRoleChange(manager.id, e.target.value)}
                    className="role-select"
                  >
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                ) : (
                  roleBadge(manager.role)
                )}
              </div>
              {isOwner && manager.role !== 'owner' && manager.email !== user?.email && (
                <button className="remove-btn" onClick={() => handleRemove(manager.id, manager.full_name)}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
