import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import api from '../utils/api';
import Layout from '../components/Layout';
import './Schedule.css';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Schedule() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [shifts, setShifts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => { fetchData(); }, [weekStart]);

  async function fetchData() {
    setLoading(true);
    try {
      const [staffRes, shiftsRes] = await Promise.all([
        api.get('/staff'),
        api.get('/shifts', {
          params: {
            start_date: format(days[0], 'yyyy-MM-dd'),
            end_date: format(days[6], 'yyyy-MM-dd'),
          },
        }),
      ]);
      setStaff(staffRes.data);
      setShifts(shiftsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function getShift(staffId, day) {
    const dateStr = format(day, 'yyyy-MM-dd');
    return shifts.find(s => s.staff_id === staffId && s.shift_date === dateStr);
  }

  function formatTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour > 12 ? hour - 12 : hour || 12}${m !== '00' ? ':' + m : ''}${hour >= 12 ? 'pm' : 'am'}`;
  }

  function prevWeek() { setWeekStart(d => addDays(d, -7)); }
  function nextWeek() { setWeekStart(d => addDays(d, 7)); }

  const openShifts = shifts.filter(s => !s.staff_id).length;
  const totalShifts = shifts.filter(s => s.staff_id).length;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Schedule</h1>
          <p className="page-sub">{format(days[0], 'MMM d')} – {format(days[6], 'MMM d, yyyy')}</p>
        </div>
        <div className="week-nav">
          <button onClick={prevWeek}>&#8592;</button>
          <button onClick={nextWeek}>&#8594;</button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="stat-label">Staff</div><div className="stat-val">{staff.length}</div></div>
        <div className="stat-card"><div className="stat-label">Shifts this week</div><div className="stat-val">{totalShifts}</div></div>
        <div className="stat-card"><div className="stat-label">Open shifts</div><div className="stat-val red">{openShifts}</div></div>
      </div>

      {loading ? (
        <div className="loading">Loading schedule...</div>
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
            {staff.map(member => (
              <>
                <div key={member.id + '-name'} className="grid-cell name-col">
                  <div className="staff-name">{member.full_name}</div>
                  <div className="staff-role">{member.role}</div>
                </div>
                {days.map((day, i) => {
                  const shift = getShift(member.id, day);
                  return (
                    <div key={member.id + '-' + i} className="grid-cell">
                      {shift ? (
                        <div className={`shift-pill ${shift.start_time < '12:00' ? 'am' : 'pm'}`}>
                          {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
                        </div>
                      ) : (
                        <span className="no-shift">—</span>
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
