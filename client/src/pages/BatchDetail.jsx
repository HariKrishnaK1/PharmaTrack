import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CalendarClock, ArrowLeft, Building2, Pill, ShieldAlert, RefreshCw, Save } from 'lucide-react';
import { batchService } from '../services/batchService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';
import { DocumentUploader } from '../components/common/DocumentUploader';

export const BatchDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const { canManageProducts } = useAuth();
  const toast = useToast();

  const fetchBatch = async () => {
    try {
      setLoading(true);
      const res = await batchService.getBatchById(id);
      setData(res);
      setStatus(res.batch?.status || 'RELEASED');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatch();
  }, [id]);

  const handleStatusUpdate = async () => {
    setSaving(true);
    try {
      await batchService.updateBatch(id, { status });
      toast.success(`Batch status updated to ${status}.`);
      fetchBatch();
    } catch (err) {
      toast.error('Failed to update batch status.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-6 h-6 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!data?.batch) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Batch not found.</p>
        <Link to="/app/batches" className="text-xs text-teal-600 font-semibold mt-2 inline-block">Return to Batches</Link>
      </div>
    );
  }

  const { batch, inventory } = data;
  const days = batch.daysUntilExpiry;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/app/batches"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Batches Ledger
      </Link>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl">
              <CalendarClock className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold font-mono text-slate-900">{batch.batchNumber}</h1>
                <Badge status={batch.expiryStatus} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Formulation: <Link to={`/app/products/${batch.product?._id}`} className="font-semibold text-teal-600 hover:underline">{batch.product?.name}</Link> [{batch.product?.productCode}]
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-semibold">Remaining Stock</span>
            <span className="text-xl font-bold font-mono text-slate-900">{batch.currentQuantity?.toLocaleString()} units</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-slate-400 block">Manufacturing Date</span>
            <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{new Date(batch.manufacturingDate).toLocaleDateString()}</span>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-slate-400 block">Expiry Date</span>
            <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{new Date(batch.expiryDate).toLocaleDateString()}</span>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-slate-400 block">Days Until Expiry</span>
            <span className={`font-bold font-mono text-sm mt-0.5 block ${days <= 0 ? 'text-slate-900' : days <= 30 ? 'text-rose-600' : days <= 90 ? 'text-amber-600' : 'text-emerald-700'}`}>
              {days <= 0 ? 'EXPIRED' : `${days} days left`}
            </span>
          </div>
          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-slate-400 block">Warehouse Hub</span>
            <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{batch.warehouse?.name}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <span className="text-slate-400 block mb-1">API Supplier / Synthesis Source:</span>
          <span className="font-semibold text-slate-900">{batch.supplier}</span>
        </div>

        {/* Regulatory Status Control */}
        {canManageProducts && (
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Lot Regulatory Release Status</span>
              <span className="text-[11px] text-slate-500">Quarantined or recalled lots cannot be dispatched in outbound shipments.</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
              >
                <option value="RELEASED">Released (Available)</option>
                <option value="QUARANTINE">Quarantine (Hold)</option>
                <option value="RECALLED">Recalled (Blocked)</option>
              </select>

              <button
                onClick={handleStatusUpdate}
                disabled={saving || status === batch.status}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-lg transition"
              >
                <Save className="w-3.5 h-3.5" /> Save Status
              </button>
            </div>
          </div>
        )}

        {/* Document Attachments */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <DocumentUploader
            entityType="batch"
            entityId={id}
            documents={data?.batch?.documents || []}
            canDelete={canManageProducts}
            onUpdate={(newDoc, deletedId) => {
              setData(prev => {
                const docs = prev.batch.documents || [];
                if (deletedId) {
                  return { ...prev, batch: { ...prev.batch, documents: docs.filter(d => d._id !== deletedId) } };
                }
                return { ...prev, batch: { ...prev.batch, documents: [...docs, newDoc] } };
              });
            }}
          />
        </div>
      </div>
    </div>
  );
};