import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, User, Lock, Eye, EyeOff, Mail, ArrowLeft, AlertCircle, CheckCircle, Loader2, LogIn, Leaf } from 'lucide-react';
import subBg from '../assets/sub.png';

const inputCls = 'w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-white/90 placeholder-gray-400';
const pwCls    = 'w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-white/90 placeholder-gray-400';

const IconWrap = ({ children }) => (
  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">{children}</span>
);
const EyeBtn = ({ show, toggle }) => (
  <button type="button" onClick={toggle} tabIndex={-1}
    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
  </button>
);
const ErrorBox = ({ msg, sm }) => msg ? (
  <div className={`mb-4 bg-red-50 border border-red-200 text-red-700 ${sm ? 'text-xs' : 'text-sm'} rounded-lg px-4 py-3 flex items-center gap-2`}>
    <AlertCircle className="w-4 h-4 flex-shrink-0" />{msg}
  </div>
) : null;

function ForgotFlow({ accentColor, onBack }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const accent = accentColor === 'blue'
    ? { ring: 'focus:ring-blue-500 focus:border-blue-500', btn: 'bg-blue-600 hover:bg-blue-700', text: 'text-blue-600' }
    : { ring: 'focus:ring-green-500 focus:border-green-500', btn: 'bg-green-600 hover:bg-green-700', text: 'text-green-600' };

  const inCls = `w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${accent.ring} transition bg-white placeholder-gray-400`;

  const handleSendOtp = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setStep(2);
    } catch { setError('Server error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleReset = async e => {
    e.preventDefault(); setError('');
    if (newPw !== confirmPw) { setError('Passwords do not match.'); return; }
    if (newPw.length < 6) { setError('Minimum 6 characters required.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp, newPassword: newPw }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setStep(3);
    } catch { setError('Server error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <button onClick={onBack} className={`flex items-center gap-1 text-xs ${accent.text} font-semibold mb-5 hover:underline`}>
        <ArrowLeft className="w-3 h-3" /> Back to Login
      </button>

      {step === 1 && (
        <form onSubmit={handleSendOtp}>
          <h2 className="text-base font-bold text-gray-800 mb-1">Forgot Password</h2>
          <p className="text-xs text-gray-500 mb-5">Enter your registered email to receive an OTP.</p>
          <ErrorBox msg={error} sm />
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email Address</label>
            <input type="email" className={inCls} placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className={`w-full py-2.5 ${accent.btn} disabled:opacity-60 text-white font-semibold rounded-lg transition text-sm flex items-center justify-center gap-2`}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><Mail className="w-4 h-4" /> Send OTP</>}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleReset}>
          <h2 className="text-base font-bold text-gray-800 mb-3">Enter OTP & New Password</h2>
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-xs text-blue-800 flex items-center gap-2">
            <Mail className="w-3 h-3 flex-shrink-0" /> OTP sent to <strong>{email}</strong>. Please check your email.
          </div>
          <ErrorBox msg={error} sm />
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">OTP</label>
            <input className={inCls} placeholder="6-digit OTP" value={otp} maxLength={6} onChange={e => setOtp(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">New Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} className={`${inCls} pr-10`} placeholder="Min 6 characters" value={newPw} onChange={e => setNewPw(e.target.value)} required />
              <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Confirm Password</label>
            <input type="password" className={inCls} placeholder="Re-enter password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className={`w-full py-2.5 ${accent.btn} disabled:opacity-60 text-white font-semibold rounded-lg transition text-sm flex items-center justify-center gap-2`}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting…</> : <><Lock className="w-4 h-4" /> Reset Password</>}
          </button>
        </form>
      )}

      {step === 3 && (
        <div className="text-center py-4">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-gray-800 mb-2">Password Reset!</h2>
          <p className="text-xs text-gray-500 mb-5">Your password has been updated successfully.</p>
          <button onClick={onBack} className={`w-full py-2.5 ${accent.btn} text-white font-semibold rounded-lg transition text-sm`}>
            Back to Login
          </button>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('officer');
  const [officerForgot, setOfficerForgot] = useState(false);
  const [retailerForgot, setRetailerForgot] = useState(false);

  const [officerForm, setOfficerForm] = useState({ username: '', password: '' });
  const [showOfficerPw, setShowOfficerPw] = useState(false);
  const [officerError, setOfficerError] = useState('');
  const [officerLoading, setOfficerLoading] = useState(false);

  const [retailerForm, setRetailerForm] = useState({ email: '', password: '' });
  const [showRetailerPw, setShowRetailerPw] = useState(false);
  const [retailerError, setRetailerError] = useState('');
  const [retailerLoading, setRetailerLoading] = useState(false);

  const handleOfficerLogin = async e => {
    e.preventDefault(); setOfficerError('');
    if (!officerForm.username || !officerForm.password) { setOfficerError('Please enter your username and password.'); return; }
    setOfficerLoading(true);
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: officerForm.username, password: officerForm.password }) });
      const data = await res.json();
      if (!res.ok) { setOfficerError(data.error || 'Invalid credentials.'); return; }
      if (data.user.role !== 'OFFICER') { setOfficerError('Access denied. Not an officer account.'); return; }
      localStorage.setItem('subsidy_user', JSON.stringify({ role: 'OFFICER', name: data.user.name, id: data.user.id, token: data.token }));
      navigate('/admin');
    } catch { setOfficerError('Server error. Please try again.'); }
    finally { setOfficerLoading(false); }
  };

  const handleRetailerLogin = async e => {
    e.preventDefault(); setRetailerError('');
    if (!retailerForm.email || !retailerForm.password) { setRetailerError('Please enter your email and password.'); return; }
    setRetailerLoading(true);
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: retailerForm.email, password: retailerForm.password }) });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || '';
        if (msg.toLowerCase().includes('pending')) setRetailerError('Your account is pending Agriculture Officer approval.');
        else if (msg.toLowerCase().includes('rejected')) setRetailerError('Your account has been rejected. Contact the Agriculture Officer.');
        else setRetailerError(msg || 'Invalid email or password.');
        return;
      }
      localStorage.setItem('retailer_user', JSON.stringify({ role: 'RETAILER', ...data.user, token: data.token }));
      navigate('/retailer/dashboard');
    } catch { setRetailerError('Server error. Please try again.'); }
    finally { setRetailerLoading(false); }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${subBg})` }} />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-3 shadow-xl">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-lg">SubsidyGuard</h1>
          <p className="text-white/70 mt-1 text-sm">Secure Fertilizer Distribution Network</p>
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/40">
          <div className="flex border-b border-gray-200">
            <button type="button" onClick={() => { setTab('officer'); setOfficerForgot(false); }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${tab === 'officer' ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              <User className="w-4 h-4" /> Agriculture Officer
            </button>
            <button type="button" onClick={() => { setTab('retailer'); setRetailerForgot(false); }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${tab === 'retailer' ? 'text-green-700 border-b-2 border-green-600 bg-green-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              <Leaf className="w-4 h-4" /> Retailer
            </button>
          </div>

          <div className="p-5 sm:p-8">
            {tab === 'officer' && (
              officerForgot
                ? <ForgotFlow accentColor="blue" onBack={() => setOfficerForgot(false)} />
                : <form onSubmit={handleOfficerLogin}>
                    <h2 className="text-lg font-bold text-gray-800 mb-6">Officer Sign In</h2>
                    <ErrorBox msg={officerError} />
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Username / Officer ID</label>
                      <div className="relative">
                        <IconWrap><User className="w-4 h-4" /></IconWrap>
                        <input type="text" name="username" className={inputCls} placeholder="officer@gmail.com"
                          value={officerForm.username} onChange={e => setOfficerForm(f => ({ ...f, username: e.target.value }))} autoComplete="username" />
                      </div>
                    </div>
                    <div className="mb-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
                      <div className="relative">
                        <IconWrap><Lock className="w-4 h-4" /></IconWrap>
                        <input type={showOfficerPw ? 'text' : 'password'} name="password" className={pwCls} placeholder="••••••••"
                          value={officerForm.password} onChange={e => setOfficerForm(f => ({ ...f, password: e.target.value }))} autoComplete="current-password" />
                        <EyeBtn show={showOfficerPw} toggle={() => setShowOfficerPw(v => !v)} />
                      </div>
                    </div>
                    <div className="flex justify-end mb-6 mt-1">
                      <button type="button" onClick={() => setOfficerForgot(true)} className="text-xs text-blue-600 hover:underline font-medium">Forgot Password?</button>
                    </div>
                    <button type="submit" disabled={officerLoading}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-lg transition shadow-md text-sm flex items-center justify-center gap-2">
                      {officerLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : <><LogIn className="w-4 h-4" /> Login as Officer</>}
                    </button>
                  </form>
            )}

            {tab === 'retailer' && (
              retailerForgot
                ? <ForgotFlow accentColor="green" onBack={() => setRetailerForgot(false)} />
                : <form onSubmit={handleRetailerLogin}>
                    <h2 className="text-lg font-bold text-gray-800 mb-1">Retailer Sign In</h2>
                    <p className="text-xs text-gray-500 mb-6">Sign in with your registered email</p>
                    <ErrorBox msg={retailerError} />
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email Address</label>
                      <div className="relative">
                        <IconWrap><Mail className="w-4 h-4" /></IconWrap>
                        <input type="email" name="email" className={inputCls} placeholder="your@email.com"
                          value={retailerForm.email} onChange={e => setRetailerForm(f => ({ ...f, email: e.target.value }))} autoComplete="email" />
                      </div>
                    </div>
                    <div className="mb-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
                      <div className="relative">
                        <IconWrap><Lock className="w-4 h-4" /></IconWrap>
                        <input type={showRetailerPw ? 'text' : 'password'} name="password" className={pwCls} placeholder="••••••••"
                          value={retailerForm.password} onChange={e => setRetailerForm(f => ({ ...f, password: e.target.value }))} autoComplete="current-password" />
                        <EyeBtn show={showRetailerPw} toggle={() => setShowRetailerPw(v => !v)} />
                      </div>
                    </div>
                    <div className="flex justify-end mb-6 mt-1">
                      <button type="button" onClick={() => setRetailerForgot(true)} className="text-xs text-green-600 hover:underline font-medium">Forgot Password?</button>
                    </div>
                    <button type="submit" disabled={retailerLoading}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-lg transition shadow-md text-sm flex items-center justify-center gap-2">
                      {retailerLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : <><LogIn className="w-4 h-4" /> Login as Retailer</>}
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-5">
                      New retailer?{' '}
                      <Link to="/retailer/register" className="text-green-600 font-semibold hover:underline">Register here</Link>
                    </p>
                  </form>
            )}
          </div>
        </div>
        <p className="text-center text-white/40 text-xs mt-6">© 2026 SubsidyGuard System</p>
      </div>
    </div>
  );
}
