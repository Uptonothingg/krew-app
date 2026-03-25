import { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import api from '../utils/api';
import Layout from '../components/Layout';
import './Schedule.css';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIMES = Array.from({ length: 35 }, (_, i) => {
  const totalMins = 6 * 60 + i * 30;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour || 12}${m !== '00' ? ':' + m : ''}${hour >= 12 ? 'pm' : 'am'}`;
}

const ROLE_ORDER = ['Manager', 'Host', 'Bartender', 'Server', 'Cook', 'Dishwasher', 'Other'];

export default function Schedule() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [shifts, setShifts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ start_time: '09:00', end_time: '17:00', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [staffRes, shiftsRes, teamRes] = await Promise.all([
        api.get('/staff'),
        api.get('/shifts', {
          params: {
            start_date: format(days[0], 'yyyy-MM-dd'),
            end_date: format(days[6], 'yyyy-MM-dd'),
          },
        }),
        api.get('/team'),
      ]);
      setStaff(staffRes.data);
      setShifts(shiftsRes.data);
      setManagers(teamRes.data.map(m => ({
        ...m,
        id: m.staff_id || m.id,
        role: 'Manager',
        isAppUser: true,
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function getShiftForStaff(staffId, day) {
    const dateStr = format(day, 'yyyy-MM-dd');
    return shifts.find(s => s.staff_id === staffId && s.shift_date === dateStr);
  }

  function openNew(member, day) {
    setModal({ mode: 'new', member, day });
    setForm({ start_time: '09:00', end_time: '17:00', notes: '' });
    setError('');
  }

  function openEdit(shift, member) {
    setModal({ mode: 'edit', shift, member });
    setForm({
      start_time: shift.start_time.slice(0, 5),
      end_time: shift.end_time.slice(0, 5),
      notes: shift.notes || '',
    });
    setError('');
  }

  function closeModal() { setModal(null); setError(''); }

  async function handleSave() {
    setSaving(true); setError('');
    try {
      if (modal.mode === 'new') {
        await api.post('/shifts', {
          staff_id: modal.member.id,
          shift_date: format(modal.day, 'yyyy-MM-dd'),
          start_time: form.start_time,
          end_time: form.end_time,
          notes: form.notes,
        });
      } else {
        await api.put(`/shifts/${modal.shift.id}`, {
          start_time: form.start_time,
          end_time: form.end_time,
          notes: form.notes,
        });
      }
      closeModal();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save shift');
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!window.confirm('Remove this shift?')) return;
    setSaving(true);
    try {
      await api.delete(`/shifts/${modal.shift.id}`);
      closeModal();
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete shift');
    } finally { setSaving(false); }
  }

  const allStaff = [
    ...managers,
    ...ROLE_ORDER.filter(r => r !== 'Manager').flatMap(role =>
      staff.filter(m => m.role === role)
    )
  ];

  const totalShifts = shifts.filter(s => s.staff_id).length;
  const openShifts = shifts.filter(s => !s.staff_id).length;
  const totalHours = shifts.filter(s => s.staff_id).reduce((acc, s) => {
    const [sh, sm] = s.start_time.split(':').map(Number);
    const [eh, em] = s.end_time.split(':').map(Number);
    return acc + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
  }, 0);

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Schedule</h1>
          <p className="page-sub">{format(days[0], 'MMM d')} – {format(days[6], 'MMM d, yyyy')}</p>
        </div>
        <div className="week-nav">
          <button onClick={() => setWeekStart(d => addDays(d, -7))}>&#8592;</button>
          <button onClick={() => setWeekStart(d => addDays(d, 7))}>&#8594;</button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="stat-label">Staff</div><div className="stat-val">{staff.length + managers.length}</div></div>
        <div className="stat-card"><div className="stat-label">Shifts this week</div><div className="stat-val">{totalShifts}</div></div>
        <div className="stat-card"><div className="stat-label">Total hours</div><div className="stat-val">{totalHours.toFixed(0)}h</div></div>
        <div className="stat-card"><div className="stat-label">Open shifts</div><div className="stat-val red">{openShifts}</div></div>
      </div>

      {loading ? (
        <div className="loading">Loading schedule...</div>
      ) : allStaff.length === 0 ? (
        <div className="empty-state">No staff yet — add staff members first to start scheduling.</div>
      ) : (
        <div className="schedule-grid-wrap">
          <div className="schedule-grid">
            <div className="grid-head-cell name-col">Staff</div>
            {days.map((day, i) => (
              <div key={i} className={`grid-head-cell ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'today' : ''}`}>
                <span className="day-name">{DAYS[i]}</span>
                <span className="day-num">{format(day, 'd')}</span>
              </div>
            ))}

            {allStaff.map((member, idx) => {
              const prevMember = allStaff[idx - 1];
              const showDivider = idx > 0 && prevMember.isAppUser && !member.isAppUser;
              const weekHours = shifts.filter(s => s.staff_id === member.id).reduce((acc, s) => {
                const [sh, sm] = s.start_time.split(':').map(Number);
                const [eh, em] = s.end_time.split(':').map(Number);
                return acc + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
              }, 0);

              return (
                <>
                  {showDivider && (
                    <div key="divider" className="grid-divider" />
                  )}
                  <div key={member.id + '-name'} className="grid-cell name-col">
                    <div className="staff-name">{member.full_name}</div>
                    <div className="staff-role">{member.role}</div>
                    {weekHours > 0 && <div className="staff-hours">{weekHours.toFixed(0)}h</div>}
                  </div>
                  {days.map((day, i) => {
                    const shift = getShiftForStaff(member.id, day);
                    return (
                      <div
                        key={member.id + '-' + i}
                        className={`grid-cell clickable ${!shift ? 'empty-cell' : ''}`}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => shift ? openEdit(shift, member) : openNew(member, day)}
                      >
                        {shift ? (
                          <div className={`shift-pill ${shift.start_time < '12:00' ? 'am' : 'pm'}`}>
                            {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
                          </div>
                        ) : (
                          <span className="add-hint">+</span>
                        )}
                      </div>
                    );
                  })}
                </>
              );
            })}
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">{modal.mode === 'new' ? 'Add shift' : 'Edit shift'}</div>
                <div className="modal-sub">
                  {modal.member.full_name} · {format(modal.mode === 'new' ? modal.day : new Date(modal.shift.shift_date + 'T00:00:00'), 'EEE MMM d')}
                </div>
              </div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            {error && <div className="modal-error">{error}</div>}
            <div className="modal-body">
              <div className="form-row">
                <div className="field">
                  <label>Start time</label>
                  <select value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})}>
                    {TIMES.map(t => <option key={t} value={t}>{formatTime(t)}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>End time</label>
                  <select value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})}>
                    {TIMES.map(t => <option key={t} value={t}>{formatTime(t)}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Notes (optional)</label>
                <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="e.g. Opening shift" />
              </div>
            </div>
            <div className="modal-footer">
              {modal.mode === 'edit' && (
                <button className="btn-danger" onClick={handleDelete} disabled={saving}>Remove</button>
              )}
              <div style={{flex:1}} />
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary-sm" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save shift'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
