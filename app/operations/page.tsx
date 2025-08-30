// app/operations/page.tsx - Operations dashboard
"use client";

import type { NextPage } from "next";
import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import OperationsIcon from "@/components/icons/OperationsIcon";

const OperationsPage: NextPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="bg-[#F8F9FA] min-h-screen font-sans">
      <header className="flex items-center justify-between p-2 pl-4 pr-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button aria-label="Open menu" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <OperationsIcon />
            <span className="text-xl text-gray-700 hidden sm:inline">Eldaline Operations</span>
          </div>
        </div>
      </header>

      <main className="p-6 text-gray-700 text-sm">
        No operations available.
      </main>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  );
};

export default OperationsPage;

