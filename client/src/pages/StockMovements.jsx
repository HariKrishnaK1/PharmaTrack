import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  Sliders,
  AlertCircle,
  Camera,
  Lock,
  LogIn,
  AlertTriangle
} from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { productService } from '../services/productService';
import { batchService } from '../services/batchService';
import { warehouseService } from '../services/warehouseService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { BarcodeScannerModal } from '../components/common/BarcodeScannerModal';

export const StockMovements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movementType, setMovementType] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [form, setForm] = useState({
    movementType: 'INBOUND',
    productId: '',
    batchId: '',
    sourceWarehouseId: '',
    destinationWarehouseId: '',
    quantity: 100,
    referenceNumber: '',
    notes: ''
  });

  const { canUpdateStock, isDemo, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getMovements({
        movementType: movementType !== 'ALL' ? movementType : undefined,
        page,
        limit: 15
      });
      setMovements(res.data || []);
      setPagination(res.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      toast.error('Failed to load stock movements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [page, movementType]);

  const openMovementModal = async () => {
    if (isDemo) {
      toast.warning('Demo Mode: Movement form is view-only. Entering details and database changes are disabled. Please log in with an authorized account.');
    }
    try {
      const [pRes, wRes] = await Promise.all([
        productService.getProducts({ limit: 100 }),
        warehouseService.getWarehouses()
      ]);
      const prodList = pRes.data || [];
      const whList = wRes.data || [];
      setProducts(prodList);
      setWarehouses(whList);

      if (isDemo) {
        setForm({
          movementType: 'TRANSFER',
          productId: prodList[0]?._id || 'prod_demo_1',
          batchId: 'batch_demo_1',
          sourceWarehouseId: whList[0]?._id || 'wh_demo_1',
          destinationWarehouseId: whList[3]?._id || 'wh_demo_4',
          quantity: 500,
          referenceNumber: 'TRF-DEMO-2026',
          notes: 'Simulated inter-hub stock balancing transfer between Mumbai Hub and Bengaluru Depo.'
        });
      }
      setShowModal(true);
    } catch (err) {
      toast.error('Failed to initialize movement modal options.');
    }
  };

  const handleProductChange = async (productId) => {
    if (isDemo) return;
    setForm(prev => ({ ...prev, productId, batchId: '' }));
    if (!productId) {
      setBatches([]);
      return;
    }
    try {
      const res = await batchService.getBatches({ product: productId, limit: 50 });
      setBatches(res.data || []);
      if (res.data?.length > 0) {
        setForm(prev => ({ ...prev, batchId: res.data[0]._id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitMovement = async (e) => {
    e.preventDefault();
    if (isDemo) {
      toast.error('Action Disabled: You must log in with an authorized account to record stock movements.');
      return;
    }

    setSubmitting(true);
    try {
      await inventoryService.recordMovement(form);
      toast.success(`${form.movementType} movement recorded successfully.`);
      setShowModal(false);
      setForm({
        movementType: 'INBOUND',
        productId: '',
        batchId: '',
        sourceWarehouseId: '',
        destinationWarehouseId: '',
        quantity: 100,
        referenceNumber: '',
        notes: ''
      });
      fetchMovements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record stock movement.');
    } finally {
      setSubmitting(false);
    }
  };

  const getMovementBadge = (type) => {
    switch (type) {
      case 'INBOUND':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><ArrowDownLeft className="w-3 h-3" /> Inbound</span>;
      case 'OUTBOUND':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"><ArrowUpRight className="w-3 h-3" /> Outbound</span>;
      case 'TRANSFER':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200"><ArrowLeftRight className="w-3 h-3" /> Transfer</span>;
      case 'ADJUSTMENT':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><Sliders className="w-3 h-3" /> Adjustment</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-teal-600" /> Stock Movements & Audit Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically logged inbound batches, outbound dispatches, inter-hub transfers, and count reconciliations.
          </p>
        </div>

        {canUpdateStock && (
          <button
            onClick={openMovementModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition shadow-sm shadow-teal-600/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Record Movement
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Type:</span>
          {['ALL', 'INBOUND', 'OUTBOUND', 'TRANSFER', 'ADJUSTMENT'].map((type) => (
            <button
              key={type}
              onClick={() => { setMovementType(type); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                movementType === type
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {type === 'ALL' ? 'All Movements' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-500 dark:text-slate-200 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-3">Product Formulation</th>
                <th className="py-3 px-3 font-mono">Batch</th>
                <th className="py-3 px-3">Source Hub</th>
                <th className="py-3 px-3">Destination Hub</th>
                <th className="py-3 px-3 text-right">Quantity</th>
                <th className="py-3 px-3 font-mono">Reference No.</th>
                <th className="py-3 px-3">Logged By</th>
                <th className="py-3 px-4">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-teal-600 mb-2" />
                    Loading stock movements...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No movement records found.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      {getMovementBadge(m.movementType)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-900">{m.product?.name}</span>
                      <div className="text-[10px] font-mono text-slate-400">{m.product?.productCode}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                      {m.batch?.batchNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {m.sourceWarehouse?.name ? `${m.sourceWarehouse.name} [${m.sourceWarehouse.code}]` : '— (External Supplier)'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {m.destinationWarehouse?.name ? `${m.destinationWarehouse.name} [${m.destinationWarehouse.code}]` : '— (Consignment Out)'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {m.quantity?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {m.referenceNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <div className="font-medium">{m.performedBy?.name || 'System'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{m.performedBy?.role}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(m.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      <span className="text-[10px] text-slate-400 block">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-500">
          <span>
            Showing page <span className="font-semibold text-slate-900">{pagination.page}</span> of{' '}
            <span className="font-semibold text-slate-900">{pagination.totalPages}</span> ({pagination.total} records)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-3.5 h-3.5 inline mr-1" /> Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Record Movement Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-xl w-full p-6 rounded-2xl shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <ArrowLeftRight className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">Record Stock Movement</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Demo Banner */}
            {isDemo && (
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Demo Mode: View-Only Modal.</span>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    Fields are disabled. Please sign in with an authorized account to record real stock movements.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitMovement} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Movement Type *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['INBOUND', 'OUTBOUND', 'TRANSFER', 'ADJUSTMENT'].map(t => (
                    <button
                      key={t}
                      type="button"
                      disabled={isDemo}
                      onClick={() => setForm(prev => ({ ...prev, movementType: t }))}
                      className={`py-2 rounded-lg font-bold border transition text-center ${
                        form.movementType === t
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      } ${isDemo ? 'cursor-not-allowed opacity-90' : ''}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Product Formulation *
                </label>
                <select
                  required
                  disabled={isDemo}
                  value={form.productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                    isDemo ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                  }`}
                >
                  <option value="">Select a pharmaceutical formulation...</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name} [{p.productCode}]</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider">
                    Batch Number *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Scan Barcode
                  </button>
                </div>
                <div className="relative flex items-center">
                  <select
                    required
                    disabled={isDemo}
                    value={form.batchId}
                    onChange={(e) => setForm(prev => ({ ...prev, batchId: e.target.value }))}
                    className={`w-full pl-3 pr-10 py-2 border rounded-lg focus:outline-none font-mono ${
                      isDemo ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                    }`}
                  >
                    <option value="">Select an active batch...</option>
                    {batches.map(b => (
                      <option key={b._id} value={b._id}>
                        {b.batchNumber} (Expires: {new Date(b.expiryDate).toLocaleDateString()}) - {b.currentQuantity} units
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={isDemo}
                    onClick={() => setShowScanner(true)}
                    title="Scan Batch Barcode"
                    className="absolute right-2 p-1 text-slate-400 hover:text-teal-600 disabled:opacity-40 transition"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(form.movementType === 'OUTBOUND' || form.movementType === 'TRANSFER' || form.movementType === 'ADJUSTMENT') && (
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Source Warehouse *
                    </label>
                    <select
                      required
                      disabled={isDemo}
                      value={form.sourceWarehouseId}
                      onChange={(e) => setForm(prev => ({ ...prev, sourceWarehouseId: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                        isDemo ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                      }`}
                    >
                      <option value="">Select source warehouse...</option>
                      {warehouses.map(w => (
                        <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                      ))}
                    </select>
                  </div>
                )}

                {(form.movementType === 'INBOUND' || form.movementType === 'TRANSFER') && (
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Destination Warehouse *
                    </label>
                    <select
                      required
                      disabled={isDemo}
                      value={form.destinationWarehouseId}
                      onChange={(e) => setForm(prev => ({ ...prev, destinationWarehouseId: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                        isDemo ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                      }`}
                    >
                      <option value="">Select destination warehouse...</option>
                      {warehouses.map(w => (
                        <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Quantity Units *
                  </label>
                  <input
                    type="number"
                    required
                    disabled={isDemo}
                    min="1"
                    value={form.quantity}
                    onChange={(e) => setForm(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    className={`w-full px-3 py-2 font-mono border rounded-lg focus:outline-none ${
                      isDemo ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Reference / PO Number
                  </label>
                  <input
                    type="text"
                    disabled={isDemo}
                    value={form.referenceNumber}
                    onChange={(e) => setForm(prev => ({ ...prev, referenceNumber: e.target.value.toUpperCase() }))}
                    placeholder="e.g. MOV-PO-99214"
                    className={`w-full px-3 py-2 font-mono border rounded-lg focus:outline-none ${
                      isDemo ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Operational Notes
                </label>
                <textarea
                  rows={2}
                  disabled={isDemo}
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Carrier tracking, inspection checklist confirmation, etc."
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                    isDemo ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDemo || submitting}
                  className={`flex items-center gap-1.5 px-4 py-2 font-semibold rounded-lg transition shadow-sm ${
                    isDemo
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
                      : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
                  }`}
                >
                  {isDemo ? (
                    <>
                      <Lock className="w-3.5 h-3.5" /> Log In Required
                    </>
                  ) : submitting ? (
                    'Verifying & Recording...'
                  ) : (
                    'Execute Stock Movement'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        title="Scan Batch Code for Stock Intake / Dispatch"
        onScan={async (code) => {
          const matched = batches.find(b => b.batchNumber?.toUpperCase() === code.toUpperCase());
          if (matched) {
            setForm(prev => ({ ...prev, batchId: matched._id }));
            toast.success(`Matched active batch: ${matched.batchNumber}`);
          } else {
            // Attempt to search all batches for this code
            try {
              const res = await batchService.getBatches({ search: code });
              if (res.data && res.data.length > 0) {
                const found = res.data[0];
                setForm(prev => ({
                  ...prev,
                  productId: found.product?._id || found.product,
                  batchId: found._id
                }));
                // Update batches list
                setBatches([found]);
                toast.success(`Loaded batch: ${found.batchNumber} (${found.product?.name || 'Product'})`);
              } else {
                toast.error(`No batch found matching barcode "${code}"`);
              }
            } catch (err) {
              toast.error(`Barcode parsed: ${code}, but not found in inventory`);
            }
          }
        }}
      />
    </div>
  );
};