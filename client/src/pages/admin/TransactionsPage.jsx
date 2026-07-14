import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

import { Search, Eye, X } from 'lucide-react';
import api from '../../api.js';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filters, setFilters]           = useState({ crop_type: '', fertilizer_type: '', status: '', from_date: '', to_date: '' });
  const [selected, setSelected]         = useState(null);

  useEffect(() => { 
    fetchTransactions(); 
    
    const socketURL = import.meta.env.VITE_API_URL || window.location.origin;
    const socket = io(socketURL);
    socket.on('transaction_new', () => fetchTransactions());
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    let result = transactions;
    if (search) result = result.filter(t =>
      t.farmerAadhaar?.includes(search) ||
      t.farmerName?.toLowerCase().includes(search.toLowerCase()) ||
      t.retailerId?.toLowerCase().includes(search.toLowerCase()) ||
      t.cropType?.toLowerCase().includes(search.toLowerCase())
    );
    if (filters.crop_type)      result = result.filter(t => t.cropType?.toLowerCase() === filters.crop_type.toLowerCase());
    if (filters.fertilizer_type)result = result.filter(t => t.fertilizerType === filters.fertilizer_type);
    if (filters.status)         result = result.filter(t => t.status === filters.status);
    if (filters.from_date)      result = result.filter(t => new Date(t.timestamp) >= new Date(filters.from_date));
    if (filters.to_date)        result = result.filter(t => new Date(t.timestamp) <= new Date(filters.to_date + 'T23:59:59'));
    setFiltered(result);
  }, [search, filters, transactions]);

  const fetchTransactions = async () => {
    try {
      const res = await api.get(`/api/admin/stats`);
      setTransactions(res.data.transactions || []);
      setFiltered(res.data.transactions || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const statusBadge = s => {
    const map   = { GREEN: 'bg-green-100 text-green-700', YELLOW: 'bg-yellow-100 text-yellow-700', RED: 'bg-red-100 text-red-700', BLOCKED: 'bg-gray-200 text-gray-700' };
    const label = { GREEN: 'APPROVED', YELLOW: 'WARNING', RED: 'FLAGGED', BLOCKED: 'BLOCKED' };
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${map[s] || map.BLOCKED}`}>{label[s] || s}</span>;
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading transactions...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500 text-sm mt-1">All fertilizer purchase transactions including blocked attempts</p>
      </div>

      {/* Search + Filters */}
      <div className="card mb-6">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input className="input-field pl-9 text-sm" placeholder="Search Aadhaar, Name, Retailer, Crop..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field text-sm w-36" value={filters.crop_type}
            onChange={e => setFilters({ ...filters, crop_type: e.target.value })}>
            <option value="">All Crops</option>
            {['paddy','wheat','cotton','maize','sugarcane','groundnut','soybean','sunflower'].map(c =>
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <select className="input-field text-sm w-40" value={filters.fertilizer_type}
            onChange={e => setFilters({ ...filters, fertilizer_type: e.target.value })}>
            <option value="">All Fertilizers</option>
            {['Urea','DAP','MOP','SSP','NPK (10-26-26)','NPK (12-32-16)','Zinc Sulphate','Ammonium Sulphate'].map(f =>
              <option key={f}>{f}</option>)}
          </select>
          <select className="input-field text-sm w-36" value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All Status</option>
            <option value="GREEN">Approved</option>
            <option value="YELLOW">Warning</option>
            <option value="RED">Flagged</option>
            <option value="BLOCKED">Blocked</option>
          </select>
          <input type="date" className="input-field text-sm w-36" value={filters.from_date}
            onChange={e => setFilters({ ...filters, from_date: e.target.value })} />
          <input type="date" className="input-field text-sm w-36" value={filters.to_date}
            onChange={e => setFilters({ ...filters, to_date: e.target.value })} />
          <button onClick={() => { setSearch(''); setFilters({ crop_type: '', fertilizer_type: '', status: '', from_date: '', to_date: '' }); }}
            className="btn btn-secondary text-sm"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-gray-400 mt-2">{filtered.length} transactions found</p>
      </div>

      {/* Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
                <th className="p-3">Time</th>
                <th className="p-3">Farmer</th>
                <th className="p-3">Retailer</th>
                <th className="p-3">Crop / Fertilizer</th>
                <th className="p-3">Requested</th>
                <th className="p-3">Recommended</th>
                <th className="p-3">AI Fraud %</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(t => (
                <tr key={t.transactionId}
                  className={`hover:bg-gray-50 ${t.status === 'BLOCKED' ? 'opacity-70' : ''}`}>
                  <td className="p-3 text-gray-500 text-xs">{new Date(t.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className="p-3">
                    <p className="font-medium text-gray-800 text-xs">{t.farmerName || '—'}</p>
                    <p className="text-gray-400 text-xs font-mono">...{t.farmerAadhaar?.slice(-4)}</p>
                  </td>
                  <td className="p-3 text-gray-700 text-xs">{t.retailerId}</td>
                  <td className="p-3">
                    <span className="capitalize text-gray-700">{t.cropType}</span>
                    <span className="text-gray-400"> / {t.fertilizerType}</span>
                  </td>
                  <td className="p-3 font-medium text-gray-700">{t.quantity} kg</td>
                  <td className="p-3 text-gray-400">{t.status === 'BLOCKED' ? '—' : `${t.recommendedQuantity} kg`}</td>
                  <td className="p-3">
                    {t.fraudProbability != null
                      ? <span className={`font-bold text-xs ${t.fraudProbability >= 65 ? 'text-red-600' : t.fraudProbability >= 35 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {t.fraudProbability}%
                        </span>
                      : <span className="text-gray-400 text-xs">—</span>}
                  </td>
                  <td className="p-3 text-center">{statusBadge(t.status)}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => setSelected(t)} className="text-blue-600 hover:text-blue-800">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="9" className="p-8 text-center text-gray-400">No transactions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="font-bold text-gray-900">Transaction Details</h2>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-5 space-y-2 text-sm">
              {[
                ['Transaction ID',    selected.transactionId],
                ['Farmer Name',       selected.farmerName || '—'],
                ['Farmer Aadhaar',    selected.farmerAadhaar],
                ['Retailer ID',       selected.retailerId],
                ['Village',           selected.village || '—'],
                ['Crop Type',         selected.cropType],
                ['Fertilizer',        selected.fertilizerType],
                ['Requested Qty',     `${selected.quantity} kg`],
                ['Recommended Qty',   selected.status === 'BLOCKED' ? '—' : `${selected.recommendedQuantity} kg`],
                ['AI Fraud %',        selected.fraudProbability != null ? `${selected.fraudProbability}%` : '—'],
                ['Status',            selected.status],
                ['Reason',            selected.reason || '—'],
                ['Timestamp',         new Date(selected.timestamp).toLocaleString()],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-800 text-right max-w-[60%]">{value}</span>
                </div>
              ))}
              <div className="flex justify-between pt-1">
                <span className="text-gray-500">Status Badge</span>
                <div>{statusBadge(selected.status)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
