import { useState, useEffect } from 'react';

import { History } from 'lucide-react';
import api from '../../api.js';

export default function StockHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const { id: retailerId } = JSON.parse(localStorage.getItem('retailer_user') || '{}');

  useEffect(() => {
    if (!retailerId) return;
    api.get(`/api/inventory/history/${retailerId}`)
      .then(res => setHistory(res.data.history || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [retailerId]);

  const badgeColor = (action) => {
    switch (action) {
      case 'ADD': return 'bg-blue-100 text-blue-700';
      case 'SALE': return 'bg-red-100 text-red-700';
      case 'CANCEL': return 'bg-green-100 text-green-700';
      case 'UPDATE': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading history...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock History</h1>
          <p className="text-gray-600 mt-1">Audit log of all inventory modifications and transactions.</p>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
                <th className="p-3">Date & Time</th>
                <th className="p-3">Fertilizer</th>
                <th className="p-3">Action</th>
                <th className="p-3">Qty Changed</th>
                <th className="p-3">Before</th>
                <th className="p-3">After</th>
                <th className="p-3">User</th>
                <th className="p-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-gray-500">No stock history available.</td>
                </tr>
              ) : (
                history.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-600 whitespace-nowrap">{new Date(h.date).toLocaleString()}</td>
                    <td className="p-3 font-medium text-gray-900">{h.fertilizer}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${badgeColor(h.action)}`}>
                        {h.action}
                      </span>
                    </td>
                    <td className="p-3 text-gray-900 font-medium">{h.action === 'SALE' ? '-' : '+'}{h.quantity} kg</td>
                    <td className="p-3 text-gray-500">{h.beforeQuantity} kg</td>
                    <td className="p-3 text-gray-500">{h.afterQuantity} kg</td>
                    <td className="p-3 text-gray-600">{h.user}</td>
                    <td className="p-3 text-gray-500 max-w-xs truncate" title={h.remarks}>{h.remarks || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
