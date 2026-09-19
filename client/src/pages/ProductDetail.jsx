import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Pill,
  ArrowLeft,
  Building2,
  CalendarClock,
  Layers,
  Edit2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { productService } from '../services/productService';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';

export const ProductDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { canManageProducts } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await productService.getProductById(id);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-6 h-6 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!data?.product) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Product not found.</p>
        <Link to="/app/products" className="text-xs text-teal-600 font-semibold mt-2 inline-block">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const { product, inventories = [], batches = [] } = data;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/app/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products Catalog
        </Link>

        {canManageProducts && (
          <Link
            to={`/app/products/${product._id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition"
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit Product
          </Link>
        )}
      </div>

      {/* Main Info Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl">
              <Pill className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">{product.name}</h1>
                <Badge status={product.stockStatus} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Generic Name: <span className="font-semibold text-slate-700">{product.genericName}</span> • Formulation: <span className="font-semibold text-slate-700">{product.dosageForm} ({product.strength})</span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400 font-mono">Product Code</div>
            <div className="text-base font-bold font-mono text-slate-900">{product.productCode}</div>
          </div>
        </div>

        {/* Specifications Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-medium">Therapeutic Category</span>
            <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{product.category}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-medium">Manufacturer</span>
            <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{product.manufacturer}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-medium">Minimum Safety Stock</span>
            <span className="font-semibold font-mono text-slate-800 text-sm mt-0.5 block">{product.minimumStockLevel?.toLocaleString()} {product.unitOfMeasure}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-medium">Unit Price (Estimated)</span>
            <span className="font-semibold font-mono text-teal-700 text-sm mt-0.5 block">${Number(product.unitPrice).toFixed(2)}</span>
          </div>
        </div>

        {product.description && (
          <div className="mt-4 p-3.5 rounded-lg bg-slate-50/70 border border-slate-100 text-xs text-slate-600">
            <span className="font-bold text-slate-700 block mb-1">Pharmacological / Operational Notes:</span>
            {product.description}
          </div>
        )}
      </div>

      {/* Warehouse Stock Distribution */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Inventory Distribution Across Warehouses
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-slate-900">
            Total Available: {product.availableStock?.toLocaleString()} units
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {inventories.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              No inventory currently stored in warehouses for this product.
            </div>
          ) : (
            inventories.map((inv) => (
              <div key={inv._id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50">
                <div>
                  <span className="font-semibold text-slate-900">{inv.warehouse?.name}</span>
                  <span className="ml-2 font-mono text-[10px] text-slate-400">[{inv.warehouse?.code}]</span>
                  <div className="text-[11px] text-slate-500 mt-0.5">{inv.warehouse?.location?.city}, {inv.warehouse?.location?.state}</div>
                </div>

                <div className="flex items-center gap-6 font-mono text-right">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Total Units</span>
                    <span className="font-bold text-slate-800">{inv.quantity?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Reserved</span>
                    <span className="text-amber-600 font-semibold">{inv.reservedQuantity?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Available</span>
                    <span className="text-teal-700 font-bold">{Math.max(0, inv.quantity - inv.reservedQuantity)?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-amber-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Associated Production Batches ({batches.length})
            </h2>
          </div>
          <Link to="/app/batches" className="text-xs text-teal-600 font-semibold hover:text-teal-700">
            View All Batches →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-500 dark:text-slate-200 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-4 font-mono">Batch Number</th>
                <th className="py-2.5 px-3">Warehouse Hub</th>
                <th className="py-2.5 px-3">Manufacturing Date</th>
                <th className="py-2.5 px-3">Expiry Date</th>
                <th className="py-2.5 px-3 text-right">Units Remaining</th>
                <th className="py-2.5 px-4 text-center">Expiry Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map((b) => (
                <tr key={b._id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                    <Link to={`/app/batches/${b._id}`} className="hover:text-teal-600">
                      {b.batchNumber}
                    </Link>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{b.warehouse?.name || 'Regional Depo'}</td>
                  <td className="py-3 px-3 text-slate-500">{new Date(b.manufacturingDate).toLocaleDateString()}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{new Date(b.expiryDate).toLocaleDateString()}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{b.currentQuantity?.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge status={b.expiryStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};