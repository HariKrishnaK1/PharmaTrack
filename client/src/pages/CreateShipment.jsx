import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, ArrowLeft, Plus, Trash2, Calendar, ShieldCheck, Loader2, AlertTriangle, Lock, LogIn } from 'lucide-react';
import { shipmentService } from '../services/shipmentService';
import { warehouseService } from '../services/warehouseService';
import { productService } from '../services/productService';
import { batchService } from '../services/batchService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const CreateShipment = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isDemo, logout } = useAuth();

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

  // Immediate alert on load when entering in Demo Mode
  useEffect(() => {
    if (isDemo) {
      toast.warning('Demo Mode: View-Only Form. Entering details and database changes are disabled. Please log in with an authorized account.');
    }
  }, [isDemo]);

  useEffect(() => {
    const initData = async () => {
      try {
        const [wRes, pRes] = await Promise.all([
          warehouseService.getWarehouses(),
          productService.getProducts({ limit: 100 })
        ]);
        const whList = wRes.data || [];
        const prodList = pRes.data || [];
        setWarehouses(whList);
        setProducts(prodList);

        if (isDemo) {
          // Pre-populate realistic showcase consignment details so users can inspect the complete structure
          const sampleProd = prodList[2] || prodList[0];
          setForm({
            sourceWarehouseId: whList[0]?._id || 'wh_demo_1',
            destination: {
              facilityName: 'Lilavati Hospital & Research Centre',
              address: 'A-791, Bandra Reclamation, Bandra West',
              city: 'Mumbai',
              state: 'Maharashtra'
            },
            carrier: 'ColdChain Express Logistics',
            temperatureRequirement: 'Cold Chain (2°C - 8°C)',
            expectedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            notes: 'Demo Consignment: Strict cold-chain vaccine/biologic transit. Temperature datalogger activated.',
            items: [
              {
                product: sampleProd?._id || 'prod_demo_3',
                batch: 'batch_demo_3',
                quantity: 250
              }
            ]
          });
        } else if (whList.length > 0) {
          setForm(prev => ({ ...prev, sourceWarehouseId: whList[0]._id }));
        }
      } catch (err) {
        toast.error('Failed to load warehouses or products.');
      }
    };
    initData();
  }, [isDemo]);

  const handleProductSelect = async (index, productId) => {
    if (isDemo) return;
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
    if (isDemo) return;
    const updated = [...form.items];
    updated[index][field] = field === 'quantity' ? Number(value) : value;
    setForm(prev => ({ ...prev, items: updated }));
  };

  const addItemRow = () => {
    if (isDemo) {
      toast.info('Form modification is disabled in Demo Mode.');
      return;
    }
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { product: '', batch: '', quantity: 100 }]
    }));
  };

  const removeItemRow = (index) => {
    if (isDemo) {
      toast.info('Form modification is disabled in Demo Mode.');
      return;
    }
    if (form.items.length <= 1) return;
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDemo) {
      toast.error('Action Disabled: You must log in with an authorized account to create consignments.');
      return;
    }

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
      navigate('/app/shipments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create consignment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/app/shipments"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Consignments
      </Link>

      {/* Demo View-Only Notice Banner */}
      {isDemo && (
        <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl flex items-start gap-3.5 shadow-2xs">
          <div className="p-2 bg-amber-500/20 text-amber-700 rounded-xl mt-0.5">
            <Lock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Demo Mode: Consignment Form Preview (View-Only)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                Read Only
              </span>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
              You are exploring the live consignment dispatch interface. To protect operational integrity, details cannot be typed or submitted in demo mode. All fields below display sample parameters for inspection.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition shadow-2xs"
              >
                <LogIn className="w-3.5 h-3.5" /> Log In to Create Real Consignments
              </button>
            </div>
          </div>
        </div>
      )}

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
                disabled={isDemo}
                value={form.sourceWarehouseId}
                onChange={(e) => setForm(p => ({ ...p, sourceWarehouseId: e.target.value }))}
                className={`w-full px-3.5 py-2 border rounded-lg focus:outline-none font-medium ${
                  isDemo
                    ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                    : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                }`}
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
                disabled={isDemo}
                value={form.carrier}
                onChange={(e) => setForm(p => ({ ...p, carrier: e.target.value }))}
                className={`w-full px-3.5 py-2 border rounded-lg focus:outline-none ${
                  isDemo
                    ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                    : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                }`}
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
                  disabled={isDemo}
                  value={form.destination.facilityName}
                  onChange={(e) => setForm(p => ({ ...p, destination: { ...p.destination, facilityName: e.target.value } }))}
                  placeholder="e.g. Lilavati Hospital & Research Centre"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                    isDemo
                      ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                      : 'bg-white border-slate-200 focus:border-teal-600'
                  }`}
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-medium">City *</label>
                <input
                  type="text"
                  required
                  disabled={isDemo}
                  value={form.destination.city}
                  onChange={(e) => setForm(p => ({ ...p, destination: { ...p.destination, city: e.target.value } }))}
                  placeholder="Mumbai"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                    isDemo
                      ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                      : 'bg-white border-slate-200 focus:border-teal-600'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">State</label>
                <input
                  type="text"
                  disabled={isDemo}
                  value={form.destination.state}
                  onChange={(e) => setForm(p => ({ ...p, destination: { ...p.destination, state: e.target.value } }))}
                  placeholder="Maharashtra"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                    isDemo
                      ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                      : 'bg-white border-slate-200 focus:border-teal-600'
                  }`}
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Street Address</label>
                <input
                  type="text"
                  disabled={isDemo}
                  value={form.destination.address}
                  onChange={(e) => setForm(p => ({ ...p, destination: { ...p.destination, address: e.target.value } }))}
                  placeholder="Bandra Reclamation"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                    isDemo
                      ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                      : 'bg-white border-slate-200 focus:border-teal-600'
                  }`}
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
                disabled={isDemo}
                value={form.temperatureRequirement}
                onChange={(e) => setForm(p => ({ ...p, temperatureRequirement: e.target.value }))}
                className={`w-full px-3.5 py-2 border rounded-lg focus:outline-none ${
                  isDemo
                    ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                    : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                }`}
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
                disabled={isDemo}
                value={form.expectedDeliveryDate}
                onChange={(e) => setForm(p => ({ ...p, expectedDeliveryDate: e.target.value }))}
                className={`w-full px-3.5 py-2 border rounded-lg focus:outline-none ${
                  isDemo
                    ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                    : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                }`}
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
                disabled={isDemo}
                className={`flex items-center gap-1 font-semibold ${
                  isDemo ? 'text-slate-400 cursor-not-allowed' : 'text-teal-600 hover:text-teal-700'
                }`}
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
                        disabled={isDemo}
                        value={item.product}
                        onChange={(e) => handleProductSelect(idx, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                          isDemo
                            ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                            : 'bg-white border-slate-200 focus:border-teal-600'
                        }`}
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
                        disabled={isDemo}
                        value={item.batch}
                        onChange={(e) => handleItemChange(idx, 'batch', e.target.value)}
                        className={`w-full px-3 py-2 font-mono border rounded-lg focus:outline-none ${
                          isDemo
                            ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                            : 'bg-white border-slate-200 focus:border-teal-600'
                        }`}
                      >
                        {isDemo ? (
                          <option value="batch_demo_3">BAT-2026-INS-003 (Exp: 15/10/2026) - 620u</option>
                        ) : (
                          <>
                            <option value="">Select batch...</option>
                            {availableBatches.map(b => (
                              <option key={b._id} value={b._id}>
                                {b.batchNumber} (Exp: {new Date(b.expiryDate).toLocaleDateString()}) - {b.currentQuantity}u
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>

                    <div className="w-full md:w-32">
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Units Quantity</label>
                      <input
                        type="number"
                        required
                        disabled={isDemo}
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className={`w-full px-3 py-2 font-mono border rounded-lg focus:outline-none ${
                          isDemo
                            ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                            : 'bg-white border-slate-200 focus:border-teal-600'
                        }`}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      disabled={isDemo || form.items.length <= 1}
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
              disabled={isDemo}
              value={form.notes}
              onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Special delivery instructions, hospital department contact..."
              className={`w-full px-3.5 py-2 border rounded-lg focus:outline-none ${
                isDemo
                  ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                  : 'bg-slate-50 border-slate-200 focus:border-teal-600'
              }`}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/app/shipments')}
              className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Back to Shipments
            </button>
            <button
              type="submit"
              disabled={isDemo || submitting}
              className={`flex items-center gap-2 px-5 py-2 font-semibold rounded-lg transition shadow-sm ${
                isDemo
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
              }`}
            >
              {isDemo ? (
                <>
                  <Lock className="w-4 h-4" /> Log In Required to Submit Consignment
                </>
              ) : submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Booking & Reserving...
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4" /> Book Consignment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};