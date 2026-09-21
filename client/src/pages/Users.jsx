import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, Search, RefreshCw, ShieldCheck, UserX, UserCheck, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { userService } from '../services/userService';
import { warehouseService } from '../services/warehouseService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Users = () => {
  const [users, setUsers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Create Modal
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'INVENTORY_MANAGER',
    assignedWarehouse: ''
  });

  const { user: currentUser, isDemo } = useAuth();
  const toast = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userService.getUsers({
        search: search || undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        page,
        limit: 15
      });
      setUsers(res.data || []);
      setPagination(res.pagination || { total: 0, totalPages: 1 });
    } catch (err) {
      toast.error('Failed to load users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    warehouseService.getWarehouses().then(res => setWarehouses(res.data || [])).catch(() => {});
  }, [page, roleFilter]);

  const handleToggleStatus = async (user) => {
    if (isDemo) {
      toast.error('Action Disabled: User status modifications are disabled in Demo Mode.');
      return;
    }
    if (user._id === currentUser.id) {
      toast.error('You cannot deactivate your own active account.');
      return;
    }
    try {
      await userService.toggleStatus(user._id);
      toast.success(`Account for ${user.name} toggled.`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleOpenModal = () => {
    if (isDemo) {
      toast.warning('Demo Mode: User creation form is view-only. Entering details and database changes are disabled. Please log in with an authorized account.');
      setForm({
        name: 'Dr. Evelyn Reed',
        email: 'evelyn.reed@pharmatrack.com',
        password: '••••••••',
        role: 'INVENTORY_MANAGER',
        assignedWarehouse: ''
      });
    }
    setShowModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (isDemo) {
      toast.error('Action Disabled: You must log in with an authorized account to create user accounts.');
      return;
    }
    setSubmitting(true);
    try {
      await userService.createUser(form);
      toast.success('User account created successfully.');
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'INVENTORY_MANAGER', assignedWarehouse: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-teal-600" /> Platform Access & User Governance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based authorization control for administrators, inventory directors, and warehouse managers.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition shadow-sm shadow-teal-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-500 dark:text-slate-200 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-3">Work Email</th>
                <th className="py-3 px-3">Role Authority</th>
                <th className="py-3 px-3">Assigned Hub</th>
                <th className="py-3 px-3">Account Status</th>
                <th className="py-3 px-3">Last Login</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-teal-600 mb-2" />
                    Loading users...
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = u._id === currentUser.id;
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {u.name} {isCurrent && <span className="text-[10px] text-teal-600 font-bold ml-1">(You)</span>}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                        {u.email}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : u.role === 'INVENTORY_MANAGER'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-teal-50 text-teal-700 border border-teal-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {u.assignedWarehouse?.name || 'All Facilities'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {!isCurrent && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                              u.status === 'ACTIVE'
                                ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-base font-bold text-slate-900">Provision Operational Account</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            {/* Demo Banner */}
            {isDemo && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Demo Mode: View-Only Modal.</span>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    Fields are disabled. Please sign in with an authorized account to provision new user roles.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  disabled={isDemo}
                  value={form.name}
                  onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Dr. Jordan Hayes"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                    isDemo ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Email *</label>
                <input
                  type="email"
                  required
                  disabled={isDemo}
                  value={form.email}
                  onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="jordan@pharmatrack.com"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                    isDemo ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Temporary Password *</label>
                <input
                  type="password"
                  required
                  disabled={isDemo}
                  value={form.password}
                  onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Min. 6 characters"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                    isDemo ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">System Role *</label>
                <select
                  disabled={isDemo}
                  value={form.role}
                  onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none font-semibold ${
                    isDemo ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                  }`}
                >
                  <option value="ADMIN">ADMIN (Full Governance)</option>
                  <option value="INVENTORY_MANAGER">INVENTORY_MANAGER (Stock & Batches)</option>
                  <option value="WAREHOUSE_MANAGER">WAREHOUSE_MANAGER (Hub Specific)</option>
                </select>
              </div>

              {form.role === 'WAREHOUSE_MANAGER' && (
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Assigned Warehouse Hub</label>
                  <select
                    disabled={isDemo}
                    value={form.assignedWarehouse}
                    onChange={(e) => setForm(p => ({ ...p, assignedWarehouse: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                      isDemo ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                    }`}
                  >
                    <option value="">Select Warehouse Hub...</option>
                    {warehouses.map(w => (
                      <option key={w._id} value={w._id}>{w.name} ({w.code})</option>
                    ))}
                  </select>
                </div>
              )}

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
                  className={`flex items-center gap-1.5 px-4 py-2 font-semibold rounded-lg transition shadow-xs ${
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
                    'Creating...'
                  ) : (
                    'Create Account'
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