import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

import { Search, ShieldAlert, CheckCircle2, XCircle, Eye, X, Send } from 'lucide-react';
import api from '../../api.js';

const API = `${import.meta.env.VITE_API_URL || ''}/api/admin`;

export default function RetailerManagementPage() {
  const [retailers, setRetailers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [selectedInventory, setSelectedInventory] = useState([]);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suspendModal, setSuspendModal] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendRemarks, setSuspendRemarks] = useState('');
  const [newNote, setNewNote] = useState('');

  const fetchData = async () => {
    try {
      const [riskRes, statsRes] = await Promise.all([
        api.get(`/api/admin/retailer-risk`),
        api.get(`/api/admin/stats`)
      ]);
      setRetailers(riskRes.data.rankings);
      setFiltered(riskRes.data.rankings.filter(r => (r.retailerId || '').toLowerCase().includes(search.toLowerCase())));
      setTxns(statsRes.data.transactions);
      
      // Update selected modal data if it's open
      if (selected) {
        const updated = riskRes.data.rankings.find(r => r.retailerId === selected.retailerId);
        if (updated) setSelected(updated);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchData(); 
    
    const socketURL = import.meta.env.VITE_API_URL || window.location.origin;
    const socket = io(socketURL);
    
    const refresh = () => fetchData();
    socket.on('transaction_new', refresh);
    socket.on('cluster_alert_new', refresh);
    socket.on('inventory_updated', refresh);

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    setFiltered(retailers.filter(r => (r.retailerId || '').toLowerCase().includes(search.toLowerCase())));
  }, [search, retailers]);

  useEffect(() => {
    if (selected && selected.userId) {
      api.get(`/api/inventory/${selected.userId}`)
        .then(res => setSelectedInventory(res.data.inventory || []))
        .catch(err => console.error('Failed to fetch inventory', err));
    }
  }, [selected]);

  const getRetailerTxns = (id) => txns.filter(t => t.retailerId === id);

  const handleSuspendConfirm = async () => {
    if (!suspendModal) return;
    try {
      const res = await api.patch(`/api/admin/retailer-suspend/${suspendModal.retailerId}`, {
        reason: suspendReason,
        remarks: suspendRemarks
      });
      setRetailers(prev => prev.map(r => r.retailerId === suspendModal.retailerId ? { ...r, status: res.data.status, officerNotes: res.data.officerNotes } : r));
      setSuspendModal(null);
      setSuspendReason('');
      setSuspendRemarks('');
    } catch (e) {
      console.error(e);
      alert('Failed to toggle suspension.');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selected) return;
    try {
      const res = await api.patch(`/api/admin/retailer-notes/${selected.retailerId}`, { note: newNote, officerName: 'Agriculture Officer' });
      setSelected(prev => ({ ...prev, officerNotes: res.data.officerNotes }));
      setRetailers(prev => prev.map(r => r.retailerId === selected.retailerId ? { ...r, officerNotes: res.data.officerNotes } : r));
      setNewNote('');
    } catch (e) {
      console.error(e);
      alert('Failed to add note.');
    }
  };

  const riskBadge = (level) => {
    if (level === 'HIGH RISK') return <span className="inline-block whitespace-nowrap px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700">{level}</span>;
    if (level === 'MEDIUM RISK') return <span className="inline-block whitespace-nowrap px-2 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-700">{level}</span>;
    return <span className="inline-block whitespace-nowrap px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">{level}</span>;
  };

  if (loading && retailers.length === 0) return <div className="p-8 text-center text-gray-500">Loading retailers...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Retailer Management</h1>
        <p className="text-gray-500 text-sm mt-1">Monitor and manage fertilizer retailers</p>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input className="input-field pl-9 text-sm" placeholder="Search retailer ID..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead><tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
              <th className="p-3">Retailer ID</th>
              <th className="p-3">Shop Name</th>
              <th className="p-3">District</th>
              <th className="p-3">Total</th>
              <th className="p-3 text-green-600">Approved</th>
              <th className="p-3 text-yellow-600">Yellow</th>
              <th className="p-3 text-red-600">Red</th>
              <th className="p-3">Fraud %</th>
              <th className="p-3">Avg AI Score</th>
              <th className="p-3">Risk Score</th>
              <th className="p-3">Risk Level</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-center">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(r => (
                <tr key={r.retailerId} className="hover:bg-gray-50">
                  <td className="p-3 font-semibold text-gray-800">{r.retailerId}</td>
                  <td className="p-3">{r.shopName}</td>
                  <td className="p-3">{r.district}</td>
                  <td className="p-3 font-bold">{r.total}</td>
                  <td className="p-3 text-green-700">{r.approved}</td>
                  <td className="p-3 text-yellow-700">{r.yellow}</td>
                  <td className="p-3 text-red-700">{r.red}</td>
                  <td className="p-3 font-bold">{r.fraudPercentage}%</td>
                  <td className="p-3 text-purple-700">{r.avgFraudProbability != 0 ? `${r.avgFraudProbability}%` : '—'}</td>
                  <td className="p-3 font-bold text-gray-900">{r.retailerRiskScore}</td>
                  <td className="p-3">{riskBadge(r.riskLevel)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${r.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {r.status === 'SUSPENDED' ? 'Suspended' : (r.status || 'Active')}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setSelected(r)} className="text-blue-600 hover:text-blue-800"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => r.status === 'SUSPENDED' ? setSuspendModal(r) : setSuspendModal(r)}
                        className={`${r.status === 'SUSPENDED' ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}>
                        {r.status === 'SUSPENDED' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="13" className="p-6 text-center text-gray-400">No retailers found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suspend Confirmation Modal */}
      {suspendModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="font-bold text-gray-900">
                {suspendModal.status === 'SUSPENDED' ? 'Reactivate Retailer' : 'Suspend Retailer'}
              </h2>
              <button onClick={() => setSuspendModal(null)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-4">
                {suspendModal.status === 'SUSPENDED' 
                  ? `Are you sure you want to reactivate ${suspendModal.shopName}?` 
                  : `Are you sure you want to suspend ${suspendModal.shopName}? Suspended retailers cannot log in until reactivated.`}
              </p>
              <div className="space-y-3">
                <div className="r-form-group">
                  <label className="text-xs font-bold text-gray-700">Reason</label>
                  <input className="input-field" value={suspendReason} onChange={e => setSuspendReason(e.target.value)} placeholder="e.g. Cluster fraud detected" />
                </div>
                <div className="r-form-group">
                  <label className="text-xs font-bold text-gray-700">Remarks</label>
                  <textarea className="input-field" rows="2" value={suspendRemarks} onChange={e => setSuspendRemarks(e.target.value)} placeholder="Additional details..." />
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2 rounded-b-xl">
              <button className="btn bg-white border" onClick={() => setSuspendModal(null)}>Cancel</button>
              <button className={`btn text-white ${suspendModal.status === 'SUSPENDED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`} onClick={handleSuspendConfirm}>
                {suspendModal.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retailer Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b bg-white">
              <div>
                <h2 className="font-bold text-xl text-gray-900">{selected.shopName}</h2>
                <p className="text-xs text-gray-500 mt-1">Retailer Profile &mdash; {selected.retailerId}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="card">
                    <h3 className="font-bold text-gray-800 border-b pb-2 mb-3">Shop Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Owner</span><span className="font-medium text-gray-900">{selected.ownerName}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">License</span><span className="font-medium text-gray-900">{selected.licenseNumber}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Mobile</span><span className="font-medium text-gray-900">{selected.mobile || 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium text-gray-900">{selected.email || 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">District</span><span className="font-medium text-gray-900">{selected.district}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Village</span><span className="font-medium text-gray-900">{selected.village}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Registered</span><span className="font-medium text-gray-900">{new Date(selected.registrationDate).toLocaleDateString()}</span></div>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t">
                        <span className="text-gray-500">Status</span>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${selected.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {selected.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="font-bold text-gray-800 border-b pb-2 mb-3">Officer Notes</h3>
                    <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1">
                      {selected.officerNotes?.length > 0 ? selected.officerNotes.map((n, i) => (
                        <div key={i} className="bg-blue-50 p-2 rounded border border-blue-100 text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-blue-900 text-xs">{n.officerName}</span>
                            <span className="text-[10px] text-blue-400">{new Date(n.timestamp).toLocaleString([], { dateStyle:'short', timeStyle:'short' })}</span>
                          </div>
                          <p className="text-gray-700 text-xs">{n.note}</p>
                        </div>
                      )) : <p className="text-xs text-gray-400 italic">No notes added yet.</p>}
                    </div>
                    <div className="flex gap-2">
                      <input className="input-field text-xs py-1.5" value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Type a note..." />
                      <button className="btn btn-primary p-1.5" onClick={handleAddNote}><Send className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-6">
                  
                  <div className="card">
                    <h3 className="font-bold text-gray-800 border-b pb-2 mb-3 flex items-center justify-between">
                      Performance
                      {riskBadge(selected.riskLevel)}
                    </h3>
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Total Txns</p><p className="text-xl font-bold text-gray-900">{selected.total}</p></div>
                      <div className="bg-green-50 p-3 rounded-lg"><p className="text-xs text-green-600">Approved</p><p className="text-xl font-bold text-green-800">{selected.approved}</p></div>
                      <div className="bg-yellow-50 p-3 rounded-lg"><p className="text-xs text-yellow-600">Yellow</p><p className="text-xl font-bold text-yellow-800">{selected.yellow}</p></div>
                      <div className="bg-red-50 p-3 rounded-lg"><p className="text-xs text-red-600">Red</p><p className="text-xl font-bold text-red-800">{selected.red}</p></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-l-orange-400"><p className="text-xs text-gray-500">Fraud Percentage</p><p className="text-lg font-bold text-gray-900">{selected.fraudPercentage}%</p></div>
                      <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-l-purple-400"><p className="text-xs text-gray-500">Avg AI Score</p><p className="text-lg font-bold text-gray-900">{selected.avgFraudProbability != 0 ? `${selected.avgFraudProbability}%` : '—'}</p></div>
                      <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-l-blue-500"><p className="text-xs text-gray-500">Risk Score</p><p className="text-lg font-bold text-gray-900">{selected.retailerRiskScore} / 100</p></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="card">
                      <h3 className="font-bold text-gray-800 border-b pb-2 mb-3">Cluster Alerts ({selected.clusterAlerts?.length || 0})</h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selected.clusterAlerts?.length > 0 ? selected.clusterAlerts.map((c, i) => (
                          <div key={i} className="flex justify-between items-center text-xs border-b pb-2 border-red-100 bg-red-50 p-2 rounded">
                            <div>
                              <p className="font-bold text-red-800">{c.type}</p>
                              <p className="text-red-600">{new Date(c.detectedAt).toLocaleDateString()}</p>
                            </div>
                            <span className="font-bold text-red-700">{c.severity}</span>
                          </div>
                        )) : <p className="text-gray-400 text-sm">No cluster alerts.</p>}
                      </div>
                    </div>

                    <div className="card">
                      <h3 className="font-bold text-gray-800 border-b pb-2 mb-3">Inventory Summary</h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {selectedInventory.length > 0 ? selectedInventory.map((inv, i) => {
                          const isLow = inv.available <= inv.threshold;
                          return (
                            <div key={i} className={`flex justify-between items-center text-xs border-b pb-2 ${isLow ? 'bg-red-50 border-red-100 p-2 rounded' : ''}`}>
                              <span className={`font-semibold ${isLow ? 'text-red-900' : 'text-gray-700'}`}>{inv.fertilizer}</span>
                              <div className="text-right">
                                <p className={`font-bold ${isLow ? 'text-red-700' : 'text-gray-900'}`}>{inv.available} kg</p>
                                {isLow && <p className="text-[10px] text-red-500">Low Stock!</p>}
                              </div>
                            </div>
                          );
                        }) : <p className="text-gray-400 text-sm">No inventory data.</p>}
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="font-bold text-gray-800 border-b pb-2 mb-3">Recent Transactions</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {getRetailerTxns(selected.retailerId).slice(0, 10).map(t => (
                        <div key={t.transactionId} className="flex justify-between items-center text-xs border-b pb-2">
                          <span className="text-gray-600 truncate mr-2 flex-1">{t.transactionId}</span>
                          <span className={`px-1.5 py-0.5 font-bold rounded-sm ${t.status === 'GREEN' ? 'bg-green-100 text-green-700' : t.status === 'YELLOW' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{t.status}</span>
                        </div>
                      ))}
                      {getRetailerTxns(selected.retailerId).length === 0 && <p className="text-gray-400 text-sm">No transactions</p>}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
