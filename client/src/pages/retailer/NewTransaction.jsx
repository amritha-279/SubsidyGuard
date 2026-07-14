import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, RefreshCw, CheckCircle, AlertTriangle, XCircle, Smartphone, Send } from 'lucide-react';
import { io } from 'socket.io-client';

const CROPS = ['Paddy','Wheat','Sugarcane','Banana','Coconut','Vegetables','Cotton','Maize','Groundnut','Soybean'];
const FERTILIZERS = ['Urea','DAP','MOP','NPK (10-26-26)','NPK (12-32-16)','SSP','Zinc Sulphate','Ammonium Sulphate'];

const INITIAL = { aadhaar:'', farmerName:'', mobile:'', village:'', district:'', landSize:'', cropType:'', fertilizerType:'', requestedQty:'' };

export default function NewTransaction() {
  const [form, setForm] = useState(INITIAL);
  const [inventory, setInventory] = useState([]);
  const [availableStock, setAvailableStock] = useState(null);
  const [recommendedQty, setRecommendedQty] = useState(null);
  const [result, setResult] = useState(null);
  const [fetchedFields, setFetchedFields] = useState([]);  // fields locked after fetch
  const [blocked, setBlocked] = useState(null);   // { message, details }
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [requestingApproval, setRequestingApproval] = useState(false);
  const [approvalSent, setApprovalSent] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [saleComplete, setSaleComplete] = useState(false);
  const [savedTxnId, setSavedTxnId] = useState(null);
  const resultRef = useRef(null);

  const retailerUser = JSON.parse(localStorage.getItem('retailer_user') || '{}');
  const retailerId = retailerUser.shopId || retailerUser.id || '';

  const fetchInventory = () => {
    if (!retailerId) return;
    axios.get(`/api/inventory/${retailerId}`)
      .then(res => {
        setInventory(res.data.inventory || []);
        // Re-check current selected fertilizer if any
        if (form.fertilizerType) {
          const match = (res.data.inventory || []).find(i => i.fertilizer === form.fertilizerType);
          setAvailableStock(match ? match.available : null);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchInventory();
    
    const socket = io(`\${import.meta.env.VITE_API_URL || ''}`);
    socket.on('inventory_updated', (data) => {
      if (data.retailerId === retailerId) fetchInventory();
    });

    return () => socket.disconnect();
  }, [retailerId]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    const updated = { ...form, [name]: value };
    if (['landSize', 'cropType', 'fertilizerType'].includes(name)) computeRec(updated);
    if (name === 'fertilizerType') {
      const match = inventory.find(i => i.fertilizer === value);
      setAvailableStock(match ? match.available : null);
    }
  };

  const computeRec = ({ landSize, cropType, fertilizerType }) => {
    if (!landSize || !cropType || !fertilizerType) { setRecommendedQty(null); return; }
    // Placeholder shown before ML service responds — will be overwritten by API response
    const base = { Urea: 50, DAP: 40, MOP: 30, NPK: 45, SSP: 35, 'Zinc Sulphate': 10, 'Ammonium Sulphate': 40 };
    const key = Object.keys(base).find(k => fertilizerType.startsWith(k)) || 'Urea';
    setRecommendedQty(Math.round(parseFloat(landSize) * (base[key] || 40)));
  };

  const fetchFarmer = async () => {
    if (form.aadhaar.length !== 12) {
      alert("Please enter a valid 12-digit Aadhaar number.");
      return;
    }
    try {
      const res = await axios.get(`/api/transactions/farmer/${form.aadhaar}`);
      const f = res.data;
      const locked = [];
      setForm(p => {
        const updated = { ...p };
        if (f.name)     { updated.farmerName = f.name;                                                          locked.push('farmerName'); }
        if (f.mobile)   { updated.mobile     = f.mobile;                                                        locked.push('mobile'); }
        if (f.village)  { updated.village    = f.village;                                                       locked.push('village'); }
        if (f.district) { updated.district   = f.district;                                                      locked.push('district'); }
        if (f.landSize) { updated.landSize   = String(f.landSize);                                              locked.push('landSize'); }
        if (f.cropType) { updated.cropType   = f.cropType.charAt(0).toUpperCase() + f.cropType.slice(1);       locked.push('cropType'); }
        return updated;
      });
      setFetchedFields(locked);
      if (f.landSize) computeRec({ ...form, landSize: String(f.landSize), cropType: f.cropType || form.cropType });
    } catch (e) {
      console.error(e);
      alert("Farmer not found. Please enter details manually.");
    }
  };

  // Step 1: Verify only — does NOT save the transaction yet
  const handleVerify = async e => {
    e.preventDefault();
    if (availableStock === 0) return alert('Out of stock. Cannot sell this fertilizer.');
    setLoading(true); setResult(null); setSavedTxnId(null); setBlocked(null);
    try {
      const payload = {
        aadhaar_id:       form.aadhaar,
        name:             form.farmerName,
        land_size:        form.landSize,
        crop_type:        form.cropType.toLowerCase(),
        fertilizer_type:  form.fertilizerType,
        quantity:         form.requestedQty,
        retailer_id:      retailerId,
        village:          form.village,
        district:         form.district,
        otp_verified:     0,
        officer_approved: 0,
        frontend_recommended_qty: recommendedQty
      };
      const res = await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/transactions/verify', payload);
      const d = res.data;
      setRecommendedQty(d.recommendedQuantity ?? recommendedQty);
      const req = parseFloat(form.requestedQty);
      const rec = d.recommendedQuantity ?? recommendedQty;
      const ratio = rec > 0 ? ((req / rec) * 100).toFixed(1) : '100.0';
      const excess = rec > 0 ? (((req - rec) / rec) * 100).toFixed(1) : '0.0';
      
      // Determine the specific reason text as requested by the user
      let thresholdReason = 'Requested quantity is within the recommended limit.';
      if (req / rec > 1.20) {
        thresholdReason = `Requested quantity exceeds the recommended quantity by ${excess}%, which is in the critical threshold.`;
      } else if (req / rec > 1.05) {
        thresholdReason = `Requested quantity exceeds the recommended quantity by ${excess}%, which is within the warning threshold.`;
      }
      
      // Merge this exact reason with the ML reasons
      const explanations = [thresholdReason, ...(d.mlResult?.reasons || [])];
      
      setResult({
        transactionId:    d.transactionId,
        recommendedQty:   rec,
        requestedQty:     req,
        quantityRatioPct: ratio,
        fraudProbability: d.mlResult?.fraud_probability ?? 'N/A',
        riskLevel:        d.status,
        explanation:      explanations,
      });
      setSavedTxnId(d.transactionId);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (err) {
      const data = err.response?.data;
      if (data?.blocked) {
        setBlocked({
          message: data.error,
          details: data.checks?.[0]?.details || data.error,
        });
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      } else {
        alert(data?.error || 'Verification failed. Please try again.');
      }
    } finally { setLoading(false); }
  };

  // Step 2: Complete sale — confirm the already-analyzed transaction
  const handleCompleteSale = async () => {
    setCompleting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/transactions/confirm', { transactionId: savedTxnId });
      setSaleComplete(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not complete sale. Please try again.');
    } finally { setCompleting(false); }
  };

  const handleRequestApproval = async () => {
    setRequestingApproval(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/transactions/request-approval', { transactionId: savedTxnId });
      setApprovalSent(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not send request. Please try again.');
    } finally { setRequestingApproval(false); }
  };

  const handleReset = () => {
    setForm(INITIAL); setResult(null); setRecommendedQty(null); setAvailableStock(null);
    setOtpSent(false); setOtp(''); setSaleComplete(false); setSavedTxnId(null); setBlocked(null);
    setFetchedFields([]); setApprovalSent(false);
  };

  if (saleComplete) return (
    <div className="card max-w-md mx-auto mt-16 text-center">
      <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">Sale Completed!</h2>
      <p className="text-gray-500 mb-2">Transaction has been recorded successfully.</p>
      {savedTxnId && <p className="text-xs text-gray-400 font-mono mb-6">ID: {savedTxnId}</p>}
      <div className="flex gap-3 justify-center">
        <button className="btn btn-primary" onClick={handleReset}>New Transaction</button>
        <button className="btn btn-secondary" onClick={() => window.print()}>Print Receipt</button>
      </div>
    </div>
  );

  const riskConfig = {
    GREEN:  { border: 'border-green-400', bg: 'bg-green-50',  icon: <CheckCircle className="w-5 h-5 text-green-600" />,  label: 'LOW RISK — Sale Allowed',                    textColor: 'text-green-700'  },
    YELLOW: { border: 'border-yellow-400',bg: 'bg-yellow-50', icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,label: 'MEDIUM RISK — Officer Approval Required',     textColor: 'text-yellow-700' },
    RED:    { border: 'border-red-400',   bg: 'bg-red-50',    icon: <XCircle className="w-5 h-5 text-red-600" />,        label: 'HIGH RISK — Transaction Blocked',             textColor: 'text-red-700'    },
  };

  const inputCls = 'input-field text-sm';
  const lockedCls = 'input-field text-sm bg-gray-50 text-gray-500 cursor-not-allowed';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';
  const isLocked = field => fetchedFields.includes(field);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">New Transaction</h1>
        <p className="text-gray-600 mt-1">Verify and process a fertilizer sale for a farmer.</p>
      </div>

      <form onSubmit={handleVerify}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Farmer Details */}
          <div className="card">
            <h3 className="text-base font-bold text-gray-900 mb-4 border-b pb-3">Farmer Details</h3>
            <div className="mb-3">
              <label className={labelCls}>Aadhaar Number</label>
              <div className="flex gap-2">
                <input className={inputCls} name="aadhaar" value={form.aadhaar} onChange={handleChange}
                  placeholder="12-digit Aadhaar" maxLength={12} required />
                <button type="button" onClick={fetchFarmer} className="btn btn-secondary text-sm flex-shrink-0 gap-1">
                  <Search className="w-4 h-4" /> Fetch
                </button>
              </div>
            </div>
            {[['Farmer Name','farmerName','Auto-fetched or enter manually'],['Mobile Number','mobile','10-digit mobile'],
              ['Village','village','Village name'],['District','district','District name']].map(([label, name, ph]) => (
              <div className="mb-3" key={name}>
                <label className={labelCls}>
                  {label}
                  {isLocked(name) && <span className="ml-1.5 text-xs text-green-600 font-normal">(verified)</span>}
                </label>
                <input
                  className={isLocked(name) ? lockedCls : inputCls}
                  name={name} value={form[name]}
                  onChange={isLocked(name) ? undefined : handleChange}
                  readOnly={isLocked(name)}
                  placeholder={ph} required
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-6">
            {/* Agriculture Details */}
            <div className="card">
              <h3 className="text-base font-bold text-gray-900 mb-4 border-b pb-3">Agriculture Details</h3>
              <div className="mb-3">
                <label className={labelCls}>
                  Land Size (Acres)
                  {isLocked('landSize') && <span className="ml-1.5 text-xs text-green-600 font-normal">(verified)</span>}
                </label>
                <input
                  className={isLocked('landSize') ? lockedCls : inputCls}
                  type="number" name="landSize" value={form.landSize}
                  onChange={isLocked('landSize') ? undefined : handleChange}
                  readOnly={isLocked('landSize')}
                  placeholder="e.g. 2.5" min="0.1" step="0.1" required
                />
              </div>
              <div>
                <label className={labelCls}>
                  Crop Type
                  {isLocked('cropType') && <span className="ml-1.5 text-xs text-green-600 font-normal">(verified)</span>}
                </label>
                <select
                  className={isLocked('cropType') ? lockedCls : inputCls}
                  name="cropType" value={form.cropType}
                  onChange={isLocked('cropType') ? undefined : handleChange}
                  disabled={isLocked('cropType')} required
                >
                  <option value="">Select Crop</option>
                  {CROPS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Purchase Details */}
            <div className="card">
              <h3 className="text-base font-bold text-gray-900 mb-4 border-b pb-3">Purchase Details</h3>
              <div className="mb-3">
                <label className={labelCls}>Fertilizer Type</label>
                <select className={inputCls} name="fertilizerType" value={form.fertilizerType} onChange={handleChange} required>
                  <option value="">Select Fertilizer</option>
                  {FERTILIZERS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              {recommendedQty !== null && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-800 mb-3">
                  Recommended Quantity: <strong>{recommendedQty} kg</strong>
                </div>
              )}
              <div className="mb-3">
                <label className={labelCls}>Requested Quantity (kg)</label>
                <input className={inputCls} type="number" name="requestedQty" value={form.requestedQty} onChange={handleChange} placeholder="Enter quantity" min="1" required />
              </div>
              {availableStock !== null && (
                <div className={`border rounded-lg px-3 py-2 text-sm ${
                  availableStock === 0 ? 'bg-red-50 border-red-200 text-red-800'
                  : availableStock <= 50 ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}>
                  Available Stock: <strong>{availableStock} kg</strong>
                  {availableStock === 0 && ' — Out of stock'}
                  {availableStock > 0 && availableStock <= 50 && ' — Low stock'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn btn-primary gap-2">
            {loading ? 'Verifying…' : <><Search className="w-4 h-4" /> Verify Transaction</>}
          </button>
          <button type="button" onClick={handleReset} className="btn btn-secondary gap-2">
            <RefreshCw className="w-4 h-4" /> Reset Form
          </button>
        </div>
      </form>

      {/* Blocked Banner */}
      {blocked && (
        <div ref={resultRef} className="mt-6 border-2 border-red-400 bg-red-50 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <XCircle className="w-7 h-7 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-bold text-red-700 mb-1">Transaction Blocked</h3>
              <p className="text-sm text-red-600 mb-3">{blocked.message}</p>
              <div className="bg-red-100 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {blocked.details}
              </div>
              <button className="btn btn-secondary mt-4 text-sm" onClick={handleReset}>
                Start New Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (() => {
        const cfg = riskConfig[result.riskLevel];
        return (
          <div ref={resultRef} className={`mt-6 border-2 ${cfg.border} ${cfg.bg} rounded-xl p-6`}>
            <div className={`flex items-center gap-2 text-base font-bold ${cfg.textColor} mb-4`}>
              {cfg.icon} {cfg.label}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              {[
                ['Recommended Qty', `${result.recommendedQty} kg`],
                ['Requested Qty',   `${result.requestedQty} kg`],
                ['Quantity Ratio',  `${result.quantityRatioPct}%`],
                ['Fraud Probability',`${result.fraudProbability}%`],
                ['Risk Level',       result.riskLevel],
              ].map(([label, value]) => (
                <div key={label} className="bg-white/70 rounded-lg p-3">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">{value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white/60 rounded-lg p-3 mb-4 text-sm text-gray-700">
              <p className="font-semibold mb-1">AI Explanation:</p>
              <ul className="list-disc list-inside space-y-1">
                {result.explanation?.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>

            {result.riskLevel === 'YELLOW' && otpSent && (
              <div className="mb-4 max-w-xs">
                <label className={labelCls}>Enter OTP sent to farmer's mobile</label>
                <input className="input-field text-sm" value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit OTP" maxLength={6} />
              </div>
            )}

            <div className="flex gap-3 flex-wrap">
              {result.riskLevel === 'GREEN' && (
                <button className="btn btn-primary gap-2" disabled={completing} onClick={() => handleCompleteSale()}>
                  <CheckCircle className="w-4 h-4" /> {completing ? 'Saving…' : 'Complete Sale'}
                </button>
              )}
              {result.riskLevel === 'YELLOW' && (
                <button 
                  className={`btn gap-2 ${approvalSent ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'btn-secondary'}`}
                  onClick={handleRequestApproval}
                  disabled={approvalSent || requestingApproval}
                >
                  <Send className="w-4 h-4" /> 
                  {requestingApproval ? 'Sending...' : approvalSent ? 'Request Pending Approval' : 'Request Officer Approval'}
                </button>
              )}
              <button className="btn btn-secondary gap-2 text-red-600 hover:bg-red-50" onClick={handleReset}>
                <XCircle className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
