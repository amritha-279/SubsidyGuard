import { useState } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';

const riskBadge = r => {
  const m = { GREEN: 'bg-green-100 text-green-700', YELLOW: 'bg-yellow-100 text-yellow-700', RED: 'bg-red-100 text-red-700' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${m[r]}`}>{r}</span>;
};

export default function FarmerLookup() {
  const [searchType, setSearchType] = useState('aadhaar');
  const [query, setQuery] = useState('');
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async e => {
    e.preventDefault();
    setLoading(true); setFarmer(null); setNotFound(false);
    try {
      const res = await axios.get(`/api/transactions/farmer-lookup?type=${searchType}&query=${query}`);
      setFarmer(res.data);
    } catch {
      setNotFound(true);
    } finally { setLoading(false); }
  };

  const labelCls = 'text-xs font-medium text-gray-600 mb-1 block';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Farmer Lookup</h1>
        <p className="text-gray-600 mt-1">Search farmer details by Aadhaar, Farmer ID, or mobile number.</p>
      </div>

      <div className="card mb-6">
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className={labelCls}>Search By</label>
              <select className="input-field text-sm" value={searchType} onChange={e => setSearchType(e.target.value)}>
                <option value="aadhaar">Aadhaar Number</option>
                <option value="farmerId">Farmer ID</option>
                <option value="mobile">Mobile Number</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>{searchType === 'aadhaar' ? 'Aadhaar Number' : searchType === 'farmerId' ? 'Farmer ID' : 'Mobile Number'}</label>
              <input className="input-field text-sm" value={query} onChange={e => setQuery(e.target.value)}
                placeholder={searchType === 'aadhaar' ? '12-digit Aadhaar' : searchType === 'farmerId' ? 'FRM-2024-XXXX' : '10-digit mobile'} required />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary gap-2">
              <Search className="w-4 h-4" /> {loading ? 'Searching…' : 'Search'}
            </button>
          </div>
        </form>
      </div>

      {notFound && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800 mb-4">
          No farmer found matching the search criteria.
        </div>
      )}

      {farmer && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-base font-bold text-gray-900 mb-4 border-b pb-3">{farmer.name}</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['Farmer ID',farmer.farmerId],['Aadhaar',farmer.aadhaar],['Mobile',farmer.mobile],
                ['Land Size',farmer.landSize],['Village',farmer.village],['District',farmer.district],
                ['Crop Details',farmer.cropDetails],['Subsidy History',farmer.subsidyHistory]].map(([l,v]) => (
                <div key={l}><p className="text-xs text-gray-500 uppercase tracking-wide">{l}</p><p className="font-medium text-gray-900 mt-0.5">{v}</p></div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="card">
              <h3 className="text-base font-bold text-gray-900 mb-4 border-b pb-3">Purchase Summary</h3>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div><p className="text-xs text-gray-500 uppercase tracking-wide">Last Purchase</p><p className="font-medium text-gray-900 mt-0.5">{farmer.lastPurchaseDate}</p></div>
                <div><p className="text-xs text-gray-500 uppercase tracking-wide">Purchase Frequency</p><p className="font-medium text-gray-900 mt-0.5">{farmer.purchaseFrequency}</p></div>
                <div><p className="text-xs text-gray-500 uppercase tracking-wide">Risk Level</p><div className="mt-0.5">{riskBadge(farmer.riskLevel)}</div></div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-base font-bold text-gray-900 mb-4 border-b pb-3">Previous Purchases</h3>
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
                  <th className="p-2">Date</th><th className="p-2">Fertilizer</th><th className="p-2">Qty</th><th className="p-2">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {farmer.previousPurchases.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-2 text-gray-600">{p.date}</td>
                      <td className="p-2 text-gray-800">{p.fertilizer}</td>
                      <td className="p-2 text-gray-600">{p.qty}</td>
                      <td className="p-2"><span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
