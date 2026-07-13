import { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, MapPin, Users, Activity, Eye } from 'lucide-react';

export default function ClustersPage() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchClusters(); }, []);

  const fetchClusters = async () => {
    try {
      const res = await axios.get(`\${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/clusters`);
      setClusters(res.data.clusters);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading cluster alerts...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Activity className="w-8 h-8 text-blue-600" />
          Suspicious Cluster Alerts
        </h1>
        <p className="text-gray-600 mt-2">AI-detected geographical and pattern-based fraud anomalies.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card md:col-span-3 border-t-4 border-t-red-500 bg-red-50/30">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Immediate Action Required</h3>
              <p className="text-gray-700 text-sm mt-1">
                High volume flagged transactions detected from same retailers within narrow time windows. Review all active alerts below.
              </p>
            </div>
          </div>
        </div>

        <div className="card text-center flex flex-col justify-center">
          <p className="text-sm font-medium text-gray-500 uppercase">Active Threats</p>
          <p className="text-4xl font-black text-red-600 my-2">{clusters.length}</p>
        </div>
      </div>

      {clusters.length === 0 ? (
        <div className="card text-center py-16">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No cluster alerts detected</p>
          <p className="text-gray-400 text-sm mt-1">Alerts are auto-generated when 3+ flagged transactions occur from the same retailer within 1 hour.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {clusters.map(cluster => (
            <div key={cluster.alertId} className="card border hover:border-blue-300 transition-colors">
              <div className="flex flex-col md:flex-row justify-between gap-6">

                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                      cluster.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {cluster.severity}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900">{cluster.type}</h3>
                    <span className="text-xs text-gray-400">ID: {cluster.alertId}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span><strong>Retailer:</strong> {cluster.retailerId}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Activity className="w-4 h-4 text-gray-400" />
                      <span><strong>Village:</strong> {cluster.village}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span><strong>Farmers Involved:</strong> {cluster.farmersInvolved} unique IDs</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <AlertTriangle className="w-4 h-4 text-gray-400" />
                      <span><strong>Total Volume:</strong> {cluster.totalQuantity} bags</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between items-end min-w-[150px] border-l border-gray-100 pl-6">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</p>
                    <p className="text-sm font-bold text-gray-900">{cluster.status}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(cluster.detectedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                  <button className="btn btn-secondary flex items-center gap-2 w-full mt-4">
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
