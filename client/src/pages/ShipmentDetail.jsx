import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Truck,
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Thermometer,
  PackageCheck,
  XCircle,
  RefreshCw,
  Send,
  AlertTriangle,
  Printer
} from 'lucide-react';
import { shipmentService } from '../services/shipmentService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Badge } from '../components/common/Badge';
import { ShipmentTimeline } from '../components/shipments/ShipmentTimeline';
import { DocumentUploader } from '../components/common/DocumentUploader';

export const ShipmentDetail = () => {
  const { id } = useParams();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState(null); // 'DISPATCHED', 'DELIVERED', 'CANCELLED'
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const { canUpdateStock, canCreateShipments } = useAuth();
  const toast = useToast();

  const fetchShipment = async () => {
    try {
      setLoading(true);
      const res = await shipmentService.getShipmentById(id);
      setShipment(res.shipment);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipment();
  }, [id]);

  const handleUpdateStatus = async () => {
    if (!statusModal) return;
    setUpdating(true);
    try {
      await shipmentService.updateStatus(id, statusModal, statusNote);
      toast.success(`Consignment marked as ${statusModal}.`);
      setStatusModal(null);
      setStatusNote('');
      fetchShipment();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update consignment status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-6 h-6 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Consignment record not found.</p>
        <Link to="/app/shipments" className="text-xs text-teal-600 font-semibold mt-2 inline-block">Return to Shipments</Link>
      </div>
    );
  }

  const isPending = shipment.status === 'PENDING';
  const isInTransit = shipment.status === 'IN_TRANSIT' || shipment.status === 'DISPATCHED' || shipment.status === 'DELAYED';

  return (
    <div className="space-y-6">
      <Link
        to="/app/shipments"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Consignments List
      </Link>

      {/* Main Consignment Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl">
              <Truck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold font-mono text-slate-900">{shipment.shipmentId}</h1>
                <Badge status={shipment.status} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Carrier: <span className="font-semibold text-slate-800">{shipment.carrier}</span> • Tracking No: <span className="font-mono font-semibold text-slate-700">{shipment.trackingNumber || 'Unassigned'}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition shadow-2xs print:hidden"
              title="Print Consignment Manifest"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Print Manifest</span>
            </button>

            {canUpdateStock && (
              <>
                {isPending && (
                  <>
                    <button
                      onClick={() => { setStatusModal('DISPATCHED'); setStatusNote('Dock departure verified'); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" /> Dispatch Consignment
                    </button>
                  <button
                    onClick={() => { setStatusModal('CANCELLED'); setStatusNote('Cancelled by hospital requisition manager'); }}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </>
              )}

              {isInTransit && (
                <button
                  onClick={() => { setStatusModal('DELIVERED'); setStatusNote('Delivery acknowledged and signed by receiver'); }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-xs"
                >
                  <PackageCheck className="w-4 h-4" /> Confirm Delivered
                </button>
              )}
            </>
          )}
        </div>
        </div>

        {/* Visual Timeline Stepper */}
        <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Consignment Milestone Lifecycle
          </span>
          <ShipmentTimeline
            status={shipment.status}
            statusHistory={shipment.statusHistory}
            expectedDate={shipment.expectedDeliveryDate}
            actualDate={shipment.actualDeliveryDate}
          />
        </div>

        {/* Logistics Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-slate-400 block font-medium flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-teal-600" /> Origin Warehouse Hub
            </span>
            <span className="font-semibold text-slate-900 text-sm mt-1 block">{shipment.sourceWarehouse?.name}</span>
            <span className="font-mono text-[10px] text-slate-400">[{shipment.sourceWarehouse?.code}]</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-slate-400 block font-medium flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-600" /> Destination Facility
            </span>
            <span className="font-semibold text-slate-900 text-sm mt-1 block">{shipment.destination?.facilityName}</span>
            <span className="text-[11px] text-slate-500 block">{shipment.destination?.city}, {shipment.destination?.state}</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-slate-400 block font-medium flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-indigo-600" /> Temperature Protocol
            </span>
            <span className="font-semibold text-slate-900 text-sm mt-1 block">{shipment.temperatureRequirement}</span>
            <span className="text-[10px] text-teal-700 font-semibold block">Cold-Chain Compliant</span>
          </div>
        </div>

        {/* Cargo Line Items */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
            Pharmaceutical Cargo Manifest ({shipment.items?.length || 0} product lines)
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-500 dark:text-slate-200 font-semibold">
                <th className="py-2.5 px-4">Product</th>
                <th className="py-2.5 px-3 font-mono">Assigned Batch</th>
                <th className="py-2.5 px-3 text-right">Quantity</th>
                <th className="py-2.5 px-4 text-right">Unit Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shipment.items?.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {item.product?.name}
                    <div className="text-[10px] text-slate-400 font-mono">{item.product?.productCode}</div>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">
                    {item.batch?.batchNumber}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {item.quantity?.toLocaleString()} units
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">
                    ${Number(item.unitPrice || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Update Consignment: {statusModal}
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              {statusModal === 'DISPATCHED' && 'Dispatching this consignment will deduct the reserved inventory from the warehouse and create cryptographic outbound movements.'}
              {statusModal === 'DELIVERED' && 'Confirming delivery logs the final arrival timestamp and completes the consignment lifecycle.'}
              {statusModal === 'CANCELLED' && 'Cancelling this consignment will immediately release the reserved inventory back to available stock.'}
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Operational Note / Audit Reason
              </label>
              <textarea
                rows={2}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 text-xs font-semibold">
              <button
                onClick={() => setStatusModal(null)}
                className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="px-4 py-2 bg-teal-600 text-white hover:bg-teal-700 rounded-lg transition shadow-xs disabled:opacity-50"
              >
                {updating ? 'Updating...' : `Confirm ${statusModal}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Attachments Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs mt-6">
        <DocumentUploader
          entityType="shipment"
          entityId={id}
          documents={shipment?.documents || []}
          canDelete={canCreateShipments}
          onUpdate={(newDoc, deletedId) => {
            setShipment(prev => {
              const docs = prev.documents || [];
              if (deletedId) {
                return { ...prev, documents: docs.filter(d => d._id !== deletedId) };
              }
              return { ...prev, documents: [...docs, newDoc] };
            });
          }}
        />
      </div>
    </div>
  );
};