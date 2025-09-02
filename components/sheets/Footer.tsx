"use client";

import { Plus, List, LayoutGrid } from 'lucide-react';

export default function Footer({
  sheets, activeSheet, setActiveSheet
}: { sheets: string[], activeSheet: string, setActiveSheet: (s: string) => void }) {
  const first = sheets[0];
  const rest = sheets.slice(1);

  const Tab = ({ name }: { name: string }) => (
    <button
      onClick={() => setActiveSheet(name)}
      className={`px-4 py-1.5 text-sm font-medium transition-colors ${
        activeSheet === name ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-600 hover:bg-gray-200 rounded-md'
      }`}
    >
      {name}
    </button>
  );

  return (
    <footer className="flex-shrink-0 bg-white p-1.5 border-t flex items-center shadow-inner">
      <button className="p-1.5 rounded hover:bg-gray-200" title="新增工作表"><Plus size={20} /></button>
      <div className="h-5 w-px bg-gray-300 mx-1" />
      {first && <Tab name={first} />}
      <div className="mx-5 flex items-center justify-center text-gray-400" aria-hidden="true">
        <LayoutGrid size={22} strokeWidth={1.6} />
      </div>
      {rest.map((name) => (
        <Tab key={name} name={name} />
      ))}
      <div className="ml-auto">
        <button className="p-1.5 rounded hover:bg-gray-200" title="工作表列表"><List size={18} /></button>
      </div>
    </footer>
  );
}
