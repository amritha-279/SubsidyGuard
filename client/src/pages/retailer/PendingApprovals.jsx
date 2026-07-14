import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, X } from 'lucide-react';
import axios from 'axios';

const statusBadge = s => {
  const m = { PENDING: 'bg-yellow-100 text-yellow-700', YELLOW: 'bg-yellow-100 text-yellow-700', GREEN: 'bg-green-100 text-green-700', RED: 'bg-red-100 text-red-700' };
  const icons = { PENDING: <Clock className="w-3 h-3" />, YELLOW: <Clock className="w-3 h-3" />, GREEN: <CheckCircle className="w-3 h-3" />, RED: <XCircle className="w-3 h-3" /> };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${m[s] || 'bg-gray-100 text-gray-700'}`}>{icons[s]}{s}</span>;
};

export default function PendingApprovals() {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const { shopId: retailerId } = JSON.parse(localStorage.getItem('retailer_user') || '{}');

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL || ''}/api/admin/stats', { params: { retailer_id: retailerId } })
      .then(res => {
        const flagged = (res.data.transactions || []).filter(t => t.status !== 'GREEN');
        setTransactions(flagged);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [retailerId]);

  const filtered = filter === 'All' ? transactions : transactions.filter(t => t.status === filter);
  const counts = {
    All: transactions.length,
    YELLOW: transactions.filter(t => t.status === 'YELLOW').length,
    RED: transactions.filter(t => t.status === 'RED').length,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
        <p className="text-gray-600 mt-1">Transactions flagged for Agriculture Officer review.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'All',    count: counts.All,    icon: Clock,       border: 'border-l-blue-500',   bg: 'bg-blue-50',   color: 'text-blue-600'   },
          { label: 'YELLOW', count: counts.YELLOW, icon: Clock,       border: 'border-l-yellow-500', bg: 'bg-yellow-50', color: 'text-yellow-600' },
          { label: 'RED',    count: counts.RED,    icon: XCircle,     border: 'border-l-red-500',    bg: 'bg-red-50',    color: 'text-red-600'    },
        ].map(({ label, count, icon: Icon, border, bg, color }) => (
          <div key={label} onClick={() => setFilter(label)}
            className={`card border-l-4 ${border} flex items-center gap-4 cursor-pointer transition hover:shadow-md ${filter === label ? 'ring-2 ring-offset-1 ring-gray-300' : ''}`}>
            <div className={`p-2.5 ${bg} rounded-lg ${color}`}><Icon className="w-5 h-5" /></div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="text-base font-bold text-gray-900 mb-4 border-b pb-3">
          {filter} <span className="text-gray-400 font-normal text-sm">({filtered.length})</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
                <th className="p-3">Transaction ID</th><th className="p-3">Farmer</th>
                <th className="p-3">Qty</th><th className="p-3">Reason</th>
                <th className="p-3">Risk</th><th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? <tr><td colSpan={6} className="p-8 text-center text-gray-400">Loading...</td></tr>
                : filtered.length === 0
                  ? <tr><td colSpan={6} className="p-8 text-center text-gray-400">No records found.</td></tr>
                  : filtered.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono text-xs text-gray-500">{t.transactionId}</td>
                      <td className="p-3 font-medium text-gray-800">...{String(t.farmerAadhaar).slice(-4)}</td>
                      <td className="p-3 text-gray-600">{t.quantity} kg</td>
                      <td className="p-3 text-xs text-gray-500 max-w-xs">{t.reason || '—'}</td>
                      <td className="p-3">
                        {statusBadge(t.status)}
                        {t.approvalRequest && (
                          <div className={`text-[10px] mt-1 font-bold ${t.approvalRequest.status === 'PENDING' ? 'text-yellow-600' : t.approvalRequest.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'}`}>
                            {t.approvalRequest.status === 'PENDING' ? 'WAITING OFFICER' : t.approvalRequest.status}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <button className="btn btn-secondary text-xs py-1 px-2" onClick={() => setSelected(t)}>View</button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full relative">
            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            <h3 className="text-base font-bold text-gray-900 mb-4 border-b pb-3">Transaction Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div><p className="text-xs text-gray-500 uppercase tracking-wide">Transaction ID</p><p className="font-mono font-medium mt-0.5">{selected.transactionId}</p></div>
              <div><p className="text-xs text-gray-500 uppercase tracking-wide">Farmer</p><p className="font-medium mt-0.5">...{String(selected.farmerAadhaar).slice(-4)}</p></div>
              <div><p className="text-xs text-gray-500 uppercase tracking-wide">Quantity</p><p className="font-medium mt-0.5">{selected.quantity} kg</p></div>
              <div><p className="text-xs text-gray-500 uppercase tracking-wide">Risk</p><div className="mt-0.5">{statusBadge(selected.status)}</div></div>
            </div>
            {selected.reason && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Reason</p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2.5 text-sm text-yellow-800">{selected.reason}</div>
              </div>
            )}
            <button className="btn btn-secondary text-sm" onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
