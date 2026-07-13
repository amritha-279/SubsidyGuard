import { useState } from 'react';
import { FileText, Download, Calendar, Loader2, CalendarDays, BarChart2, TrendingUp, AlertTriangle, Eye } from 'lucide-react';
import axios from 'axios';

const API = `\${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/reports`;

function toCSV(rows) {
  if (!rows.length) return '';
  const headers = ['Transaction ID','Farmer Aadhaar','Crop','Fertilizer','Quantity','Recommended Qty','Status','Fraud %','Village','Reason','Date'];
  const lines = rows.map(t => [
    t.transactionId, t.farmerAadhaar, t.cropType, t.fertilizerType,
    t.quantity, t.recommendedQuantity, t.status,
    t.fraudProbability ?? 'N/A', t.village,
    `"${(t.reason || '').replace(/"/g, "'")}"`,
    new Date(t.timestamp).toLocaleString()
  ].join(','));
  return [headers.join(','), ...lines].join('\n');
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function printReport(rows, title, retailerName) {
  const html = `
    <html><head><title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
      h2 { color: #15803d; margin-bottom: 4px; }
      p { color: #6b7280; margin: 0 0 16px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #f0fdf4; color: #15803d; padding: 8px; text-align: left; border: 1px solid #bbf7d0; font-size: 11px; }
      td { padding: 7px 8px; border: 1px solid #e5e7eb; }
      tr:nth-child(even) td { background: #f9fafb; }
      .GREEN { color: #15803d; font-weight: bold; }
      .YELLOW { color: #b45309; font-weight: bold; }
      .RED { color: #b91c1c; font-weight: bold; }
    </style></head><body>
    <h2>SubsidyGuard — ${title}</h2>
    <p>Retailer: ${retailerName} &nbsp;|&nbsp; Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Records: ${rows.length}</p>
    <table>
      <thead><tr>
        <th>Txn ID</th><th>Farmer</th><th>Crop</th><th>Fertilizer</th>
        <th>Qty</th><th>Status</th><th>Fraud %</th><th>Village</th><th>Date</th>
      </tr></thead>
      <tbody>${rows.map(t => `<tr>
        <td>${t.transactionId}</td>
        <td>...${String(t.farmerAadhaar).slice(-4)}</td>
        <td>${t.cropType}</td>
        <td>${t.fertilizerType}</td>
        <td>${t.quantity}</td>
        <td class="${t.status}">${t.status}</td>
        <td>${t.fraudProbability ?? 'N/A'}</td>
        <td>${t.village}</td>
        <td>${new Date(t.timestamp).toLocaleDateString()}</td>
      </tr>`).join('')}</tbody>
    </table>
    </body></html>`;
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.print();
}

const REPORTS = [
  { type: 'daily',   label: 'Daily Report',   desc: "Today's transactions",       icon: CalendarDays },
  { type: 'weekly',  label: 'Weekly Report',  desc: 'Last 7 days',                icon: BarChart2 },
  { type: 'monthly', label: 'Monthly Report', desc: 'Last 30 days',               icon: TrendingUp },
  { type: 'fraud',   label: 'Fraud Report',   desc: 'Flagged / blocked only',     icon: AlertTriangle },
];

export default function RetailerReports() {
  const user = JSON.parse(localStorage.getItem('retailer_user') || '{}');
  const retailerId = user.shopId || user.id || '';
  const retailerName = user.shopName || user.name || 'Retailer';

  const [loading, setLoading] = useState({});
  const [custom, setCustom] = useState({ from_date: '', to_date: '' });
  const [customLoading, setCustomLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const fetchAndAct = async (params, action, label) => {
    const key = params.type + '_' + action;
    setLoading(l => ({ ...l, [key]: true }));
    try {
      const res = await axios.get(API, { params: { ...params, retailer_id: retailerId } });
      const rows = res.data.transactions;
      if (!rows.length) { alert('No transactions found for this period.'); return; }
      if (action === 'csv') downloadCSV(toCSV(rows), `${label.replace(/ /g, '_')}_${Date.now()}.csv`);
      else printReport(rows, label, retailerName);
    } catch {
      alert('Failed to generate report. Make sure the server is running.');
    } finally {
      setLoading(l => ({ ...l, [key]: false }));
    }
  };

  const handleCustom = async (action) => {
    if (!custom.from_date || !custom.to_date) { alert('Please select both From and To dates.'); return; }
    setCustomLoading(true);
    try {
      const res = await axios.get(API, { params: { ...custom, retailer_id: retailerId, type: 'all' } });
      const rows = res.data.transactions;
      if (!rows.length) { alert('No transactions found for the selected range.'); return; }
      if (action === 'preview') { setPreview(rows); return; }
      if (action === 'csv') downloadCSV(toCSV(rows), `My_Report_${custom.from_date}_to_${custom.to_date}.csv`);
      else printReport(rows, `Report (${custom.from_date} to ${custom.to_date})`, retailerName);
    } catch {
      alert('Failed to generate report. Make sure the server is running.');
    } finally {
      setCustomLoading(false);
    }
  };

  const statusCls = s => s === 'GREEN' ? 'bg-green-100 text-green-700' : s === 'YELLOW' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Export your transaction history as CSV or printable report</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {REPORTS.map(r => (
          <div key={r.type} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-50 rounded-lg flex-shrink-0"><r.icon className="w-5 h-5 text-green-600" /></div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{r.label}</h3>
                <p className="text-sm text-gray-500 mt-1">{r.desc}</p>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => fetchAndAct({ type: r.type }, 'csv', r.label)}
                    disabled={loading[r.type + '_csv']}
                    className="btn btn-primary text-xs py-1.5 px-3 gap-1">
                    {loading[r.type + '_csv'] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    {loading[r.type + '_csv'] ? 'Generating...' : 'CSV'}
                  </button>
                  <button onClick={() => fetchAndAct({ type: r.type }, 'print', r.label)}
                    disabled={loading[r.type + '_print']}
                    className="btn btn-secondary text-xs py-1.5 px-3 gap-1">
                    {loading[r.type + '_print'] ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                    {loading[r.type + '_print'] ? 'Loading...' : 'Print'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Range */}
      <div className="card mb-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-600" /> Custom Date Range
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">From Date</label>
            <input type="date" className="input-field text-sm" value={custom.from_date}
              onChange={e => setCustom(c => ({ ...c, from_date: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">To Date</label>
            <input type="date" className="input-field text-sm" value={custom.to_date}
              onChange={e => setCustom(c => ({ ...c, to_date: e.target.value }))} />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={() => handleCustom('csv')} disabled={customLoading}
              className="btn btn-primary flex-1 text-sm gap-1">
              {customLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} CSV
            </button>
            <button onClick={() => handleCustom('print')} disabled={customLoading}
              className="btn btn-secondary flex-1 text-sm gap-1">
              <FileText className="w-4 h-4" /> Print
            </button>
          </div>
        </div>
        <button onClick={() => handleCustom('preview')} disabled={customLoading}
          className="btn btn-secondary text-sm mt-3 gap-2">
          <Eye className="w-4 h-4" /> Preview
        </button>
      </div>

      {/* Preview */}
      {preview && (
        <div className="card">
          <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h3 className="font-bold text-gray-900">Preview — {preview.length} records</h3>
            <div className="flex gap-2">
              <button onClick={() => downloadCSV(toCSV(preview), `Preview_${Date.now()}.csv`)}
                className="btn btn-primary text-xs py-1.5 px-3 gap-1"><Download className="w-3 h-3" /> Download</button>
              <button onClick={() => setPreview(null)} className="btn btn-secondary text-xs py-1.5 px-3">Close</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[560px]">
              <thead>
                <tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
                  <th className="p-3">Txn ID</th><th className="p-3">Farmer</th><th className="p-3">Crop</th>
                  <th className="p-3">Qty</th><th className="p-3">Status</th><th className="p-3">Fraud %</th><th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.slice(0, 50).map(t => (
                  <tr key={t.transactionId} className="hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs text-gray-500">{t.transactionId}</td>
                    <td className="p-3 text-xs">...{String(t.farmerAadhaar).slice(-4)}</td>
                    <td className="p-3 text-xs">{t.cropType}</td>
                    <td className="p-3 text-xs">{t.quantity}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusCls(t.status)}`}>{t.status}</span></td>
                    <td className="p-3 text-xs">{t.fraudProbability ?? 'N/A'}</td>
                    <td className="p-3 text-xs text-gray-500">{new Date(t.timestamp).toLocaleDateString()}</td>
                  </tr>
                ))}
                {preview.length > 50 && (
                  <tr><td colSpan={7} className="p-3 text-center text-xs text-gray-400">Showing 50 of {preview.length} — download CSV for full data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
