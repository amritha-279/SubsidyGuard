import { useState } from 'react';
import axios from 'axios';
import { Package, MapPin, User, Leaf, ShieldAlert } from 'lucide-react';
import VerificationPanel from '../components/VerificationPanel';

export default function POSPage() {
  const userStr = localStorage.getItem('subsidy_user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  const [formData, setFormData] = useState({
    aadhaar_id: '',
    name: '',
    land_size: '',
    crop_type: 'wheat',
    fertilizer_type: 'Urea',
    quantity: '',
    retailer_id: user?.shopId || 'RET001',
    village: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const response = await axios.post(`\${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/transactions/verify`, formData);
      setResult(response.data);
    } catch (error) {
      console.error("Error verifying transaction", error);
      alert('Error connecting to Subsidy Guard API');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFormData({ ...formData, quantity: '', aadhaar_id: '', name: '', village: '' });
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">New Fertilizer Sale</h1>
        <p className="text-gray-600 mt-2">Enter farmer details and purchase quantities for verification.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Farmer Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                <User className="w-5 h-5 text-blue-600" />
                Farmer Details
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar ID</label>
                  <input
                    type="text"
                    required
                    maxLength="12"
                    pattern="\d{12}"
                    placeholder="12 digit number"
                    className="input-field"
                    value={formData.aadhaar_id}
                    onChange={e => setFormData({...formData, aadhaar_id: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Farmer Name</label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.village}
                  onChange={e => setFormData({...formData, village: e.target.value})}
                />
              </div>
            </div>

            {/* Farm Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                <MapPin className="w-5 h-5 text-orange-600" />
                Land & Crop Details
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Land Size (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    className="input-field"
                    value={formData.land_size}
                    onChange={e => setFormData({...formData, land_size: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Crop</label>
                  <select
                    className="input-field"
                    value={formData.crop_type}
                    onChange={e => setFormData({...formData, crop_type: e.target.value})}
                  >
                    <option value="wheat">Wheat</option>
                    <option value="rice">Rice</option>
                    <option value="cotton">Cotton</option>
                    <option value="maize">Maize</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Purchase Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                <Package className="w-5 h-5 text-green-600" />
                Purchase Summary
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fertilizer Type</label>
                  <select
                    className="input-field"
                    value={formData.fertilizer_type}
                    onChange={e => setFormData({...formData, fertilizer_type: e.target.value})}
                  >
                    <option value="Urea">Urea (Subsidized)</option>
                    <option value="DAP">DAP (Subsidized)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (number of bags)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="input-field"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || result} 
              className="btn btn-primary w-full py-3 text-lg mt-4 shadow-md flex items-center justify-center gap-2 font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <ShieldAlert className="w-6 h-6" />
                  Verify Transaction
                </>
              )}
            </button>
            <p className="text-xs text-center text-gray-500 mt-2">
              Subsidy Guard will analyze records before approval.
            </p>
          </form>
        </div>

        {/* Verification Area */}
        <div>
          {result ? (
            <VerificationPanel result={result} onReset={handleReset} />
          ) : (
            <div className="h-full border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50 bg-opacity-50">
              <Leaf className="w-16 h-16 mb-4 opacity-50 text-green-600" />
              <p className="text-lg font-medium text-gray-600">Awaiting Verification</p>
              <p className="text-sm mt-2 max-w-xs">
                Fill the transaction details and click Verify to run AI checks on the subsidy purchase.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
