import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { AIAssistantDrawer } from '../ai/AIAssistantDrawer';
import { ErrorBoundary } from '../common/ErrorBoundary';

export const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);

  const location = useLocation();

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