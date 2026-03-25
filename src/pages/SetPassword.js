import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import './Login.css';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default function SetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
      setReady(true);
    }
  });

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) setReady(true);
  });

  return () => subscription.unsubscribe();
}, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) return setError('Passwords do not match');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    setLoading(true); setError('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to set password');
    } finally { setLoading(false); }
  }

  if (!ready) return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">Krew</div>
        <p className="login-sub">Verifying your invite link...</p>
      </div>
    </div>
  );

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">Krew</div>
        <p className="login-sub">Set your password to get started.</p>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>New password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus minLength={8} />
          </div>
          <div className="field">
            <label>Confirm password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Setting password...' : 'Set password & sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
