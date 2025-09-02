// app/sheets/page.tsx - Sheets Index
"use client";

import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search, ArrowUpDown, MoreVertical, ChevronDown } from 'lucide-react';
import SheetsIcon from '@/components/icons/SheetsIcon';
import StageDots, { STAGES as SHEET_STAGES } from '@/components/sheets/StageDots';
import Sidebar from '@/components/Sidebar';

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

type FileRowProps = {
  icon: 'sheets' | 'excel';
  name: string;
  customerName?: string; // 客户名称
  dueDate?: string;      // 交期
  lastOpened: string;
  currentStage?: string; // 进度阶段
  onClick?: () => void;
};

const FileRow = ({ icon, name, customerName, dueDate, lastOpened, currentStage, onClick }: FileRowProps) => (
  <div
    role="button"
    tabIndex={0}
    className="group w-full cursor-pointer"
    onClick={onClick}
    onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(); }}}
    title={name}
  >
    <div className="grid grid-cols-[40px_minmax(0,1fr)_220px_160px_180px_180px_40px] items-center px-3 sm:px-4 py-3.5 hover:bg-zinc-50 border-b border-zinc-100">
      <div className="w-10 opacity-90 group-hover:opacity-100 transition-opacity">
        {icon === 'sheets' ? <SheetsIcon /> : <ExcelIcon />}
      </div>
      <div className="min-w-0 pr-3">
        <p className="truncate text-sm text-zinc-800 font-medium">{name}</p>
      </div>
      <div className="hidden md:block pr-3">
        <p className="truncate text-sm text-zinc-600">{customerName || '—'}</p>
      </div>
      <div className="hidden sm:block pr-3">
        <p className="truncate text-sm text-zinc-600">{dueDate || '—'}</p>
      </div>
      <div className="hidden lg:block pr-3">
        <StageDots currentStage={currentStage} stages={SHEET_STAGES} size={6} title="进度" />
      </div>
      <div className="pr-3">
        <p className="truncate text-sm text-zinc-600">{lastOpened}</p>
      </div>
      <div className="w-10 text-center">
        <MoreVertical size={18} className="text-zinc-400 group-hover:text-zinc-600 transition-colors" />
      </div>
    </div>
  </div>
);

const SheetsIndexPage: NextPage = () => {
  const router = useRouter();
  const [items, setItems] = useState<Array<{ id: string; title: string; updated_at: string; customerName?: string; dueDate?: string; currentStage?: string }>>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; title: string; updated_at: string; customerName?: string; dueDate?: string; currentStage?: string }>>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);

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
    setNavigating(true);
    router.push('/sheets/new');
  };

  const formatLastOpened = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    return isToday
      ? d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
      : d.toLocaleDateString('zh-CN');
  };

  useEffect(() => {
    let cancelled = false;
    if (!query.trim()) { setResults([]); setSearching(false); return; }
    setSearching(true);
    const h = setTimeout(async () => {
      try {
        const res = await fetch(`/api/sheets?q=${encodeURIComponent(query.trim())}`, { cache: 'no-store' });
        const data = (await res
          .json()
          .catch(() => ({}) as { items?: Array<{ id: string; title: string; updated_at: string }> }));
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
      <header className="relative flex items-center justify-center p-2 pl-4 pr-4 border-b border-zinc-200 bg-white sticky top-0 z-10">
        <div className="absolute left-4 flex items-center gap-4">
          <button aria-label="打开菜单" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} className="text-zinc-600" />
          </button>
          <div className="flex items-center gap-2">
            <SheetsIcon />
            <span className="text-xl text-zinc-700 hidden sm:inline">Eldaline 表格</span>
          </div>
        </div>

        <div className="w-full max-w-2xl mx-4">
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
                  if (target) { router.push(`/sheets/${target.id}`); setOpen(false); }
                } else if (e.key === 'Escape') { setOpen(false); }
              }}
              placeholder="搜索表格"
              className="w-full bg-[#F1F3F4] rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition text-black placeholder:text-gray-500"
            />

            {open && query.trim().length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 shadow-xl rounded-2xl overflow-hidden">
                <div className="max-h-80 overflow-auto">
                  {searching && (
                    <div className="px-4 py-4 flex items-center gap-3 text-sm text-gray-600">
                      <span className="inline-block h-4 w-4 border-2 border-gray-300 border-t-[#1A73E8] rounded-full animate-spin" />
                      搜索中…
                    </div>
                  )}
                  {!searching && results.length === 0 && (
                    <div className="px-4 py-6 text-sm text-gray-500 text-center">无匹配</div>
                  )}
                  {!searching && results.map((r, idx) => (
                  <button
                      key={r.id}
                      onMouseDown={(e) => { e.preventDefault(); }}
                      onClick={() => { setNavigating(true); router.push(`/sheets/${r.id}`); setOpen(false); }}
                      onMouseEnter={() => setActiveIdx(idx)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition ${idx === activeIdx ? 'bg-gray-50' : ''}`}
                    >
                      <div className="w-6 h-6 flex items-center justify-center"><SheetsIcon /></div>
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm text-zinc-800">{r.title}</div>
                        <div className="text-xs text-zinc-500">最近活动 {formatLastOpened(r.updated_at)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </header>

      <section className="bg-[#F8F9FA] py-4 px-4 sm:px-8 md:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base text-gray-800">新建表格</h2>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 text-sm text-gray-600 hover:bg-gray-200 px-3 py-2 rounded-md">
                模板库
                <ArrowUpDown size={16} />
              </button>
              <div className="border-l border-gray-300 h-6"></div>
              <MoreVertical size={20} className="text-gray-600 cursor-pointer" />
            </div>
          </div>
          
          <div>
            <button onClick={onCreate} className="block w-44 text-left" title="新建表格">
              <div className="cursor-pointer border border-gray-300 hover:border-blue-500 rounded-md h-36 flex items-center justify-center bg-white">
                <GooglePlusIcon />
              </div>
              <p className="mt-2 text-sm text-gray-800">空白表格</p>
            </button>
          </div>
        </div>
      </section>

      <main className="bg-white py-4 px-4 sm:px-8 md:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
              全部表格
              <ChevronDown size={16} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-zinc-800 my-4">最近</h3>
            {/* Column header */}
            {items.length > 0 && (
              <div className="grid grid-cols-[40px_minmax(0,1fr)_220px_160px_180px_180px_40px] items-center px-3 sm:px-4 py-2 text-xs text-zinc-500 uppercase tracking-wide border-b border-zinc-200">
                <div></div>
                <div className="pr-3">标题</div>
                <div className="hidden md:block pr-3">客户名称</div>
                <div className="hidden sm:block pr-3">交期</div>
                <div className="hidden lg:block pr-3">进度</div>
                <div className="pr-3">最近活动</div>
                <div></div>
              </div>
            )}
            {items.length === 0 && (
              <p className="text-sm text-zinc-600">暂无表格。可在上方新建。</p>
            )}
            {items.map((item) => (
              <FileRow
                key={item.id}
                icon="sheets"
                name={item.title}
                customerName={item.customerName}
                dueDate={item.dueDate}
                lastOpened={formatLastOpened(item.updated_at)}
                currentStage={item.currentStage}
                onClick={() => { setNavigating(true); router.push(`/sheets/${item.id}`); }}
              />
            ))}
          </div>
        </div>
      </main>

      {(loading || navigating) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-[#1A73E8] animate-spin" />
        </div>
      )}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  );
};

export default SheetsIndexPage;
