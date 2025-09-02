"use client";

export default function FormulaBar({
  selectedCellId, value, onValueChange, onCommit
}: { selectedCellId: string, value: string, onValueChange: (newValue: string) => void, onCommit: () => void }) {
  return (
    <div className="flex-shrink-0 bg-white p-1.5 border-b flex items-center shadow-sm">
      <div className="px-3 py-1 border-r text-gray-500 font-mono text-sm">{selectedCellId}</div>
      <div className="flex items-center text-purple-700 font-mono text-lg italic px-3">fx</div>
      <input
        type="text"
        className="flex-grow outline-none px-2 py-1 text-black"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') onCommit(); }}
      />
    </div>
  );
}

