import { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, XCircle, Check, Trash2 } from 'lucide-react';
import axios from 'axios';

const TABS = [['all', 'All'], ['unread', 'Unread'], ['approval', 'Approvals'], ['stock', 'Stock Alerts']];

function txnToNotif(t) {
  if (t.status === 'GREEN') return { id: t.id, type: 'approval', icon: CheckCircle, title: 'Transaction Approved', desc: `${t.transactionId} — ${t.fertilizerType} ${t.quantity}kg approved.`, time: new Date(t.timestamp).toLocaleString(), read: true, color: 'text-green-600', bg: 'bg-green-50' };
  if (t.status === 'YELLOW') return { id: t.id, type: 'approval', icon: AlertTriangle, title: 'Transaction Pending OTP', desc: `${t.transactionId} — ${t.fertilizerType} ${t.quantity}kg requires OTP verification.`, time: new Date(t.timestamp).toLocaleString(), read: false, color: 'text-yellow-600', bg: 'bg-yellow-50' };
  return { id: t.id, type: 'approval', icon: XCircle, title: 'Transaction Blocked', desc: `${t.transactionId} — ${t.fertilizerType} ${t.quantity}kg blocked. ${t.reason || ''}`, time: new Date(t.timestamp).toLocaleString(), read: false, color: 'text-red-600', bg: 'bg-red-50' };
}

export default function RetailerNotifications() {
  const [notifs, setNotifs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const { id: retailerId } = JSON.parse(localStorage.getItem('retailer_user') || '{}');

  useEffect(() => {
    if (!retailerId) return;
    Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL || ''}/api/admin/stats', { params: { retailer_id: retailerId } }),
      axios.get(`${import.meta.env.VITE_API_URL || ''}/api/notifications/${retailerId}`)
    ]).then(([res, stateRes]) => {
      const states = stateRes.data.states || [];
      const stateMap = {};
      states.forEach(s => { stateMap[s.notificationId] = s; });

      const builtNotifs = [];
      (res.data.transactions || []).forEach(t => {
        if (stateMap[t.transactionId]?.isDeleted) return;
        const n = txnToNotif(t);
        if (stateMap[t.transactionId]) {
          n.read = stateMap[t.transactionId].isRead;
        }
        builtNotifs.push(n);
      });
      setNotifs(builtNotifs);
    })
    .catch(() => {})
    .finally(() => setLoading(false));
  }, [retailerId]);

  const unread = notifs.filter(n => !n.read).length;
  const filtered = notifs.filter(n => filter === 'all' ? true : filter === 'unread' ? !n.read : n.type === filter);

  const markRead = async id => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL || ''}/api/notifications/${retailerId}/${id}`, { isRead: true });
      setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) { console.error('Failed to mark read', e); }
  };
  
  const markAllRead = async () => {
    try {
      const unreadIds = notifs.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length === 0) return;
      await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/notifications/${retailerId}/mark-all-read`, { notificationIds: unreadIds });
      setNotifs(p => p.map(n => ({ ...n, read: true })));
    } catch (e) { console.error('Failed to mark all read', e); }
  };
  
  const del = async id => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL || ''}/api/notifications/${retailerId}/${id}`, { isDeleted: true });
      setNotifs(p => p.filter(n => n.id !== id));
    } catch (e) { console.error('Failed to delete', e); }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">Stay updated on approvals, stock alerts, and system messages.</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="btn btn-secondary gap-2 text-sm">
            <Check className="w-4 h-4" /> Mark All as Read
          </button>
        )}
      </div>

      <div className="card mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          {TABS.map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === val ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {label}
              {val === 'unread' && unread > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{unread}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No notifications found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(n => {
              const Icon = n.icon;
              return (
                <div key={n.id} className={`flex items-start gap-4 py-4 px-2 rounded-lg ${!n.read ? 'bg-blue-50/40' : ''}`}>
                  <div className={`p-2 ${n.bg} rounded-lg flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${n.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{n.desc}</p>
                    <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!n.read && (
                      <button onClick={() => markRead(n.id)} className="btn btn-secondary text-xs py-1 px-2 gap-1">
                        <Check className="w-3 h-3" /> Read
                      </button>
                    )}
                    <button onClick={() => del(n.id)} className="btn btn-secondary text-xs py-1 px-2 text-red-500 hover:bg-red-50">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
