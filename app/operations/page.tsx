// app/operations/page.tsx - Operations dashboard styled like Sheets
"use client";

import type { NextPage } from "next";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search, MoreVertical } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import OperationsIcon from "@/components/icons/OperationsIcon";
import SheetsIcon from "@/components/icons/SheetsIcon";
import StageDots, { STAGES as SHEET_STAGES } from "@/components/sheets/StageDots";

// Small UI helpers for metrics and tabs
const MetricCard = ({ title, value }: { title: string; value: string | number }) => (
  <div className="bg-white rounded-lg p-6 border border-gray-200/90">
    <p className="text-sm text-zinc-500 mb-1">{title}</p>
    <p className="text-4xl font-semibold text-zinc-800 tracking-tight">{value}</p>
  </div>
);

const Tab = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-1.5 sm:px-2 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
      ${active ? 'text-[#1A73E8] border-b-2 border-[#1A73E8]' : 'text-zinc-600 hover:text-zinc-900 border-b-2 border-transparent'}`}
  >
    {label}
  </button>
);

type FileRowProps = {
  icon: "sheets";
  name: string;
  customerName?: string;
  dueDate?: string;
  lastOpened: string;
  currentStage?: string;
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
        {icon === 'sheets' ? <SheetsIcon /> : null}
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

const OperationsPage: NextPage = () => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  type TabType = "today" | "tomorrow" | "overdue";
  const [activeTab, setActiveTab] = useState<TabType>("overdue");
  const [items, setItems] = useState<Array<{ id: string; title: string; updated_at: string; customerName?: string; dueDate?: string; currentStage?: string }>>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ id: string; title: string; updated_at: string }>>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
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

  // Helpers and grouping for tabs (今天交 / 明天交 / 延期)
  const toDateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const parseDue = (s?: string) => {
    if (!s) return null;
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return toDateOnly(d).getTime();
  };
  const todayMs = useMemo(() => toDateOnly(new Date()).getTime(), []);
  const tomorrowMs = useMemo(() => toDateOnly(new Date(Date.now() + 24 * 60 * 60 * 1000)).getTime(), []);

  const grouped = useMemo(() => {
    const groups: Record<TabType, typeof items> = { today: [], tomorrow: [], overdue: [] };
    for (const it of items) {
      const due = parseDue(it.dueDate);
      if (due === null) continue;
      if (due === todayMs) groups.today.push(it);
      else if (due === tomorrowMs) groups.tomorrow.push(it);
      else if (due < todayMs) groups.overdue.push(it);
    }
    return groups;
  }, [items, todayMs, tomorrowMs]);

  const counts = useMemo(() => ({
    today: grouped.today.length,
    tomorrow: grouped.tomorrow.length,
    overdue: grouped.overdue.length,
  }), [grouped]);

  const displayedSheets = useMemo(() => grouped[activeTab] || [], [activeTab, grouped]);

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
            <OperationsIcon />
            <span className="text-xl text-zinc-700 hidden sm:inline">Eldaline 运营</span>
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
              placeholder="搜索运营"
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

      {/* Grey section with KPIs to mirror sheets spacing */}
      <section className="bg-[#F8F9FA] py-10 sm:py-12 md:py-16 px-4 sm:px-8 md:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard title="毛利（本月）" value={"$15,820"} />
            <MetricCard title="逾期订单" value={counts.overdue} />
            <MetricCard title="新订单（今日）" value={12} />
            <MetricCard title="新订单（本月）" value={145} />
          </div>
        </div>
      </section>

      <main className="bg-white py-4 px-4 sm:px-8 md:px-16">
        <div className="max-w-7xl mx-auto">
          <div>
            {/* Tabs for filtering */}
            <div className="flex items-center gap-5 mb-4">
              <Tab label={`今天交 (${counts.today})`} active={activeTab === 'today'} onClick={() => setActiveTab('today')} />
              <Tab label={`明天交 (${counts.tomorrow})`} active={activeTab === 'tomorrow'} onClick={() => setActiveTab('tomorrow')} />
              <Tab label={`延期 (${counts.overdue})`} active={activeTab === 'overdue'} onClick={() => setActiveTab('overdue')} />
            </div>
            {displayedSheets.length > 0 && (
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
              <p className="text-sm text-zinc-600">暂无记录。</p>
            )}
            {displayedSheets.map((item) => (
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

export default OperationsPage;
