import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Search, Plus, RefreshCw, Eye, ArrowRight, MapPin, Phone, Mail, Lock } from 'lucide-react';
import { warehouseService } from '../services/warehouseService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Warehouses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create Modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    location: { address: '', city: '', state: '', country: 'India', postalCode: '' },
    capacity: 100000,
    contactPhone: '',
    contactEmail: ''
  });

  const { canManageWarehouses, isDemo } = useAuth();
  const toast = useToast();

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const res = await warehouseService.getWarehouses({ search: search || undefined });
      setWarehouses(res.data || []);
    } catch (err) {
      toast.error('Failed to load warehouses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleOpenModal = () => {
    if (isDemo) {
      toast.warning('Demo Mode: Hub registration form is view-only. Entering details and database changes are disabled. Please log in with an authorized account.');
      setForm({
        name: 'Pune Central Cold-Chain Depot',
        code: 'WH-PUN-06',
        location: { address: 'Chakan Industrial Logistics Corridor', city: 'Pune', state: 'Maharashtra', country: 'India', postalCode: '410501' },
        capacity: 120000,
        contactPhone: '+91 20 2712 9900',
        contactEmail: 'pune.depot@pharmatrack.internal'
      });
    }
    setShowModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (isDemo) {
      toast.error('Action Disabled: You must log in with an authorized account to create warehouse hubs.');
      return;
    }
    setSubmitting(true);
    try {
      await warehouseService.createWarehouse(form);
      toast.success('Warehouse registered successfully.');
      setShowModal(false);
      fetchWarehouses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create warehouse.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-teal-600" /> Regional Distribution Hubs & Warehouses
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time storage capacities, physical unit loads, and regional logistics nodes.
          </p>
        </div>

        {canManageWarehouses && (
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition shadow-sm shadow-teal-600/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Warehouse Hub
          </button>
        )}
      </div>

      {/* Grid of Warehouse Capacity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.map((wh) => {
          const util = wh.utilizationPercent || 0;
          let barColor = 'bg-teal-500';
          let textColor = 'text-teal-700';
          let badgeBg = 'bg-teal-50 border-teal-200 text-teal-800';

          if (util >= 90) {
            barColor = 'bg-rose-500';
            textColor = 'text-rose-700';
            badgeBg = 'bg-rose-50 border-rose-200 text-rose-800';
          } else if (util >= 70) {
            barColor = 'bg-amber-500';
            textColor = 'text-amber-700';
            badgeBg = 'bg-amber-50 border-amber-200 text-amber-800';
          }

          return (
            <div key={wh._id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:shadow-xs transition">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{wh.name}</h3>
                    <span className="font-mono text-[10px] text-slate-400 font-semibold uppercase">{wh.code}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeBg}`}>
                    {wh.utilizationStatus}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{wh.location?.city}, {wh.location?.state}</span>
                </div>

                {/* Utilization Progress Bar */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500">Storage Capacity Load:</span>
                    <span className={`font-mono font-bold ${textColor}`}>{util}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(100, util)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2">
                    <span>{wh.currentStock?.toLocaleString()} units stored</span>
                    <span>{wh.capacity?.toLocaleString()} max</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Manager: <span className="font-semibold text-slate-700">{wh.manager?.name || 'Assigned Lead'}</span>
                </span>
                <Link
                  to={`/app/warehouses/${wh._id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700"
                >
                  View Facility <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Warehouse Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-lg w-full p-6 rounded-2xl shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Regional Warehouse Hub</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            {/* Demo Banner */}
            {isDemo && (
              <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Demo Mode: View-Only Modal.</span>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    Fields are disabled. Please sign in with an authorized account to register new hubs.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Hub Name *</label>
                  <input
                    type="text"
                    required
                    disabled={isDemo}
                    value={form.name}
                    onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Pune Central Depot"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                      isDemo ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    disabled={isDemo}
                    value={form.code}
                    onChange={(e) => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. WH-PUN-06"
                    className={`w-full px-3 py-2 font-mono border rounded-lg focus:outline-none ${
                      isDemo ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">City *</label>
                  <input
                    type="text"
                    required
                    disabled={isDemo}
                    value={form.location.city}
                    onChange={(e) => setForm(p => ({ ...p, location: { ...p.location, city: e.target.value } }))}
                    placeholder="Pune"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                      isDemo ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">State *</label>
                  <input
                    type="text"
                    required
                    disabled={isDemo}
                    value={form.location.state}
                    onChange={(e) => setForm(p => ({ ...p, location: { ...p.location, state: e.target.value } }))}
                    placeholder="Maharashtra"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                      isDemo ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Storage Capacity (Units) *</label>
                <input
                  type="number"
                  required
                  disabled={isDemo}
                  min="1000"
                  value={form.capacity}
                  onChange={(e) => setForm(p => ({ ...p, capacity: Number(e.target.value) }))}
                  className={`w-full px-3 py-2 font-mono border rounded-lg focus:outline-none ${
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
                      : 'bg-teal-600 hover:bg-teal-700 text-white'
                  }`}
                >
                  {isDemo ? (
                    <>
                      <Lock className="w-3.5 h-3.5" /> Log In Required
                    </>
                  ) : submitting ? (
                    'Registering...'
                  ) : (
                    'Register Hub'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};