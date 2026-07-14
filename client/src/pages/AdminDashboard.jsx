import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { ShieldAlert, AlertTriangle, Filter, Users, Activity, ExternalLink, Brain, TrendingUp, MapPin } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, ShieldOff } from 'lucide-react';

// AdminDashboard.jsx
const STATUS_COLORS = { GREEN: '#10b981', YELLOW: '#f59e0b', RED: '#ef4444' };

export default function AdminDashboard() {
  const [data, setData] = useState({ transactions: [], stats: { total: 0, flagged: 0, green: 0, yellow: 0, red: 0, avgFraudProb: null } });
  const [retailerRisk, setRetailerRisk] = useState([]);
  const [farmerRisk, setFarmerRisk] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ retailer_id: '', crop_type: '', from_date: '', to_date: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { 
    fetchAll(); 
    
    // Set up Socket.IO listeners for real-time updates
    const socketURL = import.meta.env.VITE_API_URL || window.location.origin;
    const socket = io(socketURL);
    
    socket.on('transaction_new', () => {
      fetchAll();
    });
    
    socket.on('cluster_alert_new', () => {
      fetchAll();
    });

    return () => socket.disconnect();
  }, []);

  const fetchAll = async (f = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams(f).toString();
      const [statsRes, retailerRes, farmerRes, trendsRes, heatmapRes] = await Promise.all([
        api.get(`/api/admin/stats?${params}`),
        api.get(`/api/admin/retailer-risk`),
        api.get(`/api/admin/farmer-risk`),
        api.get(`/api/admin/monthly-trends`),
        api.get(`/api/admin/village-heatmap`)
      ]);
      setData(statsRes.data);
      setRetailerRisk(retailerRes.data.rankings);
      setFarmerRisk(farmerRes.data.rankings);
      setMonthlyTrends(trendsRes.data.trends);
      setHeatmap(heatmapRes.data.heatmap);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const active = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    fetchAll(active);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ retailer_id: '', crop_type: '', from_date: '', to_date: '' });
    fetchAll();
    setShowFilters(false);
  };

  const statusBadge = (status) => {
    const map = {
      GREEN: 'bg-green-100 text-green-700',
      YELLOW: 'bg-yellow-100 text-yellow-700',
      RED: 'bg-red-100 text-red-700'
    };
    const label = { GREEN: 'APPROVED', YELLOW: 'WARNING', RED: 'BLOCKED' };
    return <span className={`px-3 py-1 rounded-full text-xs font-bold ${map[status]}`}>{label[status]}</span>;
  };

  const pieData = [
    { name: 'Approved', value: data?.stats?.green || 0 },
    { name: 'Warning', value: data?.stats?.yellow || 0 },
    { name: 'Blocked', value: data?.stats?.red || 0 }
  ];

  console.log('Current data state:', data);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Dashboard Data...</div>;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Agriculture Officer Dashboard</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Monitor fertilizer subsidy distribution and AI-detected fraud anomalies.</p>
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className="btn btn-secondary flex items-center gap-2 self-start sm:self-auto">
          <Filter className="w-4 h-4" /> Filter Analytics
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="card mb-6 border border-blue-100 bg-blue-50/30">
          <h3 className="font-semibold text-gray-800 mb-4">Filter Transactions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Retailer ID</label>
              <input className="input-field text-sm" placeholder="e.g. RET001" value={filters.retailer_id}
                onChange={e => setFilters({ ...filters, retailer_id: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Crop Type</label>
              <select className="input-field text-sm" value={filters.crop_type}
                onChange={e => setFilters({ ...filters, crop_type: e.target.value })}>
                <option value="">All Crops</option>
                <option value="wheat">Wheat</option>
                <option value="rice">Rice</option>
                <option value="cotton">Cotton</option>
                <option value="maize">Maize</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">From Date</label>
              <input type="date" className="input-field text-sm" value={filters.from_date}
                onChange={e => setFilters({ ...filters, from_date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">To Date</label>
              <input type="date" className="input-field text-sm" value={filters.to_date}
                onChange={e => setFilters({ ...filters, to_date: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={applyFilters} className="btn btn-primary text-sm">Apply Filters</button>
            <button onClick={clearFilters} className="btn btn-secondary text-sm">Clear</button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="card border-l-4 border-l-blue-500 flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
          <div className="p-2 sm:p-3 bg-blue-50 rounded-lg text-blue-600 flex-shrink-0"><Activity className="w-5 h-5 sm:w-6 sm:h-6" /></div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-tight">Total Transactions</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{data?.stats?.total || 0}</p>
          </div>
        </div>
        
        <div className="card border-l-4 border-l-green-500 flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
          <div className="p-2 sm:p-3 bg-green-50 rounded-lg text-green-600 flex-shrink-0"><CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" /></div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-tight">Approved (Green)</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{data?.stats?.green || 0}</p>
          </div>
        </div>

        <div className="card border-l-4 border-l-yellow-500 flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
          <div className="p-2 sm:p-3 bg-yellow-50 rounded-lg text-yellow-600 flex-shrink-0"><Clock className="w-5 h-5 sm:w-6 sm:h-6" /></div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-tight">Pending (Yellow)</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{data?.stats?.yellow || 0}</p>
          </div>
        </div>

        <div className="card border-l-4 border-l-red-500 flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
          <div className="p-2 sm:p-3 bg-red-50 rounded-lg text-red-600 flex-shrink-0"><ShieldOff className="w-5 h-5 sm:w-6 sm:h-6" /></div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-tight">Blocked (Red)</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{data?.stats?.red || 0}</p>
          </div>
        </div>

        <div className="card border-l-4 border-l-purple-500 flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
          <div className="p-2 sm:p-3 bg-purple-50 rounded-lg text-purple-600 flex-shrink-0"><AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" /></div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-tight">Total Flagged</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{data?.stats?.flagged || 0}</p>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="card border-l-4 border-l-indigo-500 flex items-center gap-3 sm:gap-5 p-4 sm:p-6">
          <div className="p-2 sm:p-3 bg-indigo-50 rounded-lg text-indigo-600"><Brain className="w-5 h-5 sm:w-8 sm:h-8" /></div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Fraud Probability</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              {data?.stats?.avgFraudProb !== null && data?.stats?.avgFraudProb !== undefined ? `${data.stats.avgFraudProb}%` : 'N/A'}
            </p>
          </div>
        </div>
        <Link to="/clusters" className="card border-l-4 border-l-orange-500 flex items-center gap-3 sm:gap-5 hover:bg-orange-50 transition cursor-pointer group p-4 sm:p-6">
          <div className="p-2 sm:p-3 bg-orange-50 rounded-lg text-orange-600 group-hover:bg-white transition"><Users className="w-5 h-5 sm:w-8 sm:h-8" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Clusters</p>
            <div className="flex justify-between items-baseline">
              <p className="text-xl sm:text-3xl font-bold text-gray-900">View <span className="text-xs sm:text-sm font-normal text-red-500 ml-1">Alerts</span></p>
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-orange-600" />
            </div>
          </div>
        </Link>
      </div>

      {/* Charts Row 1: Monthly Trends + Status Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 mb-6 sm:mb-8">
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" /> Monthly Fraud Trends
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends}>
                <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avgFraud" stroke="#8b5cf6" name="Avg Fraud %" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="red" stroke="#ef4444" name="Blocked" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="yellow" stroke="#f59e0b" name="Warning" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Transaction Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={[STATUS_COLORS.GREEN, STATUS_COLORS.YELLOW, STATUS_COLORS.RED][i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Retailer Risk + Farmer Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" /> Retailer Risk Rankings
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={retailerRisk.slice(0, 6)} layout="vertical">
                <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                <YAxis type="category" dataKey="retailerId" fontSize={11} tickLine={false} axisLine={false} width={60} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="flaggedRate" fill="#ef4444" radius={[0, 4, 4, 0]} name="Flagged Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" /> Village Fraud Heatmap
          </h3>
          <div className="h-56 overflow-y-auto space-y-2">
            {heatmap.slice(0, 8).map((v, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-24 truncate">{v.village}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${v.riskScore >= 65 ? 'bg-red-500' : v.riskScore >= 35 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(v.riskScore, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-700 w-10 text-right">{v.riskScore}%</span>
              </div>
            ))}
            {heatmap.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No data yet</p>}
          </div>
        </div>
      </div>

      {/* Farmer Risk Table */}
      <div className="card mb-6 sm:mb-8">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" /> High-Risk Farmers (AI Ranked)
        </h3>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-left text-sm min-w-[480px]">
            <thead>
              <tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
                <th className="p-3">Farmer ID</th>
                <th className="p-3">Total</th>
                <th className="p-3">Flagged</th>
                <th className="p-3">Flag Rate</th>
                <th className="p-3">Avg Fraud</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {farmerRisk.map((f, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-3 font-mono text-gray-700 text-xs">{f.farmerAadhaar}</td>
                  <td className="p-3">{f.total}</td>
                  <td className="p-3 text-red-600 font-medium">{f.flagged}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${parseFloat(f.flaggedRate) >= 50 ? 'bg-red-100 text-red-700' : parseFloat(f.flaggedRate) >= 25 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {f.flaggedRate}%
                    </span>
                  </td>
                  <td className="p-3 text-purple-700 font-medium">{f.avgFraudProbability !== null ? `${f.avgFraudProbability}%` : '—'}</td>
                </tr>
              ))}
              {farmerRisk.length === 0 && (
                <tr><td colSpan="5" className="p-6 text-center text-gray-400">No data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Transactions Table */}
      <div className="card">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6 border-b pb-4 flex justify-between items-center">
          Real-time Live Transactions
          <button onClick={() => fetchAll()} className="text-sm text-blue-600 hover:underline font-normal">Sync Now</button>
        </h3>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-left border-collapse min-w-[520px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-600 uppercase tracking-wide">
                <th className="p-3">Time</th>
                <th className="p-3">Farmer / ID</th>
                <th className="p-3">Details</th>
                <th className="p-3">AI Fraud %</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.transactions.map(t => (
                <tr key={t.transactionId} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 text-xs text-gray-500">
                    {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-3">
                    <p className="font-medium text-gray-900 text-sm">ID: ...{t.farmerAadhaar?.slice(-4)}</p>
                    <p className="text-xs text-gray-500">Retailer: {t.retailerId}</p>
                  </td>
                  <td className="p-3">
                    <p className="text-sm font-medium text-gray-800">{t.quantity} bags {t.fertilizerType}</p>
                    <p className="text-xs text-gray-500 italic max-w-[160px] truncate">{t.reason}</p>
                  </td>
                  <td className="p-3">
                    {t.fraudProbability !== null ? (
                      <span className={`text-sm font-bold ${t.fraudProbability >= 65 ? 'text-red-600' : t.fraudProbability >= 35 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {t.fraudProbability}%
                      </span>
                    ) : <span className="text-gray-400 text-xs">N/A</span>}
                  </td>
                  <td className="p-3 text-center">{statusBadge(t.status)}</td>
                </tr>
              ))}
              {data.transactions.length === 0 && (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No transactions recorded yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
