"use client";

import { useEffect, useRef, useState } from 'react';

export default function CommentPopup({
  onClose,
  onComment,
  onSelectStage,
  stageValue = null,
  showStagePicker = false,
  stageOptions = [],
}: {
  onClose: () => void;
  onComment: (text: string) => void;
  onSelectStage?: (stage: string) => void;
  stageValue?: string | null;
  showStagePicker?: boolean;
  stageOptions?: string[];
}) {
  const [text, setText] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);
  const selectedIdx = stageValue ? stageOptions.indexOf(stageValue) : -1;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, [onClose]);

  const handleCommentClick = () => {
    const trimmed = text.trim();
    if (trimmed || (showStagePicker && stageValue)) {
      onComment(trimmed);
    }
  };

  return (
    <div
      ref={popupRef}
      className="absolute top-full left-0 mt-2 z-50 w-[340px] bg-white rounded-2xl shadow-xl border p-4 flex flex-col gap-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-pink-500 flex items-center justify-center text-white font-semibold text-lg">
          e
        </div>
        <span className="font-medium text-gray-800">elijiah</span>
      </div>
      {showStagePicker && onSelectStage && (
        <div className="flex flex-col gap-1.5">
          {stageOptions.map((s, idx) => (
            <label key={s} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="accent-blue-600 w-3.5 h-3.5"
                checked={selectedIdx >= 0 && idx <= selectedIdx}
                onChange={() => onSelectStage(s)}
              />
              <span className="text-sm text-gray-800">{s}</span>
            </label>
          ))}
        </div>
      )}
      <div>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="发表评论，或用 @ 提及"
          className="w-full px-4 py-2.5 text-base text-black border border-gray-400 rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-gray-400"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCommentClick(); }
            if (e.key === 'Escape') { onClose(); }
          }}
        />
      </div>
      <div className="flex justify-end items-center gap-2">
        <button
          onClick={onClose}
          className="text-sm font-semibold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-full"
        >
          取消
        </button>
        <button
          onClick={handleCommentClick}
          disabled={!text.trim() && !(showStagePicker && stageValue)}
          className="text-sm font-semibold text-white px-6 py-2 rounded-full transition-colors disabled:bg-gray-200 disabled:text-gray-500 bg-blue-600 hover:bg-blue-700"
        >
          评论
        </button>
      </div>
    </div>
  );
}
