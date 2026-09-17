import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Pill,
  Layers,
  CalendarClock,
  Building2,
  Truck,
  ArrowLeftRight,
  AlertTriangle,
  BarChart3,
  History,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';

export const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen, onOpenAI }) => {
  const { user, logout, isAdmin } = useAuth();
  const { unreadCount, criticalCount } = useAlerts();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Products', path: '/products', icon: Pill },
    { label: 'Inventory', path: '/inventory', icon: Layers },
    { label: 'Batches & Expiry', path: '/batches', icon: CalendarClock },
    { label: 'Warehouses', path: '/warehouses', icon: Building2 },
    { label: 'Shipments', path: '/shipments', icon: Truck },
    { label: 'Stock Movements', path: '/movements', icon: ArrowLeftRight },
    {
      label: 'Alerts',
      path: '/alerts',
      icon: AlertTriangle,
      badge: unreadCount > 0 ? unreadCount : null,
      badgeColor: criticalCount > 0 ? 'bg-rose-600' : 'bg-amber-600'
    },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    ...(isAdmin ? [{ label: 'Audit Logs', path: '/audit-logs', icon: History }] : []),
    ...(isAdmin ? [{ label: 'Users', path: '/users', icon: Users }] : []),
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 text-white shadow-md shadow-teal-500/20 shrink-0">
              <Pill className="w-5 h-5 rotate-45" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  Pharma<span className="text-teal-400">Track</span>
                </span>
                <span className="text-[10px] uppercase font-semibold text-teal-300/80 tracking-widest -mt-1">
                  Ops Platform
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* AI Assistant Quick Trigger Banner */}
        {!isCollapsed && (
          <div className="px-3 pt-3">
            <button
              onClick={onOpenAI}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-teal-950/50 border border-teal-800/60 text-teal-300 hover:bg-teal-900/50 transition text-xs font-medium group"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-teal-400 group-hover:rotate-12 transition-transform" />
                <span>AI Ops Assistant</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-teal-800/80 text-teal-200">Live</span>
            </button>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative
                  ${isActive
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-700/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }
                  ${isCollapsed ? 'justify-center px-0' : ''}
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isCollapsed ? 'mx-auto' : ''}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}

                {item.badge && (
                  <span
                    className={`ml-auto px-1.5 py-0.5 rounded-full text-[11px] font-bold text-white leading-none ${item.badgeColor} ${isCollapsed ? 'absolute top-1.5 right-1.5 w-2.5 h-2.5 p-0 text-[0px]' : ''}`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer User Info & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/30">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-3`}>
            {!isCollapsed && (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200 shrink-0">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-xs font-semibold text-white truncate">{user?.name}</span>
                  <span className="text-[10px] text-teal-400 font-mono tracking-tight">{user?.role}</span>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};