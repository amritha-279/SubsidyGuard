import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, AlertTriangle, ShieldAlert, CheckCircle2, Info, Users } from 'lucide-react';

const API = `\${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin`;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const [statsRes, clusterRes, stateRes] = await Promise.all([
        axios.get(`${API}/stats`),
        axios.get(`${API}/clusters`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/ADMIN`)
      ]);
      const notifs = [];
      const states = stateRes.data.states || [];
      const stateMap = {};
      states.forEach(s => { stateMap[s.notificationId] = s; });

      clusterRes.data.clusters.forEach(c => {
        if (stateMap[c.alertId]?.isDeleted) return;
        notifs.push({ id: c.alertId, type: 'cluster', title: 'Cluster Fraud Detected', message: `${c.farmersInvolved} farmers at ${c.retailerId} in ${c.village}`, time: c.detectedAt, read: stateMap[c.alertId]?.isRead || false });
      });

      statsRes.data.transactions.filter(t => t.status === 'RED').slice(0, 5).forEach(t => {
        if (stateMap[t.transactionId]?.isDeleted) return;
        notifs.push({ id: t.transactionId, type: 'blocked', title: 'Transaction Blocked', message: `${t.quantity} bags by farmer ...${t.farmerAadhaar?.slice(-4)} at ${t.retailerId}`, time: t.timestamp, read: stateMap[t.transactionId]?.isRead || false });
      });

      statsRes.data.transactions.filter(t => t.fraudProbability >= 65).slice(0, 5).forEach(t => {
        const id = `ai_${t.transactionId}`;
        if (stateMap[id]?.isDeleted) return;
        notifs.push({ id, type: 'ai', title: 'High AI Fraud Score', message: `${t.fraudProbability}% fraud probability detected — ${t.retailerId}`, time: t.timestamp, read: stateMap[id]?.isRead || false });
      });

      if (!stateMap['sys1']?.isDeleted) {
        notifs.push({ id: 'sys1', type: 'system', title: 'System Running', message: 'SubsidyGuard ML service is active and monitoring transactions', time: new Date(), read: stateMap['sys1']?.isRead || true });
      }

      setNotifications(notifs.sort((a, b) => new Date(b.time) - new Date(a.time)));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const markRead = async (id) => {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/ADMIN/${id}`, { isRead: true });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) { console.error('Failed to mark read', e); }
  };

  const markAllRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length === 0) return;
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/notifications/ADMIN/mark-all-read`, { notificationIds: unreadIds });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) { console.error('Failed to mark all read', e); }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'cluster': return <Users className="w-5 h-5 text-red-500" />;
      case 'blocked': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'ai': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const unread = notifications.filter(n => !n.read).length;

  if (loading) return <div className="p-8 text-center text-gray-500">Loading notifications...</div>;

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6" /> Notifications
            {unread > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unread}</span>}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Real-time fraud alerts and system notifications</p>
        </div>
        {unread > 0 && <button onClick={markAllRead} className="btn btn-secondary text-sm">Mark all read</button>}
      </div>

      <div className="space-y-3">
        {notifications.map(n => (
          <div key={n.id} onClick={() => markRead(n.id)}
            className={`card cursor-pointer hover:shadow-md transition-all border-l-4 ${n.read ? 'border-l-gray-200 opacity-70' : n.type === 'cluster' || n.type === 'blocked' ? 'border-l-red-500' : n.type === 'ai' ? 'border-l-yellow-500' : 'border-l-blue-500'}`}>
            <div className="flex items-start gap-4">
              <div className="mt-0.5">{getIcon(n.type)}</div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className={`font-semibold text-sm ${n.read ? 'text-gray-600' : 'text-gray-900'}`}>{n.title}</p>
                  <span className="text-xs text-gray-400">{new Date(n.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
              </div>
              {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />}
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="card text-center py-12">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}


