"use client";

import Link from 'next/link';
import { Star, Folder, Cloud } from 'lucide-react';
import SheetsIcon from '@/components/icons/SheetsIcon';

export default function Header({
  title,
  editingTitle,
  setEditingTitle,
  onTitleChange,
  onTitleCommit,
}: {
  title: string;
  editingTitle: boolean;
  setEditingTitle: (v: boolean) => void;
  onTitleChange: (v: string) => void;
  onTitleCommit: () => void;
}) {
  return (
    <header className="flex-shrink-0 bg-white p-2 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/sheets" className="w-7 h-7 inline-flex items-center justify-center" title="返回主页">
            <div className="cursor-pointer hover:opacity-80">
              <SheetsIcon />
            </div>
          </Link>
          <div>
            <div className="flex items-center">
              {editingTitle ? (
                <input
                  className="text-lg text-gray-800 border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  autoFocus
                  onBlur={(e) => { e.stopPropagation(); onTitleCommit(); }}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') onTitleCommit();
                    if (e.key === 'Escape') setEditingTitle(false);
                  }}
                  onPaste={(e) => e.stopPropagation()}
                />
              ) : (
                <button
                  className="text-left text-lg text-gray-800 hover:bg-gray-200 rounded px-1"
                  onClick={() => setEditingTitle(true)}
                  title="重命名"
                >
                  {title || '未命名'}
                </button>
              )}
              <div className="flex items-center ml-2 text-gray-500">
                <Star size={16} className="p-1 hover:bg-gray-200 rounded-full" />
                <Folder size={16} className="p-1 hover:bg-gray-200 rounded-full" />
                <Cloud size={16} className="p-1 hover:bg-gray-200 rounded-full" />
              </div>
            </div>
            <div className="flex items-center text-xs gap-3 text-gray-600">
              <span>文件</span><span>编辑</span><span>查看</span><span>插入</span>
              <span>格式</span><span>数据</span><span>工具</span><span>帮助</span>
            </div>
          </div>
        </div>
        {/* The "Share" button and profile icon have been removed from here. */}
      </div>
    </header>
  );
}
