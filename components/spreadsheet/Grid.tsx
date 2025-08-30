// @components/spreadshee/Grid.tsx

'use client';

import { useRef, useEffect, KeyboardEvent, MouseEvent } from 'react';
import { MasterDataRow } from '@/components/spreadsheet/types';

interface SpreadsheetGridProps {
  numRows: number;
  visibleColumns: { key: string; header: string }[];
  // Set of column keys that are reused across views ("global")
  reusedColumnKeys?: Set<string>;
  // Set of column keys that are specific to the current sheet
  sheetSpecificColumnKeys?: Set<string>;
  // When true, briefly glow sheet-specific columns (on tab switch)
  highlightSpecific?: boolean;
  masterData: MasterDataRow[];
  activeCell: { row: number; col: number };
  editingCell: { row: number; col: number } | null;
  editBuffer: string;
  // Render additional non-interactive blank columns for visual space
  extraCols?: number;

  isCellInSelection: (row: number, col: number) => boolean;
  onDataChange: (rowIndex: number, columnKey: keyof MasterDataRow, value: any) => void;

  onMouseDown: (e: MouseEvent, row: number, col: number) => void;
  onMouseEnter: (row: number, col: number) => void;
  onDoubleClick: (row: number, col: number) => void;

  onEditBufferChange: (value: string) => void;
  onCommitEdit: (move?: 'down' | 'right' | 'left' | 'up') => void;
  onCancelEdit: () => void;
}

export default function SpreadsheetGrid(props: SpreadsheetGridProps) {
  // Limit extra non-interactive columns to a maximum of 12
  const extraCols = Math.min(props.extraCols ?? 12, 12);
  return (
    <div className="relative">
      {/* headers */}
      <div className="flex sticky top-0 z-20">
        <div className="cell-header w-12 h-10 flex-shrink-0 sticky left-0 z-10" />
        {props.visibleColumns.map((c) => {
          const isGlobal = props.reusedColumnKeys?.has(c.key) ?? false;
          const isSpecific = props.sheetSpecificColumnKeys?.has(c.key) ?? false;
          return (
            <div
              key={c.key}
              className={`cell-header w-32 h-10 flex-shrink-0 font-semibold ${isSpecific && props.highlightSpecific ? 'sheet-specific-glow' : ''}`}
            >
              <div className="inline-flex items-center gap-1.5" title={isGlobal ? 'Global field' : undefined}>
                {isGlobal && <span className="global-indicator" aria-label="Global field" />}
                <span>{c.header}</span>
              </div>
            </div>
          );
        })}
        {/* Ghost headers for visual space */}
        {Array.from({ length: extraCols }).map((_, i) => (
          <div
            key={`ghost-h-${i}`}
            className="cell-header w-32 h-10 flex-shrink-0 font-normal text-gray-400 bg-gray-50"
          />
        ))}
      </div>

      <div className="flex">
        {/* Row numbers */}
        <div className="sticky left-0 z-10">
          {Array.from({ length: props.numRows }).map((_, i) => (
            <div key={i} className="cell-header w-12 h-10">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Cells */}
        <div className="flex-grow">
          {Array.from({ length: props.numRows }).map((_, r) => (
            <div key={r} className="flex">
              {props.visibleColumns.map((col, c) => {
                const key = col.key as keyof MasterDataRow;
                const isSpecific = props.sheetSpecificColumnKeys?.has(col.key) ?? false;
                return (
                  <Cell
                    key={`${r}-${c}`}
                    columnKey={key}
                    value={props.masterData[r]?.[key] ?? ''}
                    isSheetSpecific={isSpecific && !!props.highlightSpecific}
                    isActive={props.activeCell.row === r && props.activeCell.col === c}
                    isInSelection={props.isCellInSelection(r, c)}
                    isEditing={!!props.editingCell && props.editingCell.row === r && props.editingCell.col === c}
                    editBuffer={props.editBuffer}
                    onMouseDown={(e) => props.onMouseDown(e, r, c)}
                    onMouseEnter={() => props.onMouseEnter(r, c)}
                    onDoubleClick={() => props.onDoubleClick(r, c)}
                    onValueChange={(newValue) => props.onDataChange(r, key, newValue)}
                    onEditBufferChange={props.onEditBufferChange}
                    onCommit={props.onCommitEdit}
                    onCancel={props.onCancelEdit}
                  />
                );
              })}
              {/* Ghost cells for abundant space (non-interactive) */}
              {Array.from({ length: extraCols }).map((_, i) => (
                <div
                  key={`ghost-${r}-${i}`}
                  className="cell w-32 h-10 flex-shrink-0 p-1 overflow-hidden whitespace-nowrap bg-gray-50 text-transparent border-gray-200"
                >
                  .
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type CellProps = {
  columnKey: keyof MasterDataRow;
  value: MasterDataRow[keyof MasterDataRow];
  isActive: boolean;
  isInSelection: boolean;
  isEditing: boolean;
  editBuffer: string;
  isSheetSpecific?: boolean;

  onMouseDown: (e: MouseEvent) => void;
  onMouseEnter: () => void;
  onDoubleClick: () => void;

  onValueChange: (value: any) => void;
  onEditBufferChange: (value: string) => void;
  onCommit: (move?: 'down' | 'right' | 'left' | 'up') => void;
  onCancel: () => void;
};

function Cell({
  columnKey,
  value,
  isActive,
  isInSelection,
  isEditing,
  editBuffer,
  isSheetSpecific = false,
  onMouseDown,
  onMouseEnter,
  onDoubleClick,
  onValueChange,
  onEditBufferChange,
  onCommit,
  onCancel,
}: CellProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        onCommit('down');
        break;
      case 'Tab':
        e.preventDefault();
        onCommit(e.shiftKey ? 'left' : 'right');
        break;
      case 'Escape':
        e.preventDefault();
        onCancel();
        break;
    }
  };

  const classNames =
    `cell w-32 h-10 flex-shrink-0 p-1 overflow-hidden whitespace-nowrap
     bg-white text-black flex items-center justify-start
     ${isInSelection ? 'in-selection' : ''} ${isActive ? 'selected' : ''} ${isSheetSpecific ? 'sheet-specific-glow' : ''}`;

  // Checkbox column
  if (columnKey === 'isOutsourced') {
    return (
      <div
        className={`${classNames} justify-center relative`}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onDoubleClick={(e) => e.preventDefault()}
      >
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onValueChange(e.target.checked)}
          className="w-4 h-4 accent-blue-600 cursor-pointer"
          onMouseDown={(e) => e.stopPropagation()}
        />
        {isActive && (
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 border border-white cursor-crosshair z-20" />
        )}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className={`${classNames} p-0 relative`} onMouseDown={onMouseDown}>
        <input
          ref={inputRef}
          type="text"
          value={editBuffer}
          onChange={(e) => onEditBufferChange(e.target.value)}
          onBlur={() => onCommit()}
          onKeyDown={handleInputKeyDown}
          className="w-full h-full outline-none border-none p-1 bg-transparent"
        />
        {isActive && (
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 border border-white cursor-crosshair z-20" />
        )}
      </div>
    );
  }

  const renderContent = () => {
    if (typeof value === 'string') {
      const v = value.trim();
      const isImg =
        v.startsWith('data:image') ||
        v.startsWith('blob:') ||
        v.startsWith('/uploads/') ||
        v.startsWith('http://') ||
        v.startsWith('https://');
      if (isImg) {
        return <img src={v} alt="image" className="w-full h-full object-contain" />;
      }
    }
    return String(value ?? '');
  };

  return (
    <div
      className={`${classNames} relative`}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onDoubleClick={onDoubleClick}
    >
      {renderContent()}
      {isActive && (
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 border border-white cursor-crosshair z-20" />
      )}
    </div>
  );
}
