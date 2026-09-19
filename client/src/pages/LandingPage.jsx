import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Pill,
  ShieldCheck,
  BarChart3,
  Truck,
  Package,
  Bell,
  Warehouse,
  ClipboardList,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const features = [
  {
    icon: Package,
    title: 'Inventory Management',
    description:
      'Track pharmaceutical stock levels in real-time across all locations. Get alerts before you run out.',
    color: 'teal',
  },
  {
    icon: Truck,
    title: 'Shipment Tracking',
    description:
      'Monitor every shipment from dispatch to delivery with full chain-of-custody visibility.',
    color: 'blue',
  },
  {
    icon: Warehouse,
    title: 'Multi-Warehouse Control',
    description:
      'Manage multiple warehouses and distribution centers from a single unified dashboard.',
    color: 'emerald',
  },
  {
    icon: ClipboardList,
    title: 'Batch & Expiry Control',
    description:
      'Stay on top of batch numbers, manufacturing dates, and expiry schedules automatically.',
    color: 'violet',
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description:
      'Receive proactive notifications for low stock, expiring products, and compliance events.',
    color: 'rose',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description:
      'Make data-driven decisions with rich analytics on stock movements, trends, and performance.',
    color: 'amber',
  },
];

const stats = [
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '10M+', label: 'Batches Tracked' },
  { value: '500+', label: 'Warehouses Served' },
  { value: '24/7', label: 'Monitoring' },
];

const colorMap = {
  teal: 'bg-teal-50 text-teal-700 border-teal-100',
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  violet: 'bg-violet-50 text-violet-700 border-violet-100',
  rose: 'bg-rose-50 text-rose-700 border-rose-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
};

const iconColorMap = {
  teal: 'text-teal-600',
  blue: 'text-blue-600',
  emerald: 'text-emerald-600',
  violet: 'text-violet-600',
  rose: 'text-rose-600',
  amber: 'text-amber-600',
};

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ─── Navbar ─── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center shadow shadow-teal-500/25">
              <Pill className="w-5 h-5 text-white rotate-45" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              Pharma<span className="text-teal-600">Track</span>
            </span>
          </div>

          {/* Login CTA */}
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition shadow shadow-teal-600/20"
          >
            Login
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-slate-900 text-white">
        {/* Glow blobs */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-teal-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32 flex flex-col items-center text-center gap-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Pharmaceutical Supply Chain Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight max-w-3xl">
            The Smart Way to Manage{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
              Pharma Inventory
            </span>
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            PharmaTrack gives your team complete visibility over inventory, batches, shipments,
            and warehouses — all in one secure, real-time operations console.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-sm transition shadow-lg shadow-teal-500/30"
            >
              Get Started — Login
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#features"
              className="flex items-center justify-center px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition"
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-teal-600">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900">Everything You Need, In One Place</h2>
          <p className="text-slate-500 mt-3 text-base max-w-xl mx-auto">
            Purpose-built for pharmaceutical supply chains — from batch tracking to real-time analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description, color }) => (
            <div
              key={title}
              className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div
                className={`inline-flex items-center justify-center w-11 h-11 rounded-xl border ${colorMap[color]} mb-4`}
              >
                <Icon className={`w-5 h-5 ${iconColorMap[color]}`} />
              </div>
              <h3 className="font-bold text-slate-900 mb-1.5">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Built for Every Role</h2>
            <p className="text-slate-500 mt-3 text-base">
              Role-based access ensures every team member sees exactly what they need.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                role: 'Admin',
                badge: 'bg-purple-100 text-purple-800 border-purple-200',
                points: [
                  'Full system access & user management',
                  'Audit logs & compliance reports',
                  'Configure warehouses & settings',
                ],
              },
              {
                role: 'Inventory Manager',
                badge: 'bg-blue-100 text-blue-800 border-blue-200',
                points: [
                  'Manage products, batches & stock',
                  'Create and track shipments',
                  'Set reorder thresholds & alerts',
                ],
              },
              {
                role: 'Warehouse Manager',
                badge: 'bg-teal-100 text-teal-800 border-teal-200',
                points: [
                  'Monitor warehouse stock levels',
                  'Update incoming & outgoing stock',
                  'View transfer history & movements',
                ],
              },
            ].map(({ role, badge, points }) => (
              <div key={role} className="flex flex-col gap-4">
                <span className={`self-start px-3 py-1 rounded-full border text-xs font-bold ${badge}`}>
                  {role}
                </span>
                <ul className="space-y-2.5">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 text-white text-center px-8 py-16">
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-teal-500 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-emerald-500 rounded-full blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              Ready to Take Control?
            </h2>
            <p className="text-slate-300 text-base mb-8 max-w-md mx-auto">
              Sign in to your PharmaTrack account and get full visibility over your pharmaceutical supply chain today.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-sm transition shadow-xl shadow-teal-500/30"
            >
              Login to PharmaTrack
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center">
              <Pill className="w-4 h-4 text-white rotate-45" />
            </div>
            <span className="font-bold text-slate-900 text-sm">
              Pharma<span className="text-teal-600">Track</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} PharmaTrack. Pharmaceutical Supply Chain & Inventory Management Platform.
          </p>
        </div>
      </footer>
    </div>
  );
};
