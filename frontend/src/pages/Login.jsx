import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/client';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { signIn } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(username, password);
      if (res.success) {
        signIn(res.user);
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials or server unavailable');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg-shape s1" />
      <div className="login-bg-shape s2" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-mark">
            <i className="fa-solid fa-layer-group" />
          </div>
          <div className="login-logo-text">
            <h1>NexGen HR</h1>
            <p>AI-Assisted Payroll System</p>
          </div>
        </div>

        <p className="login-subtitle">Welcome back — sign in to continue</p>

        {error && (
          <div className="login-error">
            <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 8 }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="login-input-wrap">
            <i className="fa-solid fa-user" />
            <input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="login-input-wrap">
            <i className="fa-solid fa-lock" />
            <input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading
              ? <><i className="fa-solid fa-spinner fa-spin" /> Authenticating...</>
              : <><i className="fa-solid fa-right-to-bracket" /> Sign In</>
            }
          </button>
        </form>

        <div className="login-hint">
          <i className="fa-solid fa-shield-halved" style={{ marginRight: 6, color: 'var(--accent-blue)' }} />
          Demo credentials: <strong style={{ color: 'var(--text-primary)' }}>admin</strong> / <strong style={{ color: 'var(--text-primary)' }}>admin123</strong>
        </div>
      </div>
    </div>
  );
}
