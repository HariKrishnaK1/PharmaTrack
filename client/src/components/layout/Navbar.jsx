import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Sparkles,
  ShieldCheck,
  LogOut,
  ChevronDown,
  UserCheck,
  Check,
  AlertTriangle,
  ExternalLink,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';
import { useTheme } from '../../context/ThemeContext';

export const Navbar = ({ isCollapsed, onToggleMobile, onOpenSearch, onOpenAI }) => {
  const { user, logout, demoLogin } = useAuth();
  const { alerts, unreadCount, criticalCount, markRead } = useAlerts();
  const { isDark, toggleTheme } = useTheme();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showAlertMenu, setShowAlertMenu] = useState(false);
  const navigate = useNavigate();

  const roleMenuRef = useRef(null);
  const alertMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target)) setShowRoleMenu(false);
      if (alertMenuRef.current && !alertMenuRef.current.contains(e.target)) setShowAlertMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSwitch = async (role) => {
    setShowRoleMenu(false);
    await demoLogin(role);
    window.location.reload();
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'System Admin', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'INVENTORY_MANAGER':
        return { label: 'Inventory Manager', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'WAREHOUSE_MANAGER':
        return { label: 'Warehouse Manager', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
      default:
        return { label: role, bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const roleBadge = getRoleBadge(user?.role);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-slate-200/80 shadow-xs">
      {/* Left section: Mobile Toggle & Global Search Bar */}
      <div className="flex items-center gap-3 md:gap-4 flex-1 max-w-xl">
        <button
          onClick={onToggleMobile}
          className="p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenSearch}
          className="flex items-center justify-between w-full max-w-md px-3.5 py-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-100/70 transition shadow-2xs group text-left"
        >
          <span className="flex items-center gap-2 text-slate-500 group-hover:text-slate-700">
            <Search className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Search products, batches, warehouses, shipments...</span>
            <span className="sm:hidden">Quick Search...</span>
          </span>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right section: AI trigger, Alerts, Role Switcher, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* AI Assistant Quick Pill Button */}
        <button
          onClick={onOpenAI}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100/80 transition shadow-2xs"
          title="Open AI Operations Assistant"
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span className="hidden md:inline">AI Assistant</span>
        </button>

        {/* Theme Toggle Button (Light / Dark) */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition shadow-2xs"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300 transition-transform duration-200 rotate-0 hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-slate-500 hover:text-slate-800 transition-transform duration-200 hover:-rotate-12" />
          )}
        </button>

        {/* Operational Alerts Bell Dropdown */}
        <div className="relative" ref={alertMenuRef}>
          <button
            onClick={() => setShowAlertMenu(!showAlertMenu)}
            className="relative p-2 text-slate-500 rounded-lg hover:text-slate-800 hover:bg-slate-100 transition"
            title="Operational Alerts"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span
                className={`absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white rounded-full ${criticalCount > 0 ? 'bg-rose-600 ring-2 ring-white animate-pulse' : 'bg-amber-600 ring-2 ring-white'}`}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Alerts Dropdown Popover */}
          {showAlertMenu && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Operational Alerts</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-full">
                      {unreadCount} active
                    </span>
                  )}
                </div>
                <Link
                  to="/app/alerts"
                  onClick={() => setShowAlertMenu(false)}
                  className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
                >
                  View All <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No active operational alerts. System functioning normally.
                  </div>
                ) : (
                  alerts.slice(0, 5).map(alert => (
                    <div
                      key={alert._id}
                      onClick={() => {
                        markRead(alert._id);
                        navigate('/app/alerts');
                        setShowAlertMenu(false);
                      }}
                      className="p-3.5 hover:bg-slate-50 transition cursor-pointer flex items-start gap-3"
                    >
                      <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${alert.severity === 'CRITICAL' ? 'text-rose-600' : 'text-amber-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">{alert.title}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{alert.message}</div>
                        <div className="text-[10px] text-slate-400 mt-1">{new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Demo Role Switcher Dropdown (Portfolio convenience) */}
        <div className="relative" ref={roleMenuRef}>
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border ${roleBadge.bg} transition hover:opacity-90`}
            title="Switch demo role perspective"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-semibold">{roleBadge.label}</span>
            <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 p-1.5 text-xs">
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Simulate Role View
              </div>
              <button
                onClick={() => handleRoleSwitch('ADMIN')}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition text-left"
              >
                <div>
                  <div className="font-semibold text-slate-900">Administrator</div>
                  <div className="text-[10px] text-slate-500">Full platform governance & user control</div>
                </div>
                {user?.role === 'ADMIN' && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
              </button>

              <button
                onClick={() => handleRoleSwitch('INVENTORY_MANAGER')}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition text-left"
              >
                <div>
                  <div className="font-semibold text-slate-900">Inventory Manager</div>
                  <div className="text-[10px] text-slate-500">Stock movements, batches & shipments</div>
                </div>
                {user?.role === 'INVENTORY_MANAGER' && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
              </button>

              <button
                onClick={() => handleRoleSwitch('WAREHOUSE_MANAGER')}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition text-left"
              >
                <div>
                  <div className="font-semibold text-slate-900">Warehouse Manager</div>
                  <div className="text-[10px] text-slate-500">Regional hub stock & intake tracking</div>
                </div>
                {user?.role === 'WAREHOUSE_MANAGER' && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
              </button>
            </div>
          )}
        </div>

        {/* User initials icon */}
        <div className="w-8 h-8 rounded-full bg-teal-800 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
          {user?.name?.charAt(0) || 'U'}
        </div>
      </div>
    </header>
  );
};