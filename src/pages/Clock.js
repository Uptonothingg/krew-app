import { useState } from 'react';
import api from '../utils/api';
import './Clock.css';

export default function Clock() {
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('in');

  function handleKey(val) {
    if (pin.length < 4) setPin(p => p + val);
  }

  function handleClear() { setPin(''); setMessage(null); setError(''); }

  async function handleSubmit() {
    if (pin.length !== 4) return;
    setLoading(true); setError(''); setMessage(null);
    try {
      const { data } = await api.post(`/clock/${mode}`, { pin });
      setMessage(data.message);
      setPin('');
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
      setPin('');
    } finally { setLoading(false); }
  }

  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div className="clock-wrap">
      <div className="clock-card">
        <div className="clock-logo">Krew</div>
        <div className="clock-mode">
          <button className={mode === 'in' ? 'mode-btn active' : 'mode-btn'} onClick={() => { setMode('in'); handleClear(); }}>Clock in</button>
          <button className={mode === 'out' ? 'mode-btn active' : 'mode-btn'} onClick={() => { setMode('out'); handleClear(); }}>Clock out</button>
        </div>
        <p className="clock-prompt">Enter your 4-digit PIN</p>
        <div className="pin-dots">
          {[0,1,2,3].map(i => <div key={i} className={`pin-dot ${pin.length > i ? 'filled' : ''}`} />)}
        </div>
        {message && <div className="clock-success">{message}</div>}
        {error && <div className="clock-error">{error}</div>}
        <div className="keypad">
          {keys.map((k, i) => (
            <button
              key={i}
              className={`key-btn ${k === '' ? 'key-empty' : ''}`}
              onClick={() => {
                if (k === '⌫') setPin(p => p.slice(0, -1));
                else if (k !== '') handleKey(k);
              }}
              disabled={loading || k === ''}
            >{k}</button>
          ))}
        </div>
        <button className="submit-btn" onClick={handleSubmit} disabled={pin.length !== 4 || loading}>
          {loading ? 'Please wait...' : mode === 'in' ? 'Clock in' : 'Clock out'}
        </button>
        <button className="back-link" onClick={() => window.location.href = '/'}>Back to dashboard</button>
      </div>
    </div>
  );
}
