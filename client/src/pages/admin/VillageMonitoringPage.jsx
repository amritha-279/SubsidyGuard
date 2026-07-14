import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { MapPin, AlertTriangle, Users, ShieldAlert, CheckCircle2, XCircle, Clock } from 'lucide-react';

const API = `${import.meta.env.VITE_API_URL || ''}/api/admin`;

export default function VillageMonitoringPage() {
  const [heatmap, setHeatmap] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    fetchData(); 
    
    const socketURL = import.meta.env.VITE_API_URL || window.location.origin;
    const socket = io(socketURL);
    socket.on('transaction_new', () => fetchData());
    return () => socket.disconnect();
  }, []);

  const fetchData = async () => {
    try {
      const [heatRes, clusterRes] = await Promise.all([
        axios.get(`${API}/village-heatmap`),
        axios.get(`${API}/clusters`)
      ]);
      setHeatmap(heatRes.data.heatmap);
      setClusters(clusterRes.data.clusters);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getRiskColor = (score) => {
    if (score >= 65) return { bg: 'bg-red-50 border-red-200', bar: 'bg-red-500', badge: 'bg-red-100 text-red-700', label: 'HIGH RISK' };
    if (score >= 35) return { bg: 'bg-yellow-50 border-yellow-200', bar: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700', label: 'MEDIUM' };
    return { bg: 'bg-green-50 border-green-200', bar: 'bg-green-500', badge: 'bg-green-100 text-green-700', label: 'LOW RISK' };
  };

  const retailerStatusIcon = (status) => {
    if (status === 'APPROVED') return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
    if (status === 'REJECTED') return <XCircle className="w-3.5 h-3.5 text-red-500" />;
    return <Clock className="w-3.5 h-3.5 text-yellow-500" />;
  };

  const retailerStatusCls = (status) => {
    if (status === 'APPROVED') return 'bg-green-50 border-green-200 text-green-700';
    if (status === 'REJECTED') return 'bg-red-50 border-red-200 text-red-700';
    return 'bg-yellow-50 border-yellow-200 text-yellow-700';
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading village data...</div>;

  const highRisk = heatmap.filter(v => v.riskScore >= 65);
  const medium = heatmap.filter(v => v.riskScore >= 35 && v.riskScore < 65);
  const low = heatmap.filter(v => v.riskScore < 35);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Village Monitoring</h1>
        <p className="text-gray-500 text-sm mt-1">Village-wise fraud analysis and cluster detection</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card border-l-4 border-l-red-500 flex items-center gap-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <div><p className="text-xs text-gray-500 uppercase">High Risk Villages</p><p className="text-2xl font-bold text-red-600">{highRisk.length}</p></div>
        </div>
        <div className="card border-l-4 border-l-yellow-500 flex items-center gap-4">
          <MapPin className="w-8 h-8 text-yellow-500" />
          <div><p className="text-xs text-gray-500 uppercase">Medium Risk</p><p className="text-2xl font-bold text-yellow-600">{medium.length}</p></div>
        </div>
        <div className="card border-l-4 border-l-green-500 flex items-center gap-4">
          <Users className="w-8 h-8 text-green-500" />
          <div><p className="text-xs text-gray-500 uppercase">Low Risk</p><p className="text-2xl font-bold text-green-600">{low.length}</p></div>
        </div>
      </div>

      {/* Scam Alert — unapproved retailers with transactions */}
      {heatmap.some(v => v.hasScamIndicator) && (
        <div className="card mb-6 border border-red-300 bg-red-50/40">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" /> Unapproved Retailers with Active Transactions
          </h3>
          <p className="text-xs text-gray-500 mb-3">These retailers are NOT approved by the Agriculture Officer but have recorded transactions — potential scam activity.</p>
          <div className="space-y-2">
            {heatmap.filter(v => v.hasScamIndicator).map(v =>
              v.unapprovedRetailers.map(r => (
                <div key={r.retailerId} className="flex items-center justify-between bg-white border border-red-200 rounded-lg px-4 py-3">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{r.name} <span className="text-gray-400 font-normal">({r.retailerId})</span></p>
                    <p className="text-xs text-gray-500">Village: {v.village} · {v.total} transactions recorded</p>
                  </div>
                  <span className={`flex items-center gap-1.5 px-2 py-1 text-xs font-bold rounded-full border ${retailerStatusCls(r.status)}`}>
                    {retailerStatusIcon(r.status)} {r.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Cluster Alerts */}
      {clusters.length > 0 && (
        <div className="card mb-6 border border-red-200 bg-red-50/30">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Users className="w-5 h-5 text-red-500" /> Cluster Fraud Detected</h3>
          <div className="space-y-2">
            {clusters.map(c => (
              <div key={c.alertId} className="flex items-center justify-between bg-white p-3 rounded-lg border border-red-100">
                <div>
                  <p className="font-semibold text-sm">{c.village} — {c.retailerId}</p>
                  <p className="text-xs text-gray-500">{c.farmersInvolved} farmers | {c.totalQuantity} bags | {new Date(c.detectedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded ${c.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Village Heatmap Cards */}
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4">Village Risk Heatmap</h3>
        {heatmap.length === 0
          ? <p className="text-center text-gray-400 py-8">No village data yet. Submit transactions to see heatmap.</p>
          : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {heatmap.map((v, i) => {
              const c = getRiskColor(v.riskScore);
              return (
                <div key={i} className={`border rounded-xl p-4 ${c.bg} ${v.hasScamIndicator ? 'ring-2 ring-red-400' : ''}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <p className="font-semibold text-gray-900">{v.village}</p>
                      {v.hasScamIndicator && (
                        <span className="flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          <ShieldAlert className="w-3 h-3" /> SCAM
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${c.badge}`}>{c.label}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Total Transactions</span><span className="font-medium">{v.total}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Flagged</span><span className="font-medium text-red-600">{v.flagged}</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Risk Score</span><span className="font-bold">{v.riskScore}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${c.bar}`} style={{ width: `${Math.min(v.riskScore, 100)}%` }} />
                      </div>
                    </div>
                    {/* Retailer approval status */}
                    {v.retailers?.length > 0 && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500 font-medium mb-1.5">Retailers in this village</p>
                        <div className="space-y-1">
                          {v.retailers.map(r => (
                            <div key={r.retailerId} className={`flex items-center justify-between px-2 py-1 rounded-lg border text-xs ${retailerStatusCls(r.status)}`}>
                              <span className="font-medium truncate max-w-[120px]">{r.name}</span>
                              <span className="flex items-center gap-1 font-bold flex-shrink-0">
                                {retailerStatusIcon(r.status)} {r.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        }
      </div>
    </div>
  );
}
