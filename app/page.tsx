// app/page.tsx - Dashboard
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Menu, 
  Search, 
  Grip, 
  ArrowUpDown, 
  MoreVertical, 
  Rows3, 
  Folder,
  ChevronDown
} from 'lucide-react';
import SheetsIcon from '@/components/icons/SheetsIcon';

// --- Custom SVG Icons for Logos ---

const ExcelIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 3H4C3.44772 3 3 3.44772 3 4V20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20V4C21 3.44772 20.5523 3 20 3Z" fill="#107C41"/>
    <path d="M9.04883 8.23438L12 12L14.9512 8.23438L16.3652 9.42383L13.4141 12.1895L16.3652 14.9551L14.9512 16.1445L12 13.3789L9.04883 16.1445L7.63477 14.9551L10.5859 12.1895L7.63477 9.42383L9.04883 8.23438Z" fill="white"/>
  </svg>
);

const GooglePlusIcon = () => (
  <div className="relative w-11 h-11">
    <div className="absolute top-1/2 left-0 w-full h-[10px] -translate-y-1/2 bg-[#4285F4]"></div>
    <div className="absolute top-0 left-1/2 w-[10px] h-full -translate-x-1/2 bg-[#34A853]"></div>
    <div className="absolute top-1/2 left-1/2 w-[10px] h-[10px] -translate-x-1/2 -translate-y-1/2 bg-[#188038]"></div>
    <div className="absolute top-1/2 left-0 w-[10px] h-[10px] -translate-y-1/2 bg-[#EA4335]"></div>
    <div className="absolute top-0 left-1/2 w-[10px] h-[10px] -translate-x-1/2 bg-[#FBBC05]"></div>
  </div>
);

// --- Reusable File Row Component ---

type FileRowProps = {
  icon: 'sheets' | 'excel';
  name: string;
  owner: string;
  lastOpened: string;
  onClick?: () => void;
};

const FileRow = ({ icon, name, owner, lastOpened, onClick }: FileRowProps) => (
  <div className="flex items-center px-4 py-2 hover:bg-gray-100 rounded-md cursor-pointer" onClick={onClick}>
    <div className="w-10">
      {icon === 'sheets' ? <SheetsIcon /> : <ExcelIcon />}
    </div>
    <p className="flex-grow text-sm text-gray-700">{name}</p>
    <p className="w-36 text-sm text-gray-600">{owner}</p>
    <p className="w-48 text-sm text-gray-600">{lastOpened}</p>
    <div className="w-10 text-center">
      <MoreVertical size={20} className="text-gray-600" />
    </div>
  </div>
);

// --- Main Page Component ---

const SheetsHomePage: NextPage = () => {
  const router = useRouter();
  const [items, setItems] = useState<Array<{ id: string; title: string; updated_at: string }>>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; title: string; updated_at: string }>>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sheets', { cache: 'no-store' });
      const data = await res.json();
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const onCreate = () => {
    // Navigate immediately to draft editor; sheet will be created on first edit
    router.push('/sheet/new');
  };

  const formatLastOpened = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    return isToday ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString();
  };

  // Debounced search
  useEffect(() => {
    let cancelled = false;
    if (!query.trim()) { setResults([]); setSearching(false); return; }
    setSearching(true);
    const h = setTimeout(async () => {
      try {
        const res = await fetch(`/api/sheets?q=${encodeURIComponent(query.trim())}`, { cache: 'no-store' });
        const data = await res.json().catch(() => ({} as any));
        if (!cancelled) {
          setResults(Array.isArray(data.items) ? data.items : []);
          setActiveIdx(-1);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 200);
    return () => { cancelled = true; clearTimeout(h); };
  }, [query]);

  return (
    <div className="bg-[#F8F9FA] min-h-screen font-sans">
      {/* Header */}
      <header className="flex items-center justify-between p-2 pl-4 pr-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Menu size={24} className="text-gray-600" />
          <div className="flex items-center gap-2">
            <SheetsIcon />
            <span className="text-xl text-gray-700 hidden sm:inline">Sheets</span>
          </div>
        </div>
        
        <div className="flex-grow max-w-2xl mx-4">
          <div className="relative">
            <Search size={20} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 120)}
              onKeyDown={(e) => {
                if (!open) return;
                if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min((results.length - 1), i + 1)); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(-1, i - 1)); }
                else if (e.key === 'Enter') {
                  const target = results[activeIdx] ?? results[0];
                  if (target) { router.push(`/sheet/${target.id}`); setOpen(false); }
                } else if (e.key === 'Escape') { setOpen(false); }
              }}
              placeholder="Search spreadsheets"
              className="w-full bg-[#F1F3F4] rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition text-black placeholder:text-gray-500"
            />

            {open && query.trim().length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 shadow-xl rounded-2xl overflow-hidden">
                <div className="max-h-80 overflow-auto">
                  {searching && (
                    <div className="px-4 py-4 flex items-center gap-3 text-sm text-gray-600">
                      <span className="inline-block h-4 w-4 border-2 border-gray-300 border-t-[#1A73E8] rounded-full animate-spin" />
                      Searching…
                    </div>
                  )}
                  {!searching && results.length === 0 && (
                    <div className="px-4 py-6 text-sm text-gray-500 text-center">No matches</div>
                  )}
                  {!searching && results.map((r, idx) => (
                    <button
                      key={r.id}
                      onMouseDown={(e) => { e.preventDefault(); }}
                      onClick={() => { router.push(`/sheet/${r.id}`); setOpen(false); }}
                      onMouseEnter={() => setActiveIdx(idx)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition ${idx === activeIdx ? 'bg-gray-50' : ''}`}
                    >
                      <div className="w-6 h-6 flex items-center justify-center"><SheetsIcon /></div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm text-gray-800">{r.title}</div>
                        <div className="text-xs text-gray-500">Last opened {formatLastOpened(r.updated_at)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Grip size={24} className="text-gray-600" />
          <div className="w-8 h-8 rounded-full bg-[#1E8E3E] flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
        </div>
      </header>

      {/* Start a new spreadsheet section */}
      <section className="bg-[#F8F9FA] py-4 px-4 sm:px-8 md:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base text-gray-800">Start a new spreadsheet</h2>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 text-sm text-gray-600 hover:bg-gray-200 px-3 py-2 rounded-md">
                Template gallery
                <ArrowUpDown size={16} />
              </button>
              <div className="border-l border-gray-300 h-6"></div>
              <MoreVertical size={20} className="text-gray-600 cursor-pointer" />
            </div>
          </div>
          
          <div>
            {/* Blank Spreadsheet -> navigates to editor */}
            <button onClick={onCreate} className="block w-44 text-left" title="Start a new sheet">
              <div className="cursor-pointer border border-gray-300 hover:border-blue-500 rounded-md h-36 flex items-center justify-center bg-white">
                <GooglePlusIcon />
              </div>
              <p className="mt-2 text-sm text-gray-800">Blank spreadsheet</p>
            </button>
          </div>
        </div>
      </section>

      {/* File List Section */}
      <main className="bg-white py-4 px-4 sm:px-8 md:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              Owned by anyone
              <ChevronDown size={16} />
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm text-gray-700 font-medium">Last opened by me</span>
              <div className="flex items-center gap-4 text-gray-600">
                <Rows3 size={20} className="cursor-pointer" />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="cursor-pointer"><path d="M3 18V16H8V18H3ZM3 13V11H13V13H3ZM3 8V6H18V8H3ZM21.425 15.25L19.425 13.25L18 14.675L21.425 18.1L26 13.525L24.575 12.1L21.425 15.25Z" fill="currentColor"/></svg>
                <Folder size={20} className="cursor-pointer" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-800 my-4">Recent</h3>
            {items.length === 0 && (
              <p className="text-sm text-gray-600">No spreadsheets yet. Create one above.</p>
            )}
            {items.map((item) => (
              <FileRow
                key={item.id}
                icon="sheets"
                name={item.title}
                owner="me"
                lastOpened={formatLastOpened(item.updated_at)}
                onClick={() => router.push(`/sheet/${item.id}`)}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Global loading overlay (Google-style spinner) */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-[#1A73E8] animate-spin" />
        </div>
      )}
    </div>
  );
};

export default SheetsHomePage;
