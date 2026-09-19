import React from 'react';
import {
  Settings as SettingsIcon,
  User,
  ShieldCheck,
  Database,
  Key,
  CheckCircle,
  Info,
  Sun,
  Moon,
  Monitor,
  Palette,
  Bell,
  Mail,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Settings = () => {
  const { user } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-teal-600" /> Platform Configuration & Environment
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          System parameters, active session credentials, appearance, and database connectivity.
        </p>
      </div>

      {/* User Profile Info Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-base">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          <span className="ml-auto px-2.5 py-1 rounded-md text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
            {user?.role}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block font-medium">Assigned Hub Facility</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">{user?.assignedWarehouse?.name || 'All Facilities (Global)'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block font-medium">Session Status</span>
            <span className="font-semibold text-emerald-700 mt-0.5 block flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Authenticated JWT
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 block font-medium">Account ID</span>
            <span className="font-mono text-slate-600 mt-0.5 block text-[11px] truncate">{user?.id || user?._id}</span>
          </div>
        </div>
      </div>

      {/* Appearance & Dark Mode Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Palette className="w-4 h-4 text-teal-600" /> Interface Appearance & Theme
        </h3>
        <p className="text-xs text-slate-500">
          Customize your viewing experience across bright daylight office settings or low-light warehouse dispatch shifts.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Light Mode Tile */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${
              theme === 'light'
                ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/20 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-600 shrink-0">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Light Mode</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Crisp, high-contrast daytime interface</span>
            </div>
          </button>

          {/* Dark Mode Tile */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${
              theme === 'dark'
                ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/20 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="p-2.5 rounded-lg bg-slate-800 text-teal-400 shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Dark Mode</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Ultra-sleek dark slate palette</span>
            </div>
          </button>

          {/* System Mode Tile */}
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${
              theme === 'system'
                ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/20 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-600 shrink-0">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">System Auto</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Syncs with OS (Active: {resolvedTheme})</span>
            </div>
          </button>
        </div>
      </div>

      {/* Demo Account Credentials Reference Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" /> Demo Credentials Reference
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Pre-seeded roles for interview evaluation and end-to-end testing:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl">
            <span className="font-bold text-purple-900 block">Administrator</span>
            <span className="text-slate-500 block text-[11px] mt-1 font-mono">admin@pharmatrack.com</span>
            <span className="text-slate-500 block text-[11px] font-mono">Pass: Admin@123</span>
            <span className="text-[10px] text-purple-700 mt-2 block font-medium">Full governance, users, audit</span>
          </div>

          <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl">
            <span className="font-bold text-blue-900 block">Inventory Manager</span>
            <span className="text-slate-500 block text-[11px] mt-1 font-mono">inventory@pharmatrack.com</span>
            <span className="text-slate-500 block text-[11px] font-mono">Pass: Inventory@123</span>
            <span className="text-[10px] text-blue-700 mt-2 block font-medium">Catalog, stock, FEFO dispatch</span>
          </div>

          <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-xl">
            <span className="font-bold text-teal-900 block">Warehouse Manager</span>
            <span className="text-slate-500 block text-[11px] mt-1 font-mono">warehouse@pharmatrack.com</span>
            <span className="text-slate-500 block text-[11px] font-mono">Pass: Warehouse@123</span>
            <span className="text-[10px] text-teal-700 mt-2 block font-medium">Mumbai hub stock & shipments</span>
          </div>
        </div>
      </div>

      {/* Database & Architecture Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Database className="w-4 h-4 text-teal-600" /> Architecture & Dual-Mode Connector
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          PharmaTrack incorporates an automated dual-mode connector. When a local MongoDB daemon or MongoDB Atlas URI is active in <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-teal-700">.env</code>, it persists to the production-grade instance. If no external URI is reachable during local review or university demonstration, an embedded in-memory MongoDB is transparently spawned and populated with realistic pharmaceutical demo datasets.
        </p>
      </div>

      {/* Email Notification Settings Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Bell className="w-4 h-4 text-teal-600" /> Email Alert Notifications
        </h3>
        <p className="text-xs text-slate-500">
          PharmaTrack automatically sends email alerts to all <strong>Admin</strong> and <strong>Inventory Manager</strong> accounts when critical events are detected.
        </p>

        {/* Alert trigger list */}
        <div className="space-y-2">
          {[
            { icon: AlertTriangle, color: 'rose', label: 'Out of Stock', desc: 'Sent immediately when any product hits 0 units' },
            { icon: AlertTriangle, color: 'amber', label: 'Low Stock', desc: 'Sent when stock drops below minimum threshold' },
            { icon: Mail,          color: 'red',   label: 'Batch Expired / Expiring', desc: 'Sent for batches expiring within 30 days or already expired' },
            { icon: Mail,          color: 'blue',  label: 'Shipment Delayed', desc: 'Sent when a shipment passes its expected delivery date' },
          ].map(({ icon: Icon, color, label, desc }) => (
            <div key={label} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 text-${color}-500`} />
              <div>
                <span className="text-xs font-semibold text-slate-900">{label}</span>
                <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
              </div>
              <span className="ml-auto text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full self-start">Active</span>
            </div>
          ))}
        </div>

        {/* Setup instructions */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs font-semibold text-amber-900 mb-2 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5" /> Gmail App Password Setup (One-time)
          </p>
          <ol className="text-[11px] text-amber-800 space-y-1 list-decimal list-inside leading-relaxed">
            <li>Go to <strong>Google Account → Security → 2-Step Verification</strong></li>
            <li>Scroll down to <strong>App Passwords</strong> and create one for "Mail"</li>
            <li>Copy the 16-character password (no spaces)</li>
            <li>Set <code className="bg-amber-100 px-1 rounded font-mono">EMAIL_USER</code> and <code className="bg-amber-100 px-1 rounded font-mono">EMAIL_PASS</code> in <code className="bg-amber-100 px-1 rounded font-mono">server/.env</code></li>
            <li>Set <code className="bg-amber-100 px-1 rounded font-mono">ADMIN_EMAILS</code> to comma-separated recipient addresses</li>
            <li>Restart the server — emails will fire automatically on new alerts</li>
          </ol>
        </div>
      </div>
    </div>
  );
};