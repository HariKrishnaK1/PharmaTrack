import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Plus, Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Eye, AlertTriangle } from 'lucide-react';
import { shipmentService } from '../services/shipmentService';
import { warehouseService } from '../services/warehouseService';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';

export const Shipments = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const { canCreateShipments } = useAuth();

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const res = await shipmentService.getShipments({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search || undefined,
        page,
        limit: 15
      });
      setShipments(res.data || []);
      setPagination(res.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchShipments();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-teal-600" /> Consignment & Logistics Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            End-to-end cold chain & pharmaceutical distribution tracking with automated delay alerts.
          </p>
        </div>

        {canCreateShipments && (
          <Link
            to="/app/shipments/new"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition shadow-sm shadow-teal-600/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Create Consignment
          </Link>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by shipment ID, hospital facility, or carrier..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {['ALL', 'PENDING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'DELAYED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setPage(1); }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {st === 'ALL' ? 'All' : st === 'IN_TRANSIT' ? 'In Transit' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-500 dark:text-slate-200 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4 font-mono">Consignment ID</th>
                <th className="py-3 px-3">Origin Hub</th>
                <th className="py-3 px-3">Destination Facility</th>
                <th className="py-3 px-3">Logistics Carrier</th>
                <th className="py-3 px-3">Cargo Items</th>
                <th className="py-3 px-3">Expected Delivery</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-teal-600 mb-2" />
                    Loading consignments...
                  </td>
                </tr>
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No consignments found matching the criteria.
                  </td>
                </tr>
              ) : (
                shipments.map((s) => {
                  const totalUnits = s.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
                  return (
                    <tr key={s._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        <Link to={`/app/shipments/${s._id}`} className="hover:text-teal-600">
                          {s.shipmentId || 'N/A'}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {s.sourceWarehouse?.name || 'Unassigned Hub'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-900">{s.destination?.facilityName || 'Direct Delivery'}</span>
                        <div className="text-[10px] text-slate-500">{s.destination?.city || '-'}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {s.carrier || 'Internal Fleet'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono font-semibold text-slate-800">{totalUnits.toLocaleString()} units</span>
                        <div className="text-[10px] text-slate-400">({s.items?.length || 0} product lines)</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {s.expectedDeliveryDate ? new Date(s.expectedDeliveryDate).toLocaleDateString() : 'TBD'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge status={s.status || 'PENDING'} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          to={`/app/shipments/${s._id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </Link>
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
            <span className="font-semibold text-slate-900">{pagination.totalPages}</span> ({pagination.total} total shipments)
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