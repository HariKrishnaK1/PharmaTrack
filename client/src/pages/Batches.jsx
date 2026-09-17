import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  Search,
  Filter,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { batchService } from '../services/batchService';
import { productService } from '../services/productService';
import { warehouseService } from '../services/warehouseService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';

export const Batches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expiryStatusFilter, setExpiryStatusFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Create Batch Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    batchNumber: '',
    productId: '',
    warehouseId: '',
    manufacturingDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    initialQuantity: 5000,
    supplier: ''
  });

  // FEFO Helper Tool Modal
  const [showFefoModal, setShowFefoModal] = useState(false);
  const [fefoProduct, setFefoProduct] = useState('');
  const [fefoQty, setFefoQty] = useState(500);
  const [fefoResults, setFefoResults] = useState(null);
  const [fefoLoading, setFefoLoading] = useState(false);

  const { canManageProducts } = useAuth();
  const toast = useToast();

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await batchService.getBatches({
        search: search || undefined,
        expiryStatus: expiryStatusFilter !== 'ALL' ? expiryStatusFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page,
        limit: 15
      });
      setBatches(res.data || []);
      setPagination(res.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      toast.error('Failed to load batches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [page, expiryStatusFilter, statusFilter]);

  const openCreateModal = async () => {
    try {
      const [pRes, wRes] = await Promise.all([
        productService.getProducts({ limit: 100 }),
        warehouseService.getWarehouses()
      ]);
      setProducts(pRes.data || []);
      setWarehouses(wRes.data || []);
      if (pRes.data?.length > 0) setCreateForm(prev => ({ ...prev, productId: pRes.data[0]._id }));
      if (wRes.data?.length > 0) setCreateForm(prev => ({ ...prev, warehouseId: wRes.data[0]._id }));
      setShowCreateModal(true);
    } catch (err) {
      toast.error('Failed to load product/warehouse options.');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await batchService.createBatch(createForm);
      toast.success('Batch registered and warehouse inventory updated.');
      setShowCreateModal(false);
      fetchBatches();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register batch.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFefoLookup = async (e) => {
    e.preventDefault();
    if (!fefoProduct) return;
    setFefoLoading(true);
    try {
      const res = await batchService.getFefoRecommendations(fefoProduct, fefoQty);
      setFefoResults(res.recommendations);
    } catch (err) {
      toast.error('Failed to calculate FEFO recommendation.');
    } finally {
      setFefoLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-amber-600" /> Batches & Expiry Management (FEFO)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor shelf-life horizons, enforce First Expiry First Out (FEFO) prioritization, and quarantine expired lots.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={async () => {
              const p = await productService.getProducts({ limit: 100 });
              setProducts(p.data || []);
              if (p.data?.length > 0) setFefoProduct(p.data[0]._id);
              setShowFefoModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition"
          >
            <Sparkles className="w-4 h-4 text-teal-600" /> FEFO Recommender
          </button>

          {canManageProducts && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition shadow-sm shadow-teal-600/20"
            >
              <Plus className="w-4 h-4" /> Register Batch
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); fetchBatches(); } }}
            placeholder="Search by batch number or supplier..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={expiryStatusFilter}
            onChange={(e) => { setExpiryStatusFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-teal-600 font-semibold"
          >
            <option value="ALL">All Expiry Horizons</option>
            <option value="SAFE">Safe (&gt; 90 Days)</option>
            <option value="EXPIRING_SOON">Expiring Soon (30–90 Days)</option>
            <option value="CRITICAL">Critical (&lt; 30 Days)</option>
            <option value="EXPIRED">Expired Lots</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-teal-600"
          >
            <option value="ALL">All Lot Statuses</option>
            <option value="RELEASED">Released</option>
            <option value="QUARANTINE">Quarantine</option>
            <option value="RECALLED">Recalled</option>
          </select>

          <button
            onClick={() => { setSearch(''); setExpiryStatusFilter('ALL'); setStatusFilter('ALL'); setPage(1); }}
            className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-500 dark:text-slate-200 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4 font-mono">Batch Number</th>
                <th className="py-3 px-3">Product Formulation</th>
                <th className="py-3 px-3">Warehouse Hub</th>
                <th className="py-3 px-3">Mfg Date</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3">Days Until Expiry</th>
                <th className="py-3 px-3 text-right">Units Remaining</th>
                <th className="py-3 px-3 text-center">Lot Status</th>
                <th className="py-3 px-4 text-center">Expiry Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-teal-600 mb-2" />
                    Loading batches...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No batches match the specified criteria.
                  </td>
                </tr>
              ) : (
                batches.map((b) => {
                  const days = b.daysUntilExpiry;
                  return (
                    <tr key={b._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <Link to={`/batches/${b._id}`} className="hover:text-teal-600">
                          {b.batchNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-900">{b.product?.name}</span>
                        <div className="text-[10px] text-slate-400 font-mono">{b.product?.productCode} • {b.product?.strength}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {b.warehouse?.name}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(b.manufacturingDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {new Date(b.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span
                          className={`font-bold ${
                            days <= 0
                              ? 'text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded'
                              : days <= 30
                              ? 'text-rose-600'
                              : days <= 90
                              ? 'text-amber-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {days <= 0 ? 'EXPIRED' : `${days} days`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {b.currentQuantity?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.status === 'RELEASED' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge status={b.expiryStatus} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-500">
          <span>
            Showing page <span className="font-semibold text-slate-900">{pagination.page}</span> of{' '}
            <span className="font-semibold text-slate-900">{pagination.totalPages}</span> ({pagination.total} batches)
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

      {/* FEFO Recommender Modal */}
      {showFefoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-xl w-full p-6 rounded-2xl shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">FEFO Dispatch Engine</h3>
                  <p className="text-[11px] text-slate-500">First Expiry, First Out Outbound Allocator</p>
                </div>
              </div>
              <button onClick={() => setShowFefoModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleFefoLookup} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Product Formulation
                </label>
                <select
                  value={fefoProduct}
                  onChange={(e) => setFefoProduct(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                >
                  {products.map(p => <option key={p._id} value={p._id}>{p.name} [{p.productCode}]</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Requested Outbound Units
                </label>
                <input
                  type="number"
                  min="1"
                  value={fefoQty}
                  onChange={(e) => setFefoQty(Number(e.target.value))}
                  className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                />
              </div>

              <button
                type="submit"
                disabled={fefoLoading}
                className="w-full py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition"
              >
                {fefoLoading ? 'Calculating optimal batch pick...' : 'Calculate FEFO Picking Order'}
              </button>
            </form>

            {/* Recommendations Output */}
            {fefoResults && (
              <div className="mt-5 pt-4 border-t border-slate-100 text-xs space-y-3">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-700">Total Available Stock:</span>
                  <span className="font-mono text-slate-900">{fefoResults.totalAvailable?.toLocaleString()} units</span>
                </div>

                {!fefoResults.canFulfill && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px]">
                    ⚠️ Insufficient available stock to fulfill full requested order ({fefoQty} units).
                  </div>
                )}

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Recommended Batch Pick List (FEFO Prioritized):
                  </span>
                  {fefoResults.allocations?.map((item, idx) => (
                    <div
                      key={item.batchId}
                      className={`p-3 rounded-lg border flex items-center justify-between ${
                        item.isFefoRecommended
                          ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{item.batchNumber}</span>
                          {item.isFefoRecommended && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-700 text-white">
                              Top FEFO Recommendation
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Hub: {item.warehouse?.name} • Expires: {new Date(item.expiryDate).toLocaleDateString()} ({item.daysUntilExpiry}d left)
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Pick Allocation</span>
                        <span className="font-mono font-bold text-teal-700 text-sm">{item.allocatedQuantity} units</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Register Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-lg w-full p-6 rounded-2xl shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Register New Production Batch</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Batch Number *</label>
                <input
                  type="text"
                  required
                  value={createForm.batchNumber}
                  onChange={(e) => setCreateForm(p => ({ ...p, batchNumber: e.target.value.toUpperCase() }))}
                  placeholder="e.g. PCM-2026-901"
                  className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Product Formulation *</label>
                <select
                  required
                  value={createForm.productId}
                  onChange={(e) => setCreateForm(p => ({ ...p, productId: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                >
                  {products.map(p => <option key={p._id} value={p._id}>{p.name} [{p.productCode}]</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Storage Warehouse Hub *</label>
                <select
                  required
                  value={createForm.warehouseId}
                  onChange={(e) => setCreateForm(p => ({ ...p, warehouseId: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                >
                  {warehouses.map(w => <option key={w._id} value={w._id}>{w.name} ({w.code})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Mfg Date *</label>
                  <input
                    type="date"
                    required
                    value={createForm.manufacturingDate}
                    onChange={(e) => setCreateForm(p => ({ ...p, manufacturingDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={createForm.expiryDate}
                    onChange={(e) => setCreateForm(p => ({ ...p, expiryDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Initial Units *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={createForm.initialQuantity}
                    onChange={(e) => setCreateForm(p => ({ ...p, initialQuantity: Number(e.target.value) }))}
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Supplier / Source *</label>
                  <input
                    type="text"
                    required
                    value={createForm.supplier}
                    onChange={(e) => setCreateForm(p => ({ ...p, supplier: e.target.value }))}
                    placeholder="e.g. Apex Pharma Laboratories"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition shadow-sm shadow-teal-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Register Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};