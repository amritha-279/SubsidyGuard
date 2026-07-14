import { useState, useEffect } from 'react';
import { Settings, User, Lock, Bell, Sliders, Save, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const token = JSON.parse(localStorage.getItem('subsidy_user') || '{}').token;

  const [profile, setProfile] = useState({ name: '', email: '', mobile: '', district: '' });
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [thresholds, setThresholds] = useState({ yellowThreshold: 1.0, redThreshold: 1.5, clusterWindow: 60, clusterCount: 3, frequentDays: 30, frequentCount: 2 });
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setProfile({
          name:     data.name     || '',
          email:    data.email    || '',
          mobile:   data.mobile   || '',
          district: data.district || '',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const flash = (section) => { setSaved(section); setTimeout(() => setSaved(''), 2500); };

  const handleSaveProfile = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(profile),
    });
    if (!res.ok) { alert('Failed to save profile.'); return; }
    const stored = JSON.parse(localStorage.getItem('subsidy_user') || '{}');
    localStorage.setItem('subsidy_user', JSON.stringify({ ...stored, name: profile.name }));
    flash('profile');
  };

  const handleSavePassword = async () => {
    if (passwords.newPass !== passwords.confirm) { alert('Passwords do not match.'); return; }
    if (passwords.newPass.length < 6) { alert('Minimum 6 characters required.'); return; }
    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Failed to change password.'); return; }
    setPasswords({ current: '', newPass: '', confirm: '' });
    flash('password');
  };

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Settings className="w-6 h-6" /> Settings</h1>
        <p className="text-gray-500 text-sm mt-1">System configuration and preferences</p>
      </div>

      <div className="space-y-6">

        {/* Officer Profile */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><User className="w-5 h-5 text-blue-600" /> Officer Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[['Full Name', 'name', 'text'], ['Email', 'email', 'email'], ['Mobile Number', 'mobile', 'tel'], ['District', 'district', 'text']].map(([label, key, type]) => (
              <div key={key}>
                <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
                <input
                  type={type}
                  className="input-field text-sm"
                  value={profile[key]}
                  onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={`Enter ${label.toLowerCase()}`}
                />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Role</label>
              <input className="input-field text-sm bg-gray-50" value="Agriculture Officer" disabled />
            </div>
          </div>
          <button onClick={handleSaveProfile} className="btn btn-primary text-sm mt-4 gap-2">
            <Save className="w-4 h-4" />{saved === 'profile' ? 'Saved!' : 'Save Profile'}
          </button>
        </div>

        {/* Password */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-blue-600" /> Change Password</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[['Current Password', 'current'], ['New Password', 'newPass'], ['Confirm Password', 'confirm']].map(([label, key]) => (
              <div key={key}>
                <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
                <input type="password" className="input-field text-sm" value={passwords[key]}
                  onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <button onClick={handleSavePassword} className="btn btn-primary text-sm mt-4 gap-2">
            <Save className="w-4 h-4" />{saved === 'password' ? 'Password Updated!' : 'Update Password'}
          </button>
        </div>

        {/* Risk Thresholds */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Sliders className="w-5 h-5 text-blue-600" /> Risk Threshold Settings</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              ['Yellow Threshold (ratio)', 'yellowThreshold', 'e.g. 1.0 = 100% of recommended'],
              ['Red Threshold (ratio)',    'redThreshold',    'e.g. 1.5 = 150% of recommended'],
              ['Cluster Window (mins)',    'clusterWindow',   'Time window for cluster detection'],
              ['Cluster Min Transactions','clusterCount',     'Min flagged txns to trigger cluster'],
              ['Frequent Purchase Days',  'frequentDays',    'Days window for frequency check'],
              ['Frequent Purchase Count', 'frequentCount',   'Max purchases allowed in window'],
            ].map(([label, key, hint]) => (
              <div key={key}>
                <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
                <input type="number" step="0.1" className="input-field text-sm" value={thresholds[key]}
                  onChange={e => setThresholds(t => ({ ...t, [key]: parseFloat(e.target.value) }))} />
                <p className="text-xs text-gray-400 mt-1">{hint}</p>
              </div>
            ))}
          </div>
          <button onClick={() => flash('thresholds')} className="btn btn-primary text-sm mt-4 gap-2">
            <Save className="w-4 h-4" />{saved === 'thresholds' ? 'Saved!' : 'Save Thresholds'}
          </button>
        </div>

        {/* OTP Settings */}
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-blue-600" /> OTP & Notification Settings</h3>
          <div className="space-y-3">
            {[['Enable OTP for YELLOW transactions', true], ['Enable OTP for RED transactions', true],
              ['Send email alerts for cluster fraud', true], ['Send SMS notifications', false]].map(([label, def], i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm text-gray-700">{label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={def} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
            ))}
          </div>
          <button onClick={() => flash('otp')} className="btn btn-primary text-sm mt-4 gap-2">
            <Save className="w-4 h-4" />{saved === 'otp' ? 'Saved!' : 'Save Settings'}
          </button>
        </div>

      </div>
    </div>
  );
}
