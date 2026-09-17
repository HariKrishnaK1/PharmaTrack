import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Eye,
  Sliders,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { alertService } from '../services/alertService';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import { useToast } from '../context/ToastContext';

export const Alerts = () => {
  const [alertsList, setAlertsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [resolvedFilter, setResolvedFilter] = useState('false');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Resolve Modal
  const [resolveModalItem, setResolveModalItem] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolving, setResolving] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  const { canManageProducts } = useAuth();
  const { refreshAlerts } = useAlerts();
  const toast = useToast();

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await alertService.getAlerts({
        severity: severityFilter !== 'ALL' ? severityFilter : undefined,
        alertType: typeFilter !== 'ALL' ? typeFilter : undefined,
        isResolved: resolvedFilter !== 'ALL' ? resolvedFilter : undefined,
        page,
        limit: 15
      });
      setAlertsList(res.data || []);
      setPagination(res.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      toast.error('Failed to load operational alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [page, severityFilter, typeFilter, resolvedFilter]);

  const handleEvaluateRules = async () => {
    setEvaluating(true);
    try {
      await alertService.evaluateAlerts();
      toast.success('Deterministic business rules evaluated across current database state.');
      fetchAlerts();
      refreshAlerts();
    } catch (err) {
      toast.error('Rule evaluation failed.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolveModalItem) return;
    setResolving(true);
    try {
      await alertService.resolveAlert(resolveModalItem._id, resolutionNote || 'Operational resolution acknowledged');
      toast.success('Alert resolved and archived into audit log.');
      setResolveModalItem(null);
      setResolutionNote('');
      fetchAlerts();
      refreshAlerts();
    } catch (err) {
      toast.error('Failed to resolve alert.');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-600" /> Operational Alerts & Risk Monitor
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic rule engine detecting low stocks, critical expiries, warehouse overflow, and shipment delays.
          </p>
        </div>

        <button
          onClick={handleEvaluateRules}
          disabled={evaluating}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-sm disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
          {evaluating ? 'Evaluating Rules...' : 'Re-Evaluate Rules'}
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Resolution Filter */}
          <select
            value={resolvedFilter}
            onChange={(e) => { setResolvedFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none focus:border-teal-600"
          >
            <option value="false">Active / Unresolved Only</option>
            <option value="true">Resolved / Archived</option>
            <option value="ALL">All Alerts</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-teal-600"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-teal-600"
          >
            <option value="ALL">All Rule Categories</option>
            <option value="LOW_STOCK">Low Stock Threshold</option>
            <option value="OUT_OF_STOCK">Stock Depleted (0)</option>
            <option value="EXPIRY_WARNING">Expiry Horizon (&lt;90d)</option>
            <option value="EXPIRED_BATCH">Expired Lot (Quarantine)</option>
            <option value="WAREHOUSE_CAPACITY">Warehouse High Capacity</option>
            <option value="SHIPMENT_DELAY">Shipment Past SLA</option>
          </select>
        </div>

        <button
          onClick={() => { setSeverityFilter('ALL'); setTypeFilter('ALL'); setResolvedFilter('false'); setPage(1); }}
          className="text-slate-500 hover:text-slate-800"
        >
          Reset Filters
        </button>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
            Scanning operational business rules...
          </div>
        ) : alertsList.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">No operational alerts found.</p>
            <p className="text-xs text-slate-400 mt-0.5">All monitored parameters are currently within normal compliance thresholds.</p>
          </div>
        ) : (
          alertsList.map((alert) => (
            <div
              key={alert._id}
              className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                alert.isResolved
                  ? 'bg-slate-50/70 border-slate-200 opacity-75'
                  : alert.severity === 'CRITICAL'
                  ? 'bg-rose-50/40 border-rose-200 shadow-2xs'
                  : 'bg-amber-50/30 border-amber-200 shadow-2xs'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                  alert.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      alert.severity === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">{alert.alertType}</span>
                    <h3 className="text-xs font-bold text-slate-900">{alert.title}</h3>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{alert.message}</p>
                  <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-2">
                    <span>Logged: {new Date(alert.createdAt).toLocaleString()}</span>
                    {alert.isResolved && (
                      <span className="text-emerald-700 font-semibold">
                        • Resolved by {alert.resolvedBy?.name || 'Staff'}: "{alert.resolutionNote}"
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!alert.isResolved && canManageProducts && (
                <button
                  onClick={() => setResolveModalItem(alert)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200/80 rounded-lg transition shrink-0 self-end sm:self-auto shadow-2xs"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Resolve Alert
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
        <span>
          Showing page <span className="font-semibold text-slate-900">{pagination.page}</span> of{' '}
          <span className="font-semibold text-slate-900">{pagination.totalPages}</span> ({pagination.total} alerts)
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

      {/* Resolve Modal */}
      {resolveModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Resolve Operational Alert</h3>
            <p className="text-xs text-slate-600 mb-4">{resolveModalItem.title}</p>

            <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Corrective Action / Resolution Note *
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="e.g. Dispatched replacement replenishment order from Delhi NCR hub."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setResolveModalItem(null)}
                  className="px-3.5 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-4 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  {resolving ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};