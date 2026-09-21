import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { AIAssistantDrawer } from '../ai/AIAssistantDrawer';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, LogIn, UserCheck } from 'lucide-react';

export const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);

  const { isDemo, user, logout, hasRealAccount, realUser, restoreRealAccount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignInRedirect = () => {
    logout();
    navigate('/login');
  };

  const handleReturnToReal = () => {
    restoreRealAccount();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex transition-colors duration-150">
      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        onOpenAI={() => setIsAIOpen(true)}
      />

      {/* Main Container */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out
          ${isCollapsed ? 'lg:pl-20' : 'lg:pl-64'}
        `}
      >
        {/* Top Sticky Demo Warning Banner */}
        {isDemo && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2 z-40">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-600 text-white text-[10px]">
                Demo Sandbox ({user?.name || 'demoAdmin'})
              </span>
              <span className="font-medium text-[11px] sm:text-xs">
                {hasRealAccount
                  ? `Simulating ${user?.role} perspective with mock data. Real database is protected.`
                  : 'You are viewing PharmaTrack with simulated demonstration data. Database modification is disabled.'}
              </span>
            </div>
            {hasRealAccount ? (
              <button
                onClick={handleReturnToReal}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition shadow-xs"
              >
                <UserCheck className="w-3.5 h-3.5" /> Return to My Account ({realUser?.name})
              </button>
            ) : (
              <button
                onClick={handleSignInRedirect}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" /> Sign in with real account
              </button>
            )}
          </div>
        )}

        {/* Top Navbar */}
        <Navbar
          isCollapsed={isCollapsed}
          onToggleMobile={() => setIsMobileOpen(!isMobileOpen)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAI={() => setIsAIOpen(true)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in-50 duration-200">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Global Quick Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* PharmaTrack AI Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
      />
    </div>
  );
};