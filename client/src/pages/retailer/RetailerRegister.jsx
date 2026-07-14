import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Store, MapPin, Lock, CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react';
import './retailer.css';
import subBg from '../../assets/sub.png';

const DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore',
  'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kancheepuram',
  'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
  'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
  'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi',
  'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur',
  'Vellore', 'Viluppuram', 'Virudhunagar',
];

const INITIAL = {
  shopName: '', ownerName: '', licenseNumber: '', aadhaarNumber: '',
  mobile: '', email: '', shopAddress: '', district: '', village: '',
  pinCode: '', password: '', confirmPassword: '',
};

export default function RetailerRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [licenseDoc, setLicenseDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.aadhaarNumber.length !== 12) { setError('Aadhaar number must be 12 digits.'); return; }
    if (form.mobile.length !== 10) { setError('Mobile number must be 10 digits.'); return; }
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/auth/register', {
        name: form.ownerName,
        email: form.email,
        password: form.password,
        role: 'RETAILER',
        shopId: form.licenseNumber,
        licenseNumber: form.licenseNumber,
        shopName: form.shopName,
        mobile: form.mobile,
        aadhaarNumber: form.aadhaarNumber,
        shopAddress: form.shopAddress,
        district: form.district,
        village: form.village,
        pinCode: form.pinCode,
      });
      setSuccess(true);
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Registration failed. Please try again.';
      if (errMsg.toLowerCase().includes('already')) {
        navigate('/login');
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative min-h-screen flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${subBg})` }} />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
          <CheckCircle size={48} style={{ color: '#16a34a', margin: '0 auto 12px' }} />
          <h2 className="text-xl font-bold text-green-700 mb-3">Application Submitted!</h2>
          <p className="text-gray-600 text-sm mb-2">Your retailer registration has been submitted successfully.</p>
          <p className="text-gray-600 text-sm mb-2">
            Your account status is now <strong>Pending Agriculture Officer Approval</strong>.
            You will be notified once your application is reviewed.
          </p>
          <p className="text-xs text-gray-400 mt-3">This process typically takes 1–3 working days.</p>
          <button className="r-btn r-btn-primary mt-6" onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      </div>
    );
  }

  const field = (label, name, type = 'text', placeholder = '', extra = {}) => (
    <div className="r-form-group">
      <label>{label}</label>
      <input
        className="r-input"
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        required
        {...extra}
      />
    </div>
  );

  return (
    <div className="relative min-h-screen flex items-start justify-center py-8 px-4">
      {/* Background image */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${subBg})` }} />
      <div className="absolute inset-0 bg-black/40" />

      {/* Card */}
      <div className="relative z-10 w-full" style={{ maxWidth: 560 }}>
        <div className="r-auth-card">
          <div className="r-auth-logo">
            <FileText size={32} style={{ color: 'var(--r-green)' }} />
            <h1>SubsidyGuard</h1>
            <p>Retailer Registration</p>
          </div>

        {error && <div className="r-alert r-alert-danger" style={{ display:'flex', alignItems:'center', gap:8 }}><AlertCircle size={14} />{error}</div>}

        <form onSubmit={handleSubmit}>
          <p style={{ fontWeight: 700, color: 'var(--r-green)', marginBottom: 12, fontSize: '0.9rem', display:'flex', alignItems:'center', gap:6 }}><Store size={15} /> Shop Information</p>
          <div className="r-grid-2">
            {field('Shop Name', 'shopName', 'text', 'Enter shop name')}
            {field('Owner Name', 'ownerName', 'text', 'Enter owner full name')}
          </div>
          <div className="r-grid-2">
            {field('Retailer License Number', 'licenseNumber', 'text', 'e.g. LIC-2024-XXXXX')}
            {field('Aadhaar Number', 'aadhaarNumber', 'text', '12-digit Aadhaar', { maxLength: 12, pattern: '[0-9]{12}' })}
          </div>
          <div className="r-grid-2">
            {field('Mobile Number', 'mobile', 'tel', '10-digit mobile', { maxLength: 10, pattern: '[0-9]{10}' })}
            {field('Email Address', 'email', 'email', 'your@email.com')}
          </div>

          <hr className="r-divider" />
          <p style={{ fontWeight: 700, color: 'var(--r-green)', marginBottom: 12, fontSize: '0.9rem', display:'flex', alignItems:'center', gap:6 }}><MapPin size={15} /> Shop Address</p>

          <div className="r-form-group">
            <label>Shop Address</label>
            <textarea
              className="r-input"
              name="shopAddress"
              value={form.shopAddress}
              onChange={handleChange}
              placeholder="Full shop address"
              rows={2}
              required
              style={{ resize: 'vertical' }}
            />
          </div>
          <div className="r-grid-3">
            <div className="r-form-group">
              <label>District</label>
              <select className="r-select" name="district" value={form.district} onChange={handleChange} required>
                <option value="">Select District</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {field('Village / Town', 'village', 'text', 'Village or town name')}
            {field('PIN Code', 'pinCode', 'text', '6-digit PIN', { maxLength: 6, pattern: '[0-9]{6}' })}
          </div>

          <hr className="r-divider" />
          <p style={{ fontWeight: 700, color: 'var(--r-green)', marginBottom: 12, fontSize: '0.9rem', display:'flex', alignItems:'center', gap:6 }}><Lock size={15} /> Account Security</p>

          <div className="r-grid-2">
            {field('Password', 'password', 'password', 'Create a strong password')}
            {field('Confirm Password', 'confirmPassword', 'password', 'Re-enter password')}
          </div>

          <div className="r-form-group">
            <label>Upload License Document (Optional)</label>
            <input
              className="r-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => setLicenseDoc(e.target.files[0])}
              style={{ padding: '7px 14px' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--r-text-muted)' }}>PDF, JPG, or PNG — max 5MB</span>
          </div>

          <button className="r-btn r-btn-primary r-btn-full" type="submit" disabled={loading} style={{ marginTop: 8, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {loading ? <><Loader2 size={15} className="animate-spin" /> Submitting…</> : <><FileText size={15} /> Register</>}
          </button>
        </form>

        <div className="r-auth-footer" style={{ marginTop: 16 }}>
          <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>
            Already have an account? <span style={{ color: 'var(--r-green)' }}>Sign In</span>
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}
