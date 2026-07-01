import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface LoginScreenProps {
  onBack: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onBack }) => {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('sending');
    const error = await signInWithEmail(email.trim());
    if (error) {
      setErrorMsg(error);
      setStatus('error');
    } else {
      setStatus('sent');
    }
  };

  if (status === 'sent') {
    return (
      <div className="glass-panel landing-card">
        <CheckCircle2 size={48} style={{ color: 'var(--accent-cyan)' }} />
        <h2 className="landing-title">Check your inbox</h2>
        <p className="landing-desc">
          We sent a sign-in link to <strong>{email}</strong>. Open it on this device (or any
          device) to finish signing in — your wall will sync automatically.
        </p>
        <button className="btn-secondary" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel landing-card">
      <h2 className="landing-title">Sync your Polaroid Wall</h2>
      <p className="landing-desc">
        Sign in with a magic link — no password needed — to keep your wall in sync across
        devices and share polaroids with a link.
      </p>

      <form onSubmit={handleSubmit} className="settings-section" style={{ width: '100%' }}>
        <div className="toggle-setting-info" style={{ width: '100%' }}>
          <label htmlFor="email-input" className="settings-label">Email address</label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', width: '100%' }}>
            <Mail size={18} style={{ alignSelf: 'center', color: 'var(--text-secondary)' }} />
            <input
              id="email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="text-input"
              autoFocus
            />
          </div>
        </div>

        {status === 'error' && <p className="error-text">{errorMsg}</p>}

        <button type="submit" className="btn-primary" disabled={status === 'sending'} style={{ width: '100%' }}>
          {status === 'sending' ? 'Sending link...' : 'Send Magic Link'}
        </button>
      </form>

      <button className="btn-secondary" onClick={onBack}>
        <ArrowLeft size={16} /> Continue without an account
      </button>
    </div>
  );
};
