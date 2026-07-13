import { useState, useEffect } from 'react';
import { User, X } from 'lucide-react';

export default function RetailerProfile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [pwModal, setPwModal] = useState(false);
  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = JSON.parse(localStorage.getItem('retailer_user') || '{}').token;

  useEffect(() => {
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setProfile(data); setEditForm(data); })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(editForm),
    });
    if (!res.ok) { alert('Failed to save. Please try again.'); return; }
    // update localStorage so sidebar reflects new name/shop
    const stored = JSON.parse(localStorage.getItem('retailer_user') || '{}');
    localStorage.setItem('retailer_user', JSON.stringify({ ...stored, ...editForm }));
    setProfile(editForm); setEditing(false);
    setSaved(true); setTimeout(() => setSaved(false), 3000);
  };

  const handlePwSave = async () => {
    if (pw.newPw !== pw.confirm) { alert('Passwords do not match.'); return; }
    if (pw.newPw.length < 6) { alert('Minimum 6 characters required.'); return; }
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.newPw }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Failed to change password.'); return; }
    setPwModal(false); setPw({ current: '', newPw: '', confirm: '' });
    alert('Password changed successfully.');
  };

  const labelCls = 'text-xs font-medium text-gray-600 mb-1 block';
  const inputCls = 'input-field text-sm';

  if (loading) return <div className="p-8 text-gray-500">Loading profile...</div>;
  if (!profile) return <div className="p-8 text-red-500">Failed to load profile.</div>;

  const initials = (profile.name || 'R').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">View and manage your retailer account details.</p>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 mb-4">
          ✓ Profile updated successfully.
        </div>
      )}

      <div className="card">
        <div className="flex items-center gap-5 mb-6 pb-6 border-b">
          <div className="w-16 h-16 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile.shopName || profile.shopId || '—'}</h2>
            <p className="text-gray-500 text-sm mt-0.5">{profile.name} · {profile.district}</p>
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
              ✓ {profile.status}
            </span>
          </div>
        </div>

        {!editing ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-6">
              {[['Shop Name', profile.shopName], ['Owner Name', profile.name], ['License Number', profile.shopId],
                ['Mobile', profile.mobile], ['Email', profile.email], ['District', profile.district],
                ['Village', profile.village], ['PIN Code', profile.pinCode]].map(([l, v]) => (
                <div key={l}>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{l}</p>
                  <p className="font-medium text-gray-900 mt-0.5">{v || '—'}</p>
                </div>
              ))}
              <div className="col-span-2 md:col-span-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Shop Address</p>
                <p className="font-medium text-gray-900 mt-0.5">{profile.shopAddress || '—'}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="btn btn-primary text-sm gap-2" onClick={() => { setEditing(true); setEditForm(profile); }}>
                <User className="w-4 h-4" /> Edit Profile
              </button>
              <button className="btn btn-secondary text-sm" onClick={() => setPwModal(true)}>
                🔐 Change Password
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {[['Shop Name', 'shopName'], ['Owner Name', 'name'], ['Mobile', 'mobile'],
                ['Email', 'email'], ['District', 'district'], ['Village', 'village'], ['PIN Code', 'pinCode']].map(([label, name]) => (
                <div key={name}>
                  <label className={labelCls}>{label}</label>
                  <input className={inputCls} name={name} value={editForm[name] || ''}
                    onChange={e => setEditForm(f => ({ ...f, [name]: e.target.value }))} />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className={labelCls}>Shop Address</label>
                <textarea className={inputCls} value={editForm.shopAddress || ''} rows={2} style={{ resize: 'vertical' }}
                  onChange={e => setEditForm(f => ({ ...f, shopAddress: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3">
              <button className="btn btn-primary text-sm" onClick={handleSave}>Save Changes</button>
              <button className="btn btn-secondary text-sm" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </>
        )}
      </div>

      {pwModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card max-w-sm w-full relative">
            <button onClick={() => setPwModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-bold text-gray-900 mb-4 border-b pb-3">Change Password</h3>
            {[['Current Password', 'current'], ['New Password', 'newPw'], ['Confirm New Password', 'confirm']].map(([label, name]) => (
              <div className="mb-3" key={name}>
                <label className={labelCls}>{label}</label>
                <input className={inputCls} type="password" value={pw[name]} onChange={e => setPw(p => ({ ...p, [name]: e.target.value }))} />
              </div>
            ))}
            <div className="flex gap-3 mt-4">
              <button className="btn btn-primary text-sm" onClick={handlePwSave}>Save</button>
              <button className="btn btn-secondary text-sm" onClick={() => setPwModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
