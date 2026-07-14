import { useState, useEffect } from 'react';
import { X, Eye } from 'lucide-react';
import axios from 'axios';

const statusBadge = s => {
  const map = {
    GREEN:   'bg-green-100 text-green-700',
    YELLOW:  'bg-yellow-100 text-yellow-700',
    RED:     'bg-red-100 text-red-700',
    BLOCKED: 'bg-gray-200 text-gray-700',
  };
  const label = { GREEN: 'APPROVED', YELLOW: 'WARNING', RED: 'FLAGGED', BLOCKED: 'BLOCKED' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${map[s] || map.BLOCKED}`}>{label[s] || s}</span>;
};

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({ date: '', crop: '', fertilizer: '', status: '' });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const retailerUser = JSON.parse(localStorage.getItem('retailer_user') || '{}');
  const retailerId = retailerUser.shopId || retailerUser.id || '';

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL || ''}/api/admin/stats', { params: { retailer_id: retailerId } })
      .then(res => {
        const all = res.data.transactions || [];
        setTransactions(retailerId ? all.filter(t => t.retailerId === retailerId) : all);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [retailerId]);

  const filtered = transactions.filter(t =>
    (!filters.date       || t.timestamp?.startsWith(filters.date)) &&
    (!filters.crop       || t.cropType?.toLowerCase().includes(filters.crop.toLowerCase())) &&
    (!filters.fertilizer || t.fertilizerType?.toLowerCase().includes(filters.fertilizer.toLowerCase())) &&
    (!filters.status     || t.status === filters.status)
  );

  const inputCls = 'input-field text-sm';
  const labelCls = 'text-xs font-medium text-gray-600 mb-1 block';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
        <p className="text-gray-600 mt-1">All fertilizer sale transactions including blocked attempts.</p>
      </div>

      {/* Filters */}
      <div className="card mb-6 border border-blue-100 bg-blue-50/30">
        <h3 className="font-semibold text-gray-800 mb-4">Filter Transactions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><label className={labelCls}>Date</label>
            <input type="date" className={inputCls} value={filters.date}
              onChange={e => setFilters(f => ({ ...f, date: e.target.value }))} /></div>
          <div><label className={labelCls}>Crop</label>
            <input className={inputCls} placeholder="e.g. Paddy" value={filters.crop}
              onChange={e => setFilters(f => ({ ...f, crop: e.target.value }))} /></div>
          <div><label className={labelCls}>Fertilizer</label>
            <input className={inputCls} placeholder="e.g. Urea" value={filters.fertilizer}
              onChange={e => setFilters(f => ({ ...f, fertilizer: e.target.value }))} /></div>
          <div><label className={labelCls}>Status</label>
            <select className={inputCls} value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">All</option>
              <option value="GREEN">Approved</option>
              <option value="YELLOW">Warning</option>
              <option value="RED">Flagged</option>
              <option value="BLOCKED">Blocked</option>
            </select></div>
        </div>
        <button className="btn btn-secondary text-sm mt-4"
          onClick={() => setFilters({ date: '', crop: '', fertilizer: '', status: '' })}>
          Clear Filters
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <h3 className="text-base font-bold text-gray-900 mb-4 border-b pb-3">
          Transactions <span className="text-gray-400 font-normal text-sm">({filtered.length})</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
                <th className="p-3">Transaction ID</th>
                <th className="p-3">Farmer</th>
                <th className="p-3">Crop</th>
                <th className="p-3">Fertilizer</th>
                <th className="p-3">Requested</th>
                <th className="p-3">Recommended</th>
                <th className="p-3">AI Fraud %</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? <tr><td colSpan={10} className="p-8 text-center text-gray-400">Loading...</td></tr>
                : filtered.length === 0
                  ? <tr><td colSpan={10} className="p-8 text-center text-gray-400">No transactions found.</td></tr>
                  : filtered.map(t => (
                    <tr key={t.transactionId}
                      className={`hover:bg-gray-50 ${t.status === 'BLOCKED' ? 'bg-gray-50/60 opacity-80' : ''}`}>
                      <td className="p-3 font-mono text-xs text-gray-500">{t.transactionId}</td>
                      <td className="p-3">
                        <p className="font-medium text-gray-800 text-xs">{t.farmerName || '—'}</p>
                        <p className="text-gray-400 text-xs">...{String(t.farmerAadhaar).slice(-4)}</p>
                      </td>
                      <td className="p-3 text-gray-600 capitalize">{t.cropType}</td>
                      <td className="p-3 text-gray-600">{t.fertilizerType}</td>
                      <td className="p-3 text-gray-700 font-medium">{t.quantity} kg</td>
                      <td className="p-3 text-gray-400">{t.status === 'BLOCKED' ? '—' : `${t.recommendedQuantity} kg`}</td>
                      <td className="p-3">
                        {t.fraudProbability != null
                          ? <span className={`font-bold text-xs ${t.fraudProbability >= 65 ? 'text-red-600' : t.fraudProbability >= 35 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {t.fraudProbability}%
                            </span>
                          : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="p-3">
                        {statusBadge(t.status)}
                        {t.approvalRequest && t.status === 'RED' && (
                          <div className="text-[10px] text-yellow-600 mt-1 font-bold">
                            {t.approvalRequest.status === 'PENDING' ? 'WAITING OFFICER' : t.approvalRequest.status}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-xs text-gray-500">{new Date(t.timestamp).toLocaleDateString()}</td>
                      <td className="p-3">
                        <button className="btn btn-secondary text-xs py-1 px-2" onClick={() => setSelected(t)}>
                          <Eye className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card max-w-lg w-full relative">
            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-gray-900 mb-4 border-b pb-3">Transaction Details</h3>
            <div className="space-y-2 text-sm">
              {[
                ['Transaction ID',    selected.transactionId],
                ['Farmer Name',       selected.farmerName || '—'],
                ['Farmer Aadhaar',    `...${String(selected.farmerAadhaar).slice(-4)}`],
                ['Village',           selected.village || '—'],
                ['Crop',              selected.cropType],
                ['Fertilizer',        selected.fertilizerType],
                ['Requested Qty',     `${selected.quantity} kg`],
                ['Recommended Qty',   selected.status === 'BLOCKED' ? '—' : `${selected.recommendedQuantity} kg`],
                ['AI Fraud %',        selected.fraudProbability != null ? `${selected.fraudProbability}%` : '—'],
                ['Status',            selected.status],
                ['Reason',            selected.reason || '—'],
                ['Date & Time',       new Date(selected.timestamp).toLocaleString()],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500">{l}</span>
                  <span className="font-medium text-gray-800 text-right max-w-[60%]">{v}</span>
                </div>
              ))}
              <div className="flex justify-between pt-1">
                <span className="text-gray-500">Status Badge</span>
                <div>{statusBadge(selected.status)}</div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              {selected.status === 'GREEN' && !selected.isCompleted && (
                <button 
                  className="btn btn-primary text-sm flex-1"
                  onClick={async () => {
                    try {
                      await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/transactions/confirm', { transactionId: selected.transactionId });
                      alert('Sale Completed and Stock Deducted!');
                      setSelected(null);
                      // Force a reload of the page to reflect new status
                      window.location.reload();
                    } catch(e) {
                      alert('Error completing sale: ' + (e.response?.data?.error || e.message));
                    }
                  }}
                >
                  Complete Sale
                </button>
              )}
              {selected.status !== 'BLOCKED' && (
                <button className="btn btn-secondary text-sm" onClick={() => window.print()}>Print Receipt</button>
              )}
              <button className="btn btn-secondary text-sm" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
