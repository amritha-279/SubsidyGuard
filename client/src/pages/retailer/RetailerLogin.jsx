import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { Eye, EyeOff, ArrowLeft, Mail, Lock, LogIn, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import './retailer.css';
import api from '../../api.js';

function ForgotFlow({ onBack }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await api.post(`/api/auth/forgot-password`, { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Server error. Please try again.');
    } finally { setLoading(false); }
  };

  const handleReset = async e => {
    e.preventDefault(); setError('');
    if (newPw !== confirmPw) { setError('Passwords do not match.'); return; }
    if (newPw.length < 6) { setError('Minimum 6 characters required.'); return; }
    setLoading(true);
    try {
      await api.post(`/api/auth/reset-password`, { email, otp, newPassword: newPw });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Server error. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-green-700 font-semibold mb-5 hover:underline">
        <ArrowLeft className="w-3 h-3" /> Back to Login
      </button>

      {step === 1 && (
        <form onSubmit={handleSendOtp}>
          <h2 className="r-auth-title" style={{ marginBottom: 4 }}>Forgot Password</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--r-text-muted)', marginBottom: 16 }}>Enter your registered email to receive an OTP.</p>
          {error && (
            <div className="r-alert r-alert-danger" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <div className="r-form-group">
            <label>Email Address</label>
            <input className="r-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
          </div>
          <button className="r-btn r-btn-primary r-btn-full" type="submit" disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : <><Mail size={15} /> Send OTP</>}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleReset}>
          <h2 className="r-auth-title" style={{ marginBottom: 8 }}>Enter OTP & New Password</h2>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: '0.8rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mail size={13} /> OTP sent to <strong>{email}</strong>. Please check your email.
          </div>
          {error && (
            <div className="r-alert r-alert-danger" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <div className="r-form-group">
            <label>OTP</label>
            <input className="r-input" value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit OTP" maxLength={6} required />
          </div>
          <div className="r-form-group">
            <label>New Password</label>
            <div style={{ position: 'relative' }}>
              <input className="r-input" type={showPw ? 'text' : 'password'} value={newPw}
                onChange={e => setNewPw(e.target.value)} placeholder="Min 6 characters" required style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--r-text-muted)', padding: 0 }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="r-form-group">
            <label>Confirm Password</label>
            <input className="r-input" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Re-enter password" required />
          </div>
          <button className="r-btn r-btn-primary r-btn-full" type="submit" disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? <><Loader2 size={15} className="animate-spin" /> Resetting…</> : <><Lock size={15} /> Reset Password</>}
          </button>
        </form>
      )}

      {step === 3 && (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <CheckCircle size={48} style={{ color: '#16a34a', margin: '0 auto 12px' }} />
          <h2 className="r-auth-title">Password Reset!</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--r-text-muted)', marginBottom: 20 }}>Your password has been updated successfully.</p>
          <button className="r-btn r-btn-primary r-btn-full" onClick={onBack}>Back to Login</button>
        </div>
      )}
    </div>
  );
}

export default function RetailerLogin() {
  const navigate = useNavigate();
  const [forgot, setForgot] = useState(false);
  const [form, setForm] = useState({ identifier: '', password: '', remember: false });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingMsg, setPendingMsg] = useState('');

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setPendingMsg(''); setLoading(true);
    try {
      const res = await api.post(`/api/auth/login`, { identifier: form.identifier, password: form.password });
      const { user, token } = res.data;
      localStorage.setItem('retailer_user', JSON.stringify({ ...user, token }));
      navigate('/retailer/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || '';
      if (msg.toLowerCase().includes('pending') || msg.toLowerCase().includes('approval')) {
        setPendingMsg('Your account is pending Agriculture Officer approval. Please wait for verification.');
      } else if (msg.toLowerCase().includes('rejected')) {
        setError('Your account has been rejected. Please contact the Agriculture Officer.');
      } else {
        setError(msg || 'Invalid credentials. Please try again.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="r-auth-bg">
      <div className="r-auth-card">
        <div className="r-auth-logo">
          <LogIn size={32} style={{ color: 'var(--r-green)' }} />
          <h1>SubsidyGuard</h1>
          <p>Retailer Portal</p>
        </div>

        {forgot ? (
          <ForgotFlow onBack={() => setForgot(false)} />
        ) : (
          <>
            <h2 className="r-auth-title">Sign In to Your Account</h2>

            {error && (
              <div className="r-alert r-alert-danger" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}
            {pendingMsg && (
              <div className="r-pending-status" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Loader2 size={14} /> <span>{pendingMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="r-form-group">
                <label>Email or Mobile Number</label>
                <input className="r-input" name="identifier" value={form.identifier} onChange={handleChange}
                  placeholder="Enter email or mobile number" required autoComplete="username" />
              </div>

              <div className="r-form-group">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="r-input" type={showPw ? 'text' : 'password'} name="password"
                    value={form.password} onChange={handleChange} placeholder="Enter your password"
                    required autoComplete="current-password" style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--r-text-muted)', padding: 0 }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.87rem', cursor: 'pointer', color: 'var(--r-text-muted)' }}>
                  <input type="checkbox" name="remember" checked={form.remember} onChange={handleChange} />
                  Remember Me
                </label>
                <button type="button" onClick={() => setForgot(true)}
                  style={{ fontSize: '0.85rem', color: 'var(--r-green)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  Forgot Password?
                </button>
              </div>

              <button className="r-btn r-btn-primary r-btn-full" type="submit" disabled={loading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? <><Loader2 size={15} className="animate-spin" /> Signing in…</> : <><LogIn size={15} /> Login</>}
              </button>
            </form>

            <hr className="r-divider" />
            <div className="r-auth-footer">
              Don't have an account?{' '}
              <Link to="/retailer/register">Register as Retailer</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
