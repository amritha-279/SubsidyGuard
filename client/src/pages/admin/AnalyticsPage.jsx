import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import api from '../../api.js';

const API = `${import.meta.env.VITE_API_URL || ''}/api/admin`;
const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'];

export default function AnalyticsPage() {
  const [trends, setTrends] = useState([]);
  const [retailerRisk, setRetailerRisk] = useState([]);
  const [farmerRisk, setFarmerRisk] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [stats, setStats] = useState({ green: 0, yellow: 0, red: 0 });
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    fetchAll(); 
    
    const socketURL = import.meta.env.VITE_API_URL || window.location.origin;
    const socket = io(socketURL);
    socket.on('transaction_new', () => fetchAll());
    return () => socket.disconnect();
  }, []);

  const fetchAll = async () => {
    try {
      const [trendsRes, retailerRes, farmerRes, heatmapRes, statsRes] = await Promise.all([
        api.get(`/api/admin/monthly-trends`),
        api.get(`/api/admin/retailer-risk`),
        api.get(`/api/admin/farmer-risk`),
        api.get(`/api/admin/village-heatmap`),
        api.get(`/api/admin/stats`)
      ]);
      setTrends(trendsRes.data.trends);
      setRetailerRisk(retailerRes.data.rankings);
      setFarmerRisk(farmerRes.data.rankings);
      setHeatmap(heatmapRes.data.heatmap);
      setStats(statsRes.data.stats);
      setTxns(statsRes.data.transactions);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Crop distribution
  const cropData = txns.reduce((acc, t) => {
    const key = t.cropType || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const cropChartData = Object.entries(cropData).map(([name, value]) => ({ name, value }));

  // Status distribution
  const pieData = [
    { name: 'Approved', value: stats.green || 0 },
    { name: 'Warning', value: stats.yellow || 0 },
    { name: 'Blocked', value: stats.red || 0 }
  ];

  // Farmer risk distribution
  const farmerRiskDist = [
    { label: 'High Risk (≥50%)', count: farmerRisk.filter(f => parseFloat(f.flaggedRate) >= 50).length },
    { label: 'Medium (25-50%)', count: farmerRisk.filter(f => parseFloat(f.flaggedRate) >= 25 && parseFloat(f.flaggedRate) < 50).length },
    { label: 'Low (<25%)', count: farmerRisk.filter(f => parseFloat(f.flaggedRate) < 25).length },
  ];

  if (loading) return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Comprehensive fraud analytics and trends</p>
      </div>

      {/* Row 1: Monthly Trends + Status Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card lg:col-span-2">
          <h3 className="font-bold text-gray-900 mb-4">Monthly Fraud Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip /><Legend />
                <Line type="monotone" dataKey="avgFraud" stroke="#8b5cf6" name="Avg Fraud %" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="red" stroke="#ef4444" name="Blocked" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="yellow" stroke="#f59e0b" name="Warning" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="green" stroke="#10b981" name="Approved" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {pieData.map((_, i) => <Cell key={i} fill={['#10b981', '#f59e0b', '#ef4444'][i]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Retailer Rankings + Crop Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Retailer Risk Rankings</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={retailerRisk.slice(0, 8)} layout="vertical">
                <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                <YAxis type="category" dataKey="retailerId" fontSize={11} tickLine={false} axisLine={false} width={60} />
                <Tooltip formatter={v => `${v}%`} />
                <Bar dataKey="flaggedRate" fill="#ef4444" radius={[0, 4, 4, 0]} name="Flagged %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Transactions by Crop</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={cropChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {cropChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Village Heatmap + Farmer Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Village Fraud Scores</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={heatmap.slice(0, 8)}>
                <XAxis dataKey="village" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} unit="%" />
                <Tooltip formatter={v => `${v}%`} />
                <Bar dataKey="riskScore" name="Risk Score %" radius={[4, 4, 0, 0]}>
                  {heatmap.slice(0, 8).map((v, i) => (
                    <Cell key={i} fill={v.riskScore >= 65 ? '#ef4444' : v.riskScore >= 35 ? '#f59e0b' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4">Farmer Risk Distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={farmerRiskDist}>
                <XAxis dataKey="label" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" name="Farmers" radius={[4, 4, 0, 0]}>
                  <Cell fill="#ef4444" /><Cell fill="#f59e0b" /><Cell fill="#10b981" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Seasonal Analysis */}
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4">Seasonal Fraud Analysis</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends}>
              <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip /><Legend />
              <Bar dataKey="green" stackId="a" fill="#10b981" name="Approved" />
              <Bar dataKey="yellow" stackId="a" fill="#f59e0b" name="Warning" />
              <Bar dataKey="red" stackId="a" fill="#ef4444" name="Blocked" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
