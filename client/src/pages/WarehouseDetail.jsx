import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, ArrowLeft, Layers, ArrowLeftRight, Truck, MapPin, Phone, Mail, RefreshCw } from 'lucide-react';
import { warehouseService } from '../services/warehouseService';
import { Badge } from '../components/common/Badge';

export const WarehouseDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await warehouseService.getWarehouseById(id);
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

  if (!data?.warehouse) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Warehouse facility not found.</p>
        <Link to="/app/warehouses" className="text-xs text-teal-600 font-semibold mt-2 inline-block">Return to Warehouses</Link>
      </div>
    );
  }

  const { warehouse, inventories = [], recentMovements = [], outgoingShipments = [] } = data;
  const util = warehouse.utilizationPercent || 0;

  return (
    <div className="space-y-6">
      <Link
        to="/app/warehouses"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Warehouses Hubs
      </Link>

      {/* Main Hub Info Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">{warehouse.name}</h1>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  util >= 90 ? 'bg-rose-50 text-rose-800 border-rose-200' : util >= 70 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-teal-50 text-teal-800 border-teal-200'
                }`}>
                  {warehouse.utilizationStatus} ({util}%)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {warehouse.location?.address}, {warehouse.location?.city}, {warehouse.location?.state}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono block uppercase">Hub Code</span>
            <span className="text-base font-bold font-mono text-slate-900">{warehouse.code}</span>
          </div>
        </div>

        {/* Capacity bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1 font-semibold">
            <span className="text-slate-600">Storage Capacity Utilization:</span>
            <span className="font-mono text-slate-900">{warehouse.currentStock?.toLocaleString()} / {warehouse.capacity?.toLocaleString()} Units ({util}%)</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                util >= 90 ? 'bg-rose-600' : util >= 70 ? 'bg-amber-500' : 'bg-teal-600'
              }`}
              style={{ width: `${Math.min(100, util)}%` }}
            />
          </div>
        </div>

        {/* Contact specs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-slate-400 block font-medium">Facility Manager</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">{warehouse.manager?.name || 'Unassigned'}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-slate-400 block font-medium">Operational Phone</span>
            <span className="font-mono font-semibold text-slate-800 mt-0.5 block">{warehouse.contactPhone || 'N/A'}</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-slate-400 block font-medium">Logistics Email</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">{warehouse.contactEmail || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Inventory Stored in Warehouse */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Formulations Stored at this Facility ({inventories.length})
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-500 dark:text-slate-200 uppercase tracking-wider font-semibold">
                <th className="py-2.5 px-4">Product</th>
                <th className="py-2.5 px-3 font-mono">Batch</th>
                <th className="py-2.5 px-3">Batch Expiry</th>
                <th className="py-2.5 px-3 text-right">Gross Units</th>
                <th className="py-2.5 px-3 text-right font-bold text-teal-900">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventories.map((inv) => (
                <tr key={inv._id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <Link to={`/app/products/${inv.product?._id}`} className="font-semibold text-slate-900 hover:text-teal-600">
                      {inv.product?.name}
                    </Link>
                    <div className="text-[10px] text-slate-400 font-mono">{inv.product?.productCode}</div>
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                    <Link to={`/app/batches/${inv.batch?._id}`} className="hover:text-amber-600">
                      {inv.batch?.batchNumber}
                    </Link>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {inv.batch?.expiryDate ? new Date(inv.batch.expiryDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700">{inv.quantity?.toLocaleString()}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-teal-700">
                    {Math.max(0, inv.quantity - inv.reservedQuantity)?.toLocaleString()}
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