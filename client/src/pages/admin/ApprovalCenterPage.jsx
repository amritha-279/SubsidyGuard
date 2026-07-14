import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

import { CheckCircle2, XCircle, Clock, User, Store } from 'lucide-react';
import api from '../../api.js';

const API = `${import.meta.env.VITE_API_URL || ''}/api/admin`;

export default function ApprovalCenterPage() {
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  useEffect(() => { 
    fetchRetailers(); 
    
    const socketURL = import.meta.env.VITE_API_URL || window.location.origin;
    const socket = io(socketURL);
    socket.on('transaction_new', () => fetchRetailers());
    return () => socket.disconnect();
  }, []);

  const fetchRetailers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/pending-retailers`);
      const all = res.data.all || [];
      setPending(all.filter(r => r.status === 'PENDING'));
      setApproved(all.filter(r => r.status === 'APPROVED'));
      setRejected(all.filter(r => r.status === 'REJECTED'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, status) => {
    setActing(id + status);
    try {
      await api.patch(`/api/admin/retailer-status/${id}`, { status });
      await fetchRetailers();
    } catch (e) {
      alert('Action failed: ' + (e.response?.data?.error || e.message));
    } finally {
      setActing(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading approval requests...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Approval Center</h1>
        <p className="text-gray-500 text-sm mt-1">Approve or reject retailer registration requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card border-l-4 border-l-yellow-500 flex items-center gap-4">
          <Clock className="w-8 h-8 text-yellow-500" />
          <div><p className="text-xs text-gray-500 uppercase">Pending</p><p className="text-2xl font-bold">{pending.length}</p></div>
        </div>
        <div className="card border-l-4 border-l-green-500 flex items-center gap-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
          <div><p className="text-xs text-gray-500 uppercase">Approved</p><p className="text-2xl font-bold">{approved.length}</p></div>
        </div>
        <div className="card border-l-4 border-l-red-400 flex items-center gap-4">
          <XCircle className="w-8 h-8 text-red-400" />
          <div><p className="text-xs text-gray-500 uppercase">Rejected</p><p className="text-2xl font-bold">{rejected.length}</p></div>
        </div>
      </div>

      {/* Pending Registrations */}
      <div className="card mb-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-500" /> Pending Retailer Registrations
        </h3>
        {pending.length === 0
          ? <p className="text-center text-gray-400 py-8">No pending registrations</p>
          : <div className="space-y-3">
            {pending.map(r => (
              <div key={r.id} className="border border-yellow-100 bg-yellow-50/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-semibold text-gray-900 truncate">
                      {r.name} {r.shopName && <span className="text-gray-500 font-normal">({r.shopName})</span>}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-gray-600">
                      <p><span className="font-medium text-gray-500">Email:</span> {r.email}</p>
                      <p><span className="font-medium text-gray-500">Mobile:</span> {r.mobile || 'N/A'}</p>
                      <p><span className="font-medium text-gray-500">Shop ID:</span> {r.shopId || 'N/A'}</p>
                      <p><span className="font-medium text-gray-500">Aadhaar:</span> {r.aadhaarNumber || 'N/A'}</p>
                    </div>
                    <p className="text-xs text-gray-600 truncate">
                      <span className="font-medium text-gray-500">Address:</span> {[r.shopAddress, r.village, r.district, r.pinCode].filter(Boolean).join(', ') || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-400">
                      <span className="font-medium">Registered:</span> {new Date(r.createdAt).toLocaleDateString()}
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

      {/* Approved */}
      <div className="card mb-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" /> Approved Retailers
        </h3>
        {approved.length === 0
          ? <p className="text-center text-gray-400 py-6">No approved retailers yet</p>
          : <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead><tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
                <th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Shop ID</th><th className="p-3">Approved On</th><th className="p-3">Action</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {approved.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{r.name}</td>
                    <td className="p-3 text-gray-500">{r.email}</td>
                    <td className="p-3 text-gray-500">{r.shopId || '—'}</td>
                    <td className="p-3 text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <button onClick={() => handleAction(r.id, 'REJECTED')}
                        disabled={acting === r.id + 'REJECTED'}
                        className="btn bg-red-50 text-red-600 hover:bg-red-100 text-xs py-1 px-3 border border-red-200">
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>

      {/* Rejected */}
      {rejected.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-400" /> Rejected Retailers
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead><tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
                <th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Shop ID</th><th className="p-3">Action</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {rejected.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-500">{r.name}</td>
                    <td className="p-3 text-gray-400">{r.email}</td>
                    <td className="p-3 text-gray-400">{r.shopId || '—'}</td>
                    <td className="p-3">
                      <button onClick={() => handleAction(r.id, 'APPROVED')}
                        disabled={acting === r.id + 'APPROVED'}
                        className="btn btn-primary text-xs py-1 px-3">
                        Re-approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
