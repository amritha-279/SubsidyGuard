import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

import { AlertTriangle, ShieldAlert, Users, RefreshCw, TrendingUp, Repeat } from 'lucide-react';
import api from '../../api.js';

const API = `${import.meta.env.VITE_API_URL || ''}/api/admin`;

const CATEGORIES = {
  excess_high: { label: 'Quantity Exceeded', icon: TrendingUp, color: 'red' },
  frequent: { label: 'Frequent Purchase', icon: RefreshCw, color: 'yellow' },
  cluster: { label: 'Cluster Fraud', icon: Users, color: 'red' },
  excess: { label: 'High-Risk Retailer', icon: ShieldAlert, color: 'yellow' },
  ml_analysis: { label: 'AI Detected', icon: AlertTriangle, color: 'purple' },
};

export default function FraudAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    fetchAlerts(); 
    
    const socketURL = import.meta.env.VITE_API_URL || window.location.origin;
    const socket = io(socketURL);
    
    socket.on('transaction_new', () => {
      fetchAlerts();
    });
    
    socket.on('cluster_alert_new', () => {
      fetchAlerts();
    });

    return () => socket.disconnect();
  }, []);

  const fetchAlerts = async () => {
    try {
      const [statsRes, clusterRes] = await Promise.all([
        api.get(`/api/admin/stats`),
        api.get(`/api/admin/clusters`)
      ]);
      const flagged = statsRes.data.transactions.filter(t => t.status !== 'GREEN');
      setAlerts(flagged);
      setClusters(clusterRes.data.clusters);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const setStatus = async (id, status) => {
    try {
      await api.patch(`/api/admin/transaction-alert-status/${id}`, { status });
      setAlerts(prev => prev.map(a => a.transactionId === id ? { ...a, investigationStatus: status } : a));
    } catch (e) {
      console.error(e);
      alert('Failed to update status');
    }
  };

  const filtered = filter === 'all' ? alerts : filter === 'RED' ? alerts.filter(a => a.status === 'RED' || a.status === 'BLOCKED') : alerts.filter(a => a.status === 'YELLOW');

  if (loading) return <div className="p-8 text-center text-gray-500">Loading fraud alerts...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fraud Alerts</h1>
        <p className="text-gray-500 text-sm mt-1">All detected fraud patterns and anomalies</p>
      </div>

      {/* Category Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Blocked / Exceeded', count: alerts.filter(a => a.status === 'RED' || a.status === 'BLOCKED').length, color: 'red', icon: TrendingUp },
          { label: 'Frequent Purchase', count: alerts.filter(a => a.reason?.includes('Frequent') || a.reason?.includes('frequent')).length, color: 'yellow', icon: RefreshCw },
          { label: 'Cluster Fraud', count: clusters.length, color: 'red', icon: Users },
          { label: 'Warnings', count: alerts.filter(a => a.status === 'YELLOW').length, color: 'yellow', icon: AlertTriangle },
          { label: 'AI Flagged', count: alerts.filter(a => a.fraudProbability >= 65).length, color: 'purple', icon: ShieldAlert },
        ].map((c, i) => (
          <div key={i} className={`card border-l-4 border-l-${c.color}-500`}>
            <div className="flex items-center gap-3">
              <c.icon className={`w-6 h-6 text-${c.color}-500`} />
              <div><p className="text-xs text-gray-500">{c.label}</p><p className="text-xl font-bold">{c.count}</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* Cluster Alerts */}
      {clusters.length > 0 && (
        <div className="card mb-6 border-l-4 border-l-red-500">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Users className="w-5 h-5 text-red-500" /> Active Cluster Alerts</h3>
          <div className="space-y-3">
            {clusters.map(c => (
              <div key={c.alertId} className="flex items-center justify-between bg-red-50 p-3 rounded-lg">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{c.type} — {c.retailerId}</p>
                  <p className="text-xs text-gray-500">{c.village} | {c.farmersInvolved} farmers | {c.totalQuantity} bags</p>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded ${c.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'RED', 'YELLOW'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
            {f === 'all' ? 'All Alerts' : f === 'RED' ? 'Blocked/RED' : 'Warnings'}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filtered.map(t => {
          const currentStatus = t.investigationStatus || 'Open';
          return (
            <div key={t.transactionId} className={`card border-l-4 ${t.status === 'RED' || t.status === 'BLOCKED' ? 'border-l-red-500' : 'border-l-yellow-500'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className={`w-4 h-4 ${t.status === 'RED' || t.status === 'BLOCKED' ? 'text-red-500' : 'text-yellow-500'}`} />
                    <p className="font-semibold text-gray-900 text-sm">{t.reason}</p>
                    {t.fraudProbability != null && (
                      <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${t.fraudProbability >= 65 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {t.fraudProbability}% fraud confidence
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Farmer: ...{t.farmerAadhaar?.slice(-4)} | Retailer: {t.retailerId} | {t.quantity} bags {t.fertilizerType} ({t.cropType}) | {new Date(t.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select value={currentStatus} onChange={e => setStatus(t.transactionId, e.target.value)}
                    className="text-xs border rounded-lg px-2 py-1 text-gray-600">
                    <option>Open</option>
                    <option>Investigating</option>
                    <option>Closed</option>
                  </select>
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${t.status === 'RED' || t.status === 'BLOCKED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {t.status === 'RED' || t.status === 'BLOCKED' ? 'BLOCKED' : 'WARNING'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="card text-center py-12 text-gray-400">No fraud alerts found</div>}
      </div>
    </div>
  );
}
