import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Search,
  Building2,
  CalendarClock,
  ArrowLeftRight,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { warehouseService } from '../services/warehouseService';
import { Badge } from '../components/common/Badge';

export const Inventory = () => {
  const [inventories, setInventories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const fetchWarehouses = async () => {
    try {
      const res = await warehouseService.getWarehouses();
      setWarehouses(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getInventory({
        warehouse: warehouseFilter !== 'ALL' ? warehouseFilter : undefined,
        search: search || undefined,
        page,
        limit: 15
      });
      setInventories(res.data || []);
      setPagination(res.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [page, warehouseFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchInventory();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-teal-600" /> Multi-Warehouse Stock Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock positions tracked across Product, Batch, and certified Warehouse facility.
          </p>
        </div>

        <Link
          to="/app/movements"
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition shadow-sm shadow-teal-600/20 self-start sm:self-auto"
        >
          <ArrowLeftRight className="w-4 h-4" /> Record Movement
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product, batch number, or warehouse..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={warehouseFilter}
            onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-teal-600"
          >
            <option value="ALL">All Regional Warehouses</option>
            {warehouses.map(w => (
              <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
            ))}
          </select>

          <button
            onClick={() => { setSearch(''); setWarehouseFilter('ALL'); setPage(1); }}
            className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-500 dark:text-slate-200 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Product Formulation</th>
                <th className="py-3 px-3 font-mono">Batch No.</th>
                <th className="py-3 px-3">Warehouse Hub</th>
                <th className="py-3 px-3">Batch Expiry</th>
                <th className="py-3 px-3 text-right">Gross Stock</th>
                <th className="py-3 px-3 text-right">Reserved</th>
                <th className="py-3 px-3 text-right font-bold text-teal-900">Available Stock</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-teal-600 mb-2" />
                    Loading inventory records...
                  </td>
                </tr>
              ) : inventories.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No inventory records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                inventories.map((item) => {
                  const available = Math.max(0, item.quantity - item.reservedQuantity);
                  return (
                    <tr key={item._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <Link to={`/app/products/${item.product?._id}`} className="font-semibold text-slate-900 hover:text-teal-600">
                          {item.product?.name}
                        </Link>
                        <div className="text-[10px] text-slate-400 font-mono">{item.product?.productCode} • {item.product?.category}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                        <Link to={`/app/batches/${item.batch?._id}`} className="hover:text-amber-600">
                          {item.batch?.batchNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800">{item.warehouse?.name}</span>
                        <span className="ml-1.5 font-mono text-[10px] text-slate-400">[{item.warehouse?.code}]</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-700">
                          {item.batch?.expiryDate ? new Date(item.batch.expiryDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {item.quantity?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-600 font-medium">
                        {item.reservedQuantity > 0 ? `-${item.reservedQuantity?.toLocaleString()}` : '0'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-teal-700 text-sm">
                        {available.toLocaleString()} {item.product?.unitOfMeasure}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge status={item.stockStatus} />
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
            <span className="font-semibold text-slate-900">{pagination.totalPages}</span> ({pagination.total} total items)
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
    </div>
  );
};