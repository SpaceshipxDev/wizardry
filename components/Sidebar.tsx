// components/Sidebar.tsx
"use client";

import Link from "next/link";
import SheetsIcon from "@/components/icons/SheetsIcon";
import OperationsIcon from "@/components/icons/OperationsIcon";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-30" onClick={onClose}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow transition-transform transform ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <nav className="mt-4">
          <Link
            href="/"
            className="flex items-center gap-4 px-6 py-3 hover:bg-gray-100 rounded-r-full"
            onClick={onClose}
          >
            <SheetsIcon />
            <span className="text-gray-900 font-medium">Sheets</span>
          </Link>
          <Link
            href="/operations"
            className="flex items-center gap-4 px-6 py-3 hover:bg-gray-100 rounded-r-full"
            onClick={onClose}
          >
            <OperationsIcon />
            <span className="text-gray-900 font-medium">Operations</span>
          </Link>
        </nav>
      </div>
    </>
  );
}

