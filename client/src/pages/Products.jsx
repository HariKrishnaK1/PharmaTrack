import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Pill,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { productService } from '../services/productService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [deleteModalItem, setDeleteModalItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { canManageProducts, isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const categories = ['ALL', 'Tablets', 'Capsules', 'Syrups', 'Injectables', 'Creams', 'Inhalers', 'Supplements'];

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.getProducts({
        search: search || undefined,
        category: category !== 'ALL' ? category : undefined,
        status: status !== 'ALL' ? status : undefined,
        page,
        limit: 10
      });
      setProducts(res.data || []);
      setPagination(res.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      toast.error('Failed to load products list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, category, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleDelete = async () => {
    if (!deleteModalItem) return;
    setDeleting(true);
    try {
      const res = await productService.deleteProduct(deleteModalItem._id);
      toast.success(res.message || 'Product removed successfully.');
      setDeleteModalItem(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Pill className="w-6 h-6 text-teal-600" /> Pharmaceutical Formulations Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered products, minimum safety thresholds, and real-time network stock availability.
          </p>
        </div>

        {canManageProducts && (
          <Link
            to="/app/products/new"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition shadow-sm shadow-teal-600/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Formulation
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, code, generic, or manufacturer..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-teal-600"
          >
            {categories.map(c => <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>)}
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-teal-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DISCONTINUED">Discontinued</option>
          </select>

          <button
            onClick={() => { setSearch(''); setCategory('ALL'); setStatus('ALL'); setPage(1); }}
            className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-500 dark:text-slate-200 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Product Name & Generic</th>
                <th className="py-3 px-3 font-mono">Code</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Manufacturer</th>
                <th className="py-3 px-3 text-right">Available Stock</th>
                <th className="py-3 px-3 text-right">Min Stock</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-teal-600 mb-2" />
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No pharmaceutical products matched the query.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <Link to={`/app/products/${p._id}`} className="font-semibold text-slate-900 hover:text-teal-600">
                        {p.name}
                      </Link>
                      <div className="text-[11px] text-slate-500 mt-0.5">{p.genericName} • {p.strength}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-600">
                      {p.productCode}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {p.manufacturer}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                      {p.availableStock?.toLocaleString()} {p.unitOfMeasure}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {p.minimumStockLevel?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge status={p.stockStatus} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          to={`/app/products/${p._id}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition"
                          title="View Product"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {canManageProducts && (
                          <Link
                            to={`/app/products/${p._id}/edit`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteModalItem(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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

      {/* Delete Confirmation Modal */}
      {deleteModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Confirm Product Removal</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove <span className="font-semibold text-slate-900">{deleteModalItem.name}</span> ({deleteModalItem.productCode})? If historical batches exist, the system will automatically mark it as Discontinued to preserve supply chain traceability.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteModalItem(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-sm"
              >
                {deleting ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};