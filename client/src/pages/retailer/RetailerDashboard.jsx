import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Package, CheckCircle, Clock, ShieldOff, Users, Warehouse, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../api.js';


const RISK_COLORS = ['#10b981', '#f59e0b', '#ef4444'];
const FERT_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

const riskBadge = r => {
  if (r === 'RED' || r === 'BLOCKED') return <span className="inline-block whitespace-nowrap px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700">{r}</span>;
  if (r === 'YELLOW') return <span className="inline-block whitespace-nowrap px-2 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-700">WARNING</span>;
  return <span className="inline-block whitespace-nowrap px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">APPROVED</span>;
};
const statusBadge = s => {
  const map = { GREEN: 'bg-green-100 text-green-700', YELLOW: 'bg-yellow-100 text-yellow-700', RED: 'bg-red-100 text-red-700', Approved: 'bg-green-100 text-green-700', Pending: 'bg-yellow-100 text-yellow-700', Blocked: 'bg-red-100 text-red-700' };
  return <span className={`inline-block whitespace-nowrap px-2 py-0.5 rounded-full text-xs font-bold ${map[s]}`}>{s}</span>;
};

export default function RetailerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, flagged: 0, green: 0, yellow: 0, red: 0 });
  const [recent, setRecent] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [fertData, setFertData] = useState([]);
  const [riskData, setRiskData] = useState([]);

  const retailerUser = JSON.parse(localStorage.getItem('retailer_user') || '{}');
  const retailerId = retailerUser.shopId || retailerUser.id || '';

  useEffect(() => {
    api.get(`/api/admin/stats`, { params: { retailer_id: retailerId } })
      .then(res => {
        const { stats: s, transactions } = res.data;
        setStats(s);
        setRecent(transactions.slice(0, 5));

        // Build daily chart from transactions
        const dayMap = {};
        transactions.forEach(t => {
          const day = new Date(t.timestamp).toLocaleDateString('en', { weekday: 'short' });
          dayMap[day] = (dayMap[day] || 0) + 1;
        });
        setDailyData(Object.entries(dayMap).map(([day, count]) => ({ day, count })));

        // Fertilizer breakdown
        const fertMap = {};
        transactions.forEach(t => { fertMap[t.fertilizerType] = (fertMap[t.fertilizerType] || 0) + 1; });
        setFertData(Object.entries(fertMap).map(([name, value]) => ({ name, value })));

        // Risk breakdown
        setRiskData([
          { name: 'Green', value: s.green },
          { name: 'Yellow', value: s.yellow },
          { name: 'Red', value: s.red },
        ]);
      })
      .catch(() => {});
  }, [retailerId]);

  const statCards = [
    { label: "Total Transactions", value: stats.total,   icon: Activity,   color: 'text-blue-600',  bg: 'bg-blue-50',   border: 'border-l-blue-500'  },
    { label: 'Approved (Green)',   value: stats.green,   icon: CheckCircle,color: 'text-green-600', bg: 'bg-green-50',  border: 'border-l-green-500' },
    { label: 'Pending (Yellow)',   value: stats.yellow,  icon: Clock,      color: 'text-yellow-600',bg: 'bg-yellow-50', border: 'border-l-yellow-500'},
    { label: 'Blocked (Red)',      value: stats.red,     icon: ShieldOff,  color: 'text-red-600',   bg: 'bg-red-50',    border: 'border-l-red-500'   },
    { label: 'Total Flagged',      value: stats.flagged, icon: AlertTriangle, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-l-purple-500' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Retailer Dashboard</h1>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage fertilizer sales, inventory and farmer transactions.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`card border-l-4 ${border} flex items-center gap-3 p-3 sm:p-4`}>
            <div className={`p-2 ${bg} rounded-lg ${color} flex-shrink-0`}><Icon className="w-5 h-5" /></div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="card sm:col-span-2 lg:col-span-1">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" /> Daily Transactions
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={dailyData} margin={{ left: -20 }}>
              <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-base font-bold text-gray-900 mb-4">Fertilizer Sales by Type</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={fertData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {fertData.map((_, i) => <Cell key={i} fill={FERT_COLORS[i % FERT_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-base font-bold text-gray-900 mb-4">Verification Results</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={65}
                label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10}>
                {riskData.map((_, i) => <Cell key={i} fill={RISK_COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <div className="card lg:col-span-2">
          <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h3 className="text-base font-bold text-gray-900">Recent Transactions</h3>
            <button onClick={() => navigate('/retailer/transactions')} className="text-sm text-blue-600 hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-left text-sm min-w-[480px]">
              <thead>
                <tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
                  <th className="p-3">ID</th><th className="p-3">Farmer</th><th className="p-3">Fertilizer</th>
                  <th className="p-3">Qty</th><th className="p-3">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recent.length === 0
                  ? <tr><td colSpan={5} className="p-6 text-center text-gray-400">No transactions yet.</td></tr>
                  : recent.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="p-3 font-mono text-xs text-gray-500">{t.transactionId}</td>
                      <td className="p-3 font-medium text-gray-800">...{String(t.farmerAadhaar).slice(-4)}</td>
                      <td className="p-3 text-gray-600">{t.fertilizerType}</td>
                      <td className="p-3 text-gray-600">{t.quantity} kg</td>
                      <td className="p-3">{riskBadge(t.status)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 className="text-base font-bold text-gray-900 mb-3">Quick Actions</h3>
          <div className="flex flex-col gap-2">
            <button onClick={() => navigate('/retailer/new-transaction')} className="btn btn-primary text-sm">+ New Transaction</button>
            <button onClick={() => navigate('/retailer/farmer-lookup')} className="btn btn-secondary text-sm">Farmer Lookup</button>
            <button onClick={() => navigate('/retailer/pending')} className="btn btn-secondary text-sm">Pending Approvals</button>
            <button onClick={() => navigate('/retailer/inventory')} className="btn btn-secondary text-sm">Manage Inventory</button>
          </div>
        </div>
      </div>
    </div>
  );
}
