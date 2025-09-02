"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import SheetsIcon from "@/components/icons/SheetsIcon";
import OperationsIcon from "@/components/icons/OperationsIcon";

// --- Placeholder Icons for UI fidelity ---
const SettingsIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
);
const HelpIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>
);
const DriveIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
);

// --- Reusable Sidebar Link Component ---
interface SidebarLinkProps {
  href: string;
  label: string;
  icon: React.ReactElement;
  onClick: () => void;
}
const SidebarLink = ({ href, label, icon, onClick }: SidebarLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);
  return (
    <li>
      <Link href={href} onClick={onClick} className={`flex items-center gap-5 px-6 py-2.5 text-sm font-medium rounded-r-full mr-4 transition-colors ${ isActive ? "bg-[#e8f0fe] text-[#1967d2]" : "text-zinc-700 hover:bg-gray-100"}`}>
        {React.cloneElement(icon, { className: `h-6 w-6 ${isActive ? "text-[#1967d2]" : "text-zinc-500"}` })}
        <span>{label}</span>
      </Link>
    </li>
  );
};

// --- Main Sidebar Component ---
interface SidebarProps {
  open: boolean;
  onClose: () => void;
}
export default function Sidebar({ open, onClose }: SidebarProps) {
  const [isActive, setIsActive] = React.useState(false);
  return (
    <>
      {/* Overlay to capture outside clicks */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-transparent"
          onClick={onClose}
          aria-hidden
        />
      )}
      
      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white flex flex-col ${
          isActive ? "shadow-2xl" : "shadow-xl"
        } transition-transform transition-shadow duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        onMouseDown={() => setIsActive(true)}
        onMouseUp={() => setIsActive(false)}
        onMouseLeave={() => setIsActive(false)}
        onTouchStart={() => setIsActive(true)}
        onTouchEnd={() => setIsActive(false)}
      >
        {/* Header/Logo */}
        <div className="flex items-center gap-2 px-6 py-5">
            <span className="text-2xl font-medium text-zinc-600">Eldaline</span>
        </div>

        {/* Navigation */}
        <div className="flex flex-col flex-grow overflow-y-auto">
          <nav className="flex-1 space-y-1 py-2">
            <ul>
                <SidebarLink href="/sheets" label="表格" icon={<SheetsIcon />} onClick={onClose} />
                <SidebarLink href="/operations" label="运营" icon={<OperationsIcon />} onClick={onClose} />
            </ul>
            
            <hr className="my-3 mx-6 border-gray-200" />
            
            <ul>
                <SidebarLink href="/settings" label="设置" icon={<SettingsIcon />} onClick={onClose} />
                <SidebarLink href="/help" label="帮助与反馈" icon={<HelpIcon />} onClick={onClose} />
            </ul>

            <hr className="my-3 mx-6 border-gray-200" />
            
            <ul>
                 <SidebarLink href="/drive" label="云盘" icon={<DriveIcon />} onClick={onClose} />
            </ul>

          </nav>

          {/* Footer */}
          <div className="px-6 py-4">
            <div className="text-xs text-center text-gray-500">
              <Link href="#" className="hover:underline">隐私政策</Link>
              <span className="mx-1">·</span>
              <Link href="#" className="hover:underline">服务条款</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
