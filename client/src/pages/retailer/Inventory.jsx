import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Package, X } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';

export default function Inventory() {
  const [stock, setStock] = useState([]);
  const [modal, setModal] = useState(null);
  const [formData, setFormData] = useState({
    fertilizer: '',
    quantity: '',
    supplier: '',
    batchNumber: '',
    expiryDate: '',
    remarks: '',
    invoiceNumber: '',
    purchaseDate: '',
    threshold: ''
  });
  const [loading, setLoading] = useState(true);

  const { id: retailerId } = JSON.parse(localStorage.getItem('retailer_user') || '{}');

  const fetchStock = useCallback(() => {
    if (!retailerId) return;
    axios.get(`/api/inventory/${retailerId}`)
      .then(res => setStock(res.data.inventory))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [retailerId]);

  useEffect(() => {
    fetchStock();
    
    const socket = io(`\${import.meta.env.VITE_API_URL || ''}`);
    socket.on('inventory_updated', (data) => {
      if (data.retailerId === retailerId) fetchStock();
    });

    return () => socket.disconnect();
  }, [retailerId, fetchStock]);

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (formData.quantity === '' || isNaN(formData.quantity)) return;
    const qty = parseFloat(formData.quantity);
    if ((modal.type === 'add' || modal.type === 'add_new') && qty <= 0) return;
    if (modal.type === 'update' && qty < 0) return;
    
    try {
      if (modal.type === 'add' || modal.type === 'add_new') {
        await axios.post(`${import.meta.env.VITE_API_URL || ''}/api/inventory/add', {
          retailerId,
          fertilizer: modal.type === 'add_new' ? formData.fertilizer : modal.item.fertilizer,
          quantity: formData.quantity,
          threshold: formData.threshold,
          supplier: formData.supplier,
          batchNumber: formData.batchNumber,
          expiryDate: formData.expiryDate || null,
          remarks: `Invoice: ${formData.invoiceNumber || 'N/A'}, Date: ${formData.purchaseDate || 'N/A'}. ${formData.remarks}`
        });
      } else {
        await axios.put(`${import.meta.env.VITE_API_URL || ''}/api/inventory/update', {
          retailerId,
          fertilizer: modal.item.fertilizer,
          quantity: formData.quantity,
          threshold: formData.threshold || modal.item.threshold,
          supplier: formData.supplier,
          batchNumber: formData.batchNumber,
          expiryDate: formData.expiryDate || null,
          remarks: formData.remarks
        });
      }
      setModal(null);
      fetchStock();
    } catch (err) {
      alert(err.response?.data?.error || 'An error occurred');
    }
  };

  const lowStock = stock.filter(s => s.available <= 50 && s.available > 0);
  const outOfStock = stock.filter(s => s.available === 0);

  if (loading) return <div className="p-8 text-gray-500">Loading inventory...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600 mt-1">Monitor and manage your fertilizer stock levels.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Products',   value: stock.length,                                       border: 'border-l-blue-500',   bg: 'bg-blue-50',   color: 'text-blue-600'   },
          { label: 'Low Stock Items',  value: lowStock.length,                                    border: 'border-l-yellow-500', bg: 'bg-yellow-50', color: 'text-yellow-600' },
          { label: 'Out of Stock',     value: outOfStock.length,                                  border: 'border-l-red-500',    bg: 'bg-red-50',    color: 'text-red-600'    },
          { label: 'Total Sold Today', value: `${stock.reduce((a, s) => a + s.soldToday, 0)} kg`, border: 'border-l-green-500',  bg: 'bg-green-50',  color: 'text-green-600'  },
          { label: 'Total Available',  value: `${stock.reduce((a, s) => a + s.available, 0)} kg`, border: 'border-l-purple-500', bg: 'bg-purple-50', color: 'text-purple-600' },
        ].map(({ label, value, border, bg, color }) => (
          <div key={label} className={`card border-l-4 ${border} flex items-center gap-4`}>
            <div className={`p-2.5 ${bg} rounded-lg ${color}`}><Package className="w-5 h-5" /></div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card mb-6">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h3 className="text-base font-bold text-gray-900">Stock Levels</h3>
          <button className="btn btn-primary text-sm px-4" onClick={() => { 
            setModal({ type: 'add_new', item: {} }); 
            setFormData({ fertilizer: '', quantity: '', supplier: '', batchNumber: '', expiryDate: '', remarks: '', invoiceNumber: '', purchaseDate: '', threshold: 100 }); 
          }}>+ Add New Fertilizer</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
                <th className="p-3">Fertilizer</th><th className="p-3">Available Qty</th>
                <th className="p-3">Sold Today</th><th className="p-3">Status</th><th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stock.map(s => {
                const isLow = s.available <= 50 && s.available > 0;
                const isOut = s.available === 0;
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{s.fertilizer}</td>
                    <td className="p-3 text-gray-600">{s.available} kg</td>
                    <td className="p-3 text-gray-600">{s.soldToday} kg</td>
                    <td className="p-3">
                      {isOut ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Out of Stock</span>
                        : isLow ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">Low Stock</span>
                        : <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">In Stock</span>}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button className="btn btn-primary text-xs py-1 px-2" onClick={() => { 
                          setModal({ type: 'add', item: s }); 
                          setFormData({ quantity: '', supplier: '', batchNumber: '', expiryDate: '', remarks: '', invoiceNumber: '', purchaseDate: '', threshold: '' }); 
                        }}>+ Add</button>
                        <button className="btn btn-secondary text-xs py-1 px-2" onClick={() => { 
                          setModal({ type: 'update', item: s }); 
                          setFormData({ quantity: s.available, threshold: s.threshold, supplier: s.supplier || '', batchNumber: s.batchNumber || '', expiryDate: s.expiryDate ? s.expiryDate.split('T')[0] : '', remarks: s.remarks || '', invoiceNumber: '', purchaseDate: '' }); 
                        }}>Update</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="mb-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">Stock Alerts</h3>
          {outOfStock.map(s => (
            <div key={s.id} className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800 mb-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <strong>{s.fertilizer}</strong> is Out of Stock.
            </div>
          ))}
          {lowStock.map(s => (
            <div key={s.id} className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800 mb-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <strong>{s.fertilizer}</strong> is low stock — only {s.available} kg remaining.
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-3">
              {modal.type === 'add_new' ? 'Add New Fertilizer' : modal.type === 'add' ? 'Add Stock' : 'Update Stock'} 
              {modal.type !== 'add_new' && ` — ${modal.item.fertilizer}`}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              {modal.type === 'add_new' && (
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Fertilizer Name *</label>
                  <input name="fertilizer" className="input-field text-sm" value={formData.fertilizer} onChange={handleInputChange} placeholder="e.g. Urea" required autoFocus />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    {modal.type === 'add' || modal.type === 'add_new' ? 'Quantity to Add (kg)' : 'Current Stock Quantity (kg)'} *
                  </label>
                  <input name="quantity" className="input-field text-sm" type="number" value={formData.quantity} onChange={handleInputChange} placeholder="Enter quantity" min={(modal.type==='add' || modal.type==='add_new') ? "1" : "0"} required autoFocus={modal.type !== 'add_new'} />
                </div>
                {(modal.type === 'update' || modal.type === 'add_new') && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Threshold (kg) *</label>
                    <input name="threshold" className="input-field text-sm" type="number" value={formData.threshold} onChange={handleInputChange} required min="0" />
                  </div>
                )}
                {(modal.type === 'add' || modal.type === 'add_new') && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Invoice Number</label>
                      <input name="invoiceNumber" className="input-field text-sm" value={formData.invoiceNumber} onChange={handleInputChange} placeholder="INV-XXXX" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Purchase Date</label>
                      <input name="purchaseDate" type="date" className="input-field text-sm" value={formData.purchaseDate} onChange={handleInputChange} />
                    </div>
                  </>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Supplier Name</label>
                  <input name="supplier" className="input-field text-sm" value={formData.supplier} onChange={handleInputChange} placeholder="Supplier Name" />
                </div>
              </div>

              {modal.type === 'add' && formData.quantity && (
                <p className="text-xs font-medium text-blue-600 bg-blue-50 p-2 rounded">
                  Current: {modal.item.available} kg → New total: {modal.item.available + parseFloat(formData.quantity || 0)} kg
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn btn-primary text-sm flex-1">Save Stock</button>
                <button type="button" className="btn btn-secondary text-sm flex-1" onClick={() => setModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
