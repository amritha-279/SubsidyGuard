import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Eye, X, User, MapPin, Crop, Phone } from 'lucide-react';

const riskBadge = rate => {
  const r = parseFloat(rate);
  if (r >= 50) return <span className="inline-block whitespace-nowrap px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700">HIGH RISK</span>;
  if (r >= 25) return <span className="inline-block whitespace-nowrap px-2 py-0.5 text-xs font-bold rounded-full bg-yellow-100 text-yellow-700">MEDIUM</span>;
  return <span className="inline-block whitespace-nowrap px-2 py-0.5 text-xs font-bold rounded-full bg-green-100 text-green-700">LOW RISK</span>;
};

const statusBadge = s => {
  const m = { GREEN: 'bg-green-100 text-green-700', YELLOW: 'bg-yellow-100 text-yellow-700', RED: 'bg-red-100 text-red-700' };
  return <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${m[s] || 'bg-gray-100 text-gray-600'}`}>{s}</span>;
};

export default function FarmerManagementPage() {
  const [farmers, setFarmers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL || ''}/api/admin/farmers`)
      .then(res => setFarmers(res.data.farmers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = farmers.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.aadhaarId?.includes(search) ||
    f.village?.toLowerCase().includes(search.toLowerCase()) ||
    f.district?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-gray-500">Loading farmers...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Farmer Management</h1>
        <p className="text-gray-500 text-sm mt-1">Full farmer profiles, purchase history and risk scores</p>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input className="input-field pl-9 text-sm" placeholder="Search by name, Aadhaar, village or district..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
                <th className="p-3">Farmer ID (Aadhaar)</th>
                <th className="p-3">Name</th>
                <th className="p-3">Village</th>
                <th className="p-3">District</th>
                <th className="p-3">Land</th>
                <th className="p-3">Crop</th>
                <th className="p-3">Purchases</th>
                <th className="p-3">Flagged</th>
                <th className="p-3">Risk</th>
                <th className="p-3 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0
                ? <tr><td colSpan={10} className="p-8 text-center text-gray-400">No farmers found</td></tr>
                : filtered.map(f => (
                  <tr key={f.aadhaarId} className="hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs text-gray-600">{f.aadhaarId}</td>
                    <td className="p-3 font-medium text-gray-900">{f.name || '—'}</td>
                    <td className="p-3 text-gray-600">{f.village || '—'}</td>
                    <td className="p-3 text-gray-600">{f.district || '—'}</td>
                    <td className="p-3 text-gray-600">{f.landSize ? `${f.landSize} ac` : '—'}</td>
                    <td className="p-3 text-gray-600">{f.cropType || '—'}</td>
                    <td className="p-3">{f.total}</td>
                    <td className="p-3 text-red-600 font-medium">{f.flagged}</td>
                    <td className="p-3">{riskBadge(f.flaggedRate)}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => setSelected(f)} className="text-blue-600 hover:text-blue-800">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white">
              <h2 className="font-bold text-gray-900">Farmer Profile</h2>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-5">

              {/* Identity */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                {[
                  ['Aadhaar ID', selected.aadhaarId],
                  ['Full Name', selected.name || '—'],
                  ['Mobile', selected.mobile || '—'],
                  ['Village', selected.village || '—'],
                  ['District', selected.district || '—'],
                  ['Land Size', selected.landSize ? `${selected.landSize} acres` : '—'],
                  ['Crop Type', selected.cropType || '—'],
                ].map(([l, v]) => (
                  <div key={l} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{l}</p>
                    <p className="font-semibold text-gray-900 mt-0.5">{v}</p>
                  </div>
                ))}
              </div>

              {/* Risk Stats */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  ['Total Purchases', selected.total],
                  ['Flagged', selected.flagged],
                  ['Flag Rate', `${selected.flaggedRate}%`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">{l}</p>
                    <p className="text-xl font-bold text-gray-900">{v}</p>
                  </div>
                ))}
              </div>

              {/* Transaction History */}
              <h3 className="font-semibold text-gray-800 mb-3">Transaction History</h3>
              {selected.transactions.length === 0
                ? <p className="text-gray-400 text-sm">No transactions found.</p>
                : (
                  <div className="space-y-2">
                    {selected.transactions.slice(0, 15).map(t => (
                      <div key={t.transactionId} className="flex justify-between items-center text-sm border-b pb-2">
                        <div>
                          <p className="font-medium text-gray-800">{t.quantity} kg {t.fertilizerType} — {t.cropType}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(t.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            {' · '}Retailer: {t.retailerId}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {t.fraudProbability != null && (
                            <span className="text-xs text-purple-600 font-medium">{t.fraudProbability}%</span>
                          )}
                          {statusBadge(t.status)}
                        </div>
                      </div>
                    ))}
                    {selected.transactions.length > 15 && (
                      <p className="text-xs text-gray-400 text-center pt-1">Showing 15 of {selected.transactions.length} transactions</p>
                    )}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
