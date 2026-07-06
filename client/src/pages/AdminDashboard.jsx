import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, AlertTriangle, Filter, Users, Activity, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [data, setData] = useState({ transactions: [], stats: { total: 0, flagged: 0 } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/stats');
      setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status) => {
    switch(status) {
      case 'GREEN': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">APPROVED</span>;
      case 'YELLOW': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">WARNING</span>;
      case 'RED': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">BLOCKED</span>;
      default: return null;
    }
  };

  // Mock Data for Charts
  const chartData = [
    { name: 'Mon', approved: 400, flagged: 24, blocked: 5 },
    { name: 'Tue', approved: 300, flagged: 13, blocked: 2 },
    { name: 'Wed', approved: 550, flagged: 98, blocked: 15 },
    { name: 'Thu', approved: 278, flagged: 39, blocked: 8 },
    { name: 'Fri', approved: 189, flagged: 48, blocked: 12 },
    { name: 'Sat', approved: 239, flagged: 38, blocked: 4 },
    { name: 'Sun', approved: 349, flagged: 43, blocked: 7 },
  ];

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Dashboard Data...</div>;

  return (
    <div>
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agriculture Officer Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor fertilizer subsidy distribution and flagged anomalies.</p>
        </div>
        <button className="btn btn-secondary flex items-center gap-2">
          <Filter className="w-4 h-4" /> Filter Analytics
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card border-l-4 border-l-blue-500 flex items-center gap-5">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Daily Transactions</p>
            <p className="text-3xl font-bold text-gray-900">{data.stats.total + 2292} <span className="text-sm text-green-500 font-medium">↑ 12%</span></p>
          </div>
        </div>

        <div className="card border-l-4 border-l-red-500 flex items-center gap-5">
          <div className="p-3 bg-red-50 rounded-lg text-red-600">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Flagged Patterns</p>
            <p className="text-3xl font-bold text-gray-900">{data.stats.flagged + 307} <span className="text-sm text-red-500 font-medium">↑ 4%</span></p>
          </div>
        </div>

        <Link to="/clusters" className="card border-l-4 border-l-yellow-500 flex items-center gap-5 hover:bg-yellow-50 transition cursor-pointer group">
          <div className="p-3 bg-yellow-50 rounded-lg text-yellow-600 group-hover:bg-white transition">
            <Users className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Suspicious Clusters</p>
            <div className="flex justify-between items-baseline">
              <p className="text-3xl font-bold text-gray-900">2 <span className="text-sm font-normal text-red-500 ml-1">Active Alerts</span></p>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-yellow-600" />
            </div>
          </div>
        </Link>
      </div>

      {/* Charts & Retailers row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="card lg:col-span-2">
           <h3 className="text-lg font-bold text-gray-900 mb-6">Weekly Subsidy Distribution (Bags)</h3>
           <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#f3f4f6'}} />
                <Bar dataKey="approved" stackId="a" fill="#10b981" />
                <Bar dataKey="flagged" stackId="a" fill="#f59e0b" />
                <Bar dataKey="blocked" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
           </div>
        </div>

        <div className="card bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
             High-Risk Retailers
          </h3>
          <ul className="space-y-4">
            <li className="bg-white p-3 rounded shadow-sm border border-red-100 flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm">RET001 (Kisan Seva Kendra)</p>
                <p className="text-xs text-red-600">32% transactions flagged</p>
              </div>
              <button className="text-xs font-bold text-blue-600 hover:underline">Audits</button>
            </li>
            <li className="bg-white p-3 rounded shadow-sm border border-yellow-100 flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm">RET088 (Agri Inputs Shop)</p>
                <p className="text-xs text-yellow-600">18% transactions flagged</p>
              </div>
              <button className="text-xs font-bold text-blue-600 hover:underline">Audits</button>
            </li>
             <li className="bg-white p-3 rounded shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <p className="font-semibold text-sm">RET042 (Coop Society)</p>
                <p className="text-xs text-gray-500">11% transactions flagged</p>
              </div>
              <button className="text-xs font-bold text-blue-600 hover:underline">Audits</button>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 mb-6 border-b pb-4 flex justify-between items-center">
          Real-time Live Transactions
          <button onClick={fetchData} className="text-sm text-blue-600 hover:underline font-normal">Sync Now</button>
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm string text-gray-600 uppercase tracking-wide">
                <th className="p-4 font-semibold">Time</th>
                <th className="p-4 font-semibold">Farmer / ID</th>
                <th className="p-4 font-semibold">Details</th>
                <th className="p-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.transactions.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(t.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-gray-900">ID: ...{t.aadhaar_id.slice(-4)}</p>
                    <p className="text-xs text-gray-500">Retailer: {t.retailer_id}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-medium text-gray-800">{t.quantity} bags {t.fertilizer_type}</p>
                    <p className="text-xs text-gray-500 italic max-w-[200px] truncate">{t.reason}</p>
                  </td>
                  <td className="p-4 text-center">
                    {statusBadge(t.status)}
                  </td>
                </tr>
              ))}
              {data.transactions.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">No transactions recorded yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
