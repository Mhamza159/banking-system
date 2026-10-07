import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileNav from "./MobileNav";

/**
 * DashboardLayout Component (Authenticated Master Shell)
 * Integrates fixed desktop Sidebar, slide-over MobileNav, dynamic Header, and main viewport.
 */
export default function DashboardLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas text-text-primary flex">
      {/* 1. Desktop Fixed Sidebar */}
      <Sidebar />

      {/* 2. Responsive Mobile Drawer (< 1024px) */}
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* 3. Primary Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto [scrollbar-gutter:stable] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
