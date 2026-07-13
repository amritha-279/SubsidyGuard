import { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle2, XCircle, Clock, FileText, AlertTriangle } from 'lucide-react';

export default function TransactionApprovalsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/transaction-approvals');
      setRequests(res.data.requests || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    setActing(id + status);
    try {
      await axios.patch(`/api/admin/transaction-approvals/${id}`, { status, remarks: `Officer ${status} this request.` });
      await fetchRequests();
    } catch (e) {
      alert('Action failed: ' + (e.response?.data?.error || e.message));
    } finally {
      setActing(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading transaction approvals...</div>;

  const pending = requests.filter(r => r.status === 'PENDING');
  const history = requests.filter(r => r.status !== 'PENDING');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transaction Approvals</h1>
        <p className="text-gray-500 text-sm mt-1">Review flagged excess quantity requests from retailers</p>
      </div>

      {/* Pending Requests */}
      <div className="card mb-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-500" /> Pending Approval Requests
        </h3>
        {pending.length === 0
          ? <p className="text-center text-gray-400 py-8">No pending transaction requests</p>
          : <div className="space-y-4">
            {pending.map(r => (
              <div key={r.id} className="border border-red-100 bg-red-50/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-semibold text-gray-900 truncate flex items-center gap-2">
                      Transaction {r.transactionId}
                      {r.transaction?.fraudProbability != null && (
                        <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold border border-red-200">
                          AI Fraud {r.transaction.fraudProbability}%
                        </span>
                      )}
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 mt-2">
                      <p><span className="font-medium text-gray-500">Retailer ID:</span> {r.retailerId}</p>
                      <p><span className="font-medium text-gray-500">Farmer:</span> {r.transaction?.farmerName || 'Unknown'} (...{r.transaction?.farmerAadhaar?.slice(-4) || ''})</p>
                      <p><span className="font-medium text-gray-500">Requested Quantity:</span> <span className="font-bold text-red-600">{r.transaction?.quantity || 0} kg</span></p>
                      <p><span className="font-medium text-gray-500">Recommended Quantity:</span> {r.transaction?.recommendedQuantity || 0} kg</p>
                      <p><span className="font-medium text-gray-500">Crop / Fertilizer:</span> {r.transaction?.cropType || '-'} / {r.transaction?.fertilizerType || '-'}</p>
                    </div>
                    
                    <p className="text-xs text-gray-400 mt-2">
                      <span className="font-medium">Requested On:</span> {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleAction(r.id, 'APPROVED')}
                    disabled={acting === r.id + 'APPROVED'}
                    className="btn btn-primary text-sm gap-2 px-4"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {acting === r.id + 'APPROVED' ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleAction(r.id, 'REJECTED')}
                    disabled={acting === r.id + 'REJECTED'}
                    className="btn bg-red-600 text-white hover:bg-red-700 text-sm gap-2 px-4"
                  >
                    <XCircle className="w-4 h-4" />
                    {acting === r.id + 'REJECTED' ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        }
      </div>

      {/* History */}
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-500" /> Processed Requests
        </h3>
        {history.length === 0
          ? <p className="text-center text-gray-400 py-6">No processed requests yet</p>
          : <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead><tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
                <th className="p-3">Transaction</th>
                <th className="p-3">Retailer</th>
                <th className="p-3">Farmer</th>
                <th className="p-3">Qty Req / Rec</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {history.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium font-mono text-xs">{r.transactionId}</td>
                    <td className="p-3 text-gray-600">{r.retailerId}</td>
                    <td className="p-3 text-gray-600">{r.transaction?.farmerName || 'Unknown'}</td>
                    <td className="p-3">
                      <span className="font-medium">{r.transaction?.quantity}</span> / <span className="text-gray-400">{r.transaction?.recommendedQuantity} kg</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${r.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400 text-xs">{new Date(r.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>

    </div>
  );
}
