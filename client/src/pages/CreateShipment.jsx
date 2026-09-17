import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, ArrowLeft, Plus, Trash2, Calendar, ShieldCheck, Loader2 } from 'lucide-react';
import { shipmentService } from '../services/shipmentService';
import { warehouseService } from '../services/warehouseService';
import { productService } from '../services/productService';
import { batchService } from '../services/batchService';
import { useToast } from '../context/ToastContext';

export const CreateShipment = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [batchesMap, setBatchesMap] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    sourceWarehouseId: '',
    destination: {
      facilityName: '',
      address: '',
      city: '',
      state: ''
    },
    carrier: 'ColdChain Express Logistics',
    temperatureRequirement: 'Controlled Room Temperature (15°C - 25°C)',
    expectedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    items: [
      { product: '', batch: '', quantity: 100 }
    ]
  });

  useEffect(() => {
    const initData = async () => {
      try {
        const [wRes, pRes] = await Promise.all([
          warehouseService.getWarehouses(),
          productService.getProducts({ limit: 100 })
        ]);
        setWarehouses(wRes.data || []);
        setProducts(pRes.data || []);
        if (wRes.data?.length > 0) {
          setForm(prev => ({ ...prev, sourceWarehouseId: wRes.data[0]._id }));
        }
      } catch (err) {
        toast.error('Failed to load warehouses or products.');
      }
    };
    initData();
  }, []);

  const handleProductSelect = async (index, productId) => {
    const updatedItems = [...form.items];
    updatedItems[index].product = productId;
    updatedItems[index].batch = '';
    setForm(prev => ({ ...prev, items: updatedItems }));

    if (!productId) return;

    if (!batchesMap[productId]) {
      try {
        const res = await batchService.getBatches({ product: productId, status: 'RELEASED', limit: 50 });
        setBatchesMap(prev => ({ ...prev, [productId]: res.data || [] }));
        if (res.data?.length > 0) {
          // Select earliest expiry non-expired batch (FEFO)
          const validBatches = res.data.filter(b => b.daysUntilExpiry > 0);
          if (validBatches.length > 0) {
            updatedItems[index].batch = validBatches[0]._id;
            setForm(prev => ({ ...prev, items: updatedItems }));
          }
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      const validBatches = (batchesMap[productId] || []).filter(b => b.daysUntilExpiry > 0);
      if (validBatches.length > 0) {
        updatedItems[index].batch = validBatches[0]._id;
        setForm(prev => ({ ...prev, items: updatedItems }));
      }
    }
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...form.items];
    updated[index][field] = field === 'quantity' ? Number(value) : value;
    setForm(prev => ({ ...prev, items: updated }));
  };

  const addItemRow = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { product: '', batch: '', quantity: 100 }]
    }));
  };

  const removeItemRow = (index) => {
    if (form.items.length <= 1) return;
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.destination.facilityName || !form.destination.city) {
      toast.warning('Please enter destination facility name and city.');
      return;
    }

    for (const item of form.items) {
      if (!item.product || !item.batch || item.quantity <= 0) {
        toast.warning('Please complete product, batch, and valid quantity for all line items.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await shipmentService.createShipment(form);
      toast.success(`Consignment ${res.shipment?.shipmentId} booked and inventory reserved.`);
      navigate('/shipments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create consignment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/shipments"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Consignments
      </Link>

      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
          <div className="p-3 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Create Pharmaceutical Consignment</h1>
            <p className="text-xs text-slate-500">
              Validates stock availability, enforces non-expired batch compliance, and reserves warehouse units.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Logistics Setup */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Dispatch Origin Warehouse *
              </label>
              <select
                required
                value={form.sourceWarehouseId}
                onChange={(e) => setForm(p => ({ ...p, sourceWarehouseId: e.target.value }))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 font-medium"
              >
                {warehouses.map(w => (
                  <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Logistics Carrier *
              </label>
              <select
                value={form.carrier}
                onChange={(e) => setForm(p => ({ ...p, carrier: e.target.value }))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
              >
                <option value="ColdChain Express Logistics">ColdChain Express Logistics</option>
                <option value="PharmaLogix Dedicated Fleet">PharmaLogix Dedicated Fleet</option>
                <option value="BlueDart Health Express">BlueDart Health Express</option>
                <option value="MedTrans Temperature Fleet">MedTrans Temperature Fleet</option>
              </select>
            </div>
          </div>

          {/* Destination Details */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
              Destination Health Facility
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Hospital / Depo Name *</label>
                <input
                  type="text"
                  required
                  value={form.destination.facilityName}
                  onChange={(e) => setForm(p => ({ ...p, destination: { ...p.destination, facilityName: e.target.value } }))}
                  placeholder="e.g. Lilavati Hospital & Research Centre"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-medium">City *</label>
                <input
                  type="text"
                  required
                  value={form.destination.city}
                  onChange={(e) => setForm(p => ({ ...p, destination: { ...p.destination, city: e.target.value } }))}
                  placeholder="Mumbai"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">State</label>
                <input
                  type="text"
                  value={form.destination.state}
                  onChange={(e) => setForm(p => ({ ...p, destination: { ...p.destination, state: e.target.value } }))}
                  placeholder="Maharashtra"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Street Address</label>
                <input
                  type="text"
                  value={form.destination.address}
                  onChange={(e) => setForm(p => ({ ...p, destination: { ...p.destination, address: e.target.value } }))}
                  placeholder="Bandra Reclamation"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Temperature Requirement
              </label>
              <select
                value={form.temperatureRequirement}
                onChange={(e) => setForm(p => ({ ...p, temperatureRequirement: e.target.value }))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
              >
                <option value="Controlled Room Temperature (15°C - 25°C)">Controlled Room Temperature (15°C - 25°C)</option>
                <option value="Cold Chain (2°C - 8°C)">Cold Chain (2°C - 8°C)</option>
                <option value="Frozen (-20°C)">Frozen (-20°C)</option>
                <option value="Ambient">Ambient</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Expected Delivery Date *
              </label>
              <input
                type="date"
                required
                value={form.expectedDeliveryDate}
                onChange={(e) => setForm(p => ({ ...p, expectedDeliveryDate: e.target.value }))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          {/* Cargo Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-xs">
                Pharmaceutical Cargo Line Items
              </span>
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center gap-1 text-teal-600 font-semibold hover:text-teal-700"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            <div className="space-y-2.5">
              {form.items.map((item, idx) => {
                const availableBatches = (batchesMap[item.product] || []).filter(b => b.daysUntilExpiry > 0);
                return (
                  <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row gap-3 items-end">
                    <div className="flex-1 w-full">
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Product Formulation</label>
                      <select
                        required
                        value={item.product}
                        onChange={(e) => handleProductSelect(idx, e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                      >
                        <option value="">Select product...</option>
                        {products.map(p => (
                          <option key={p._id} value={p._id}>{p.name} [{p.productCode}]</option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full md:w-64">
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Batch (FEFO Earliest First)</label>
                      <select
                        required
                        value={item.batch}
                        onChange={(e) => handleItemChange(idx, 'batch', e.target.value)}
                        className="w-full px-3 py-2 font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                      >
                        <option value="">Select batch...</option>
                        {availableBatches.map(b => (
                          <option key={b._id} value={b._id}>
                            {b.batchNumber} (Exp: {new Date(b.expiryDate).toLocaleDateString()}) - {b.currentQuantity}u
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full md:w-32">
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Units Quantity</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      disabled={form.items.length <= 1}
                      className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg transition"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Consignment Handling & Dispatch Notes
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Special delivery instructions, hospital department contact..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/shipments')}
              className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition shadow-sm shadow-teal-600/20 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
              {submitting ? 'Booking & Reserving...' : 'Book Consignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};