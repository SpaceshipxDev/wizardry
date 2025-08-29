"use client";

import {
  useState, useRef, useEffect,
  KeyboardEvent, ClipboardEvent, MouseEvent
} from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Plus, List, Star, Folder, Cloud, Lock, ChevronDown, Printer } from 'lucide-react';
import SpreadsheetGrid from '@/components/spreadsheet/Grid';
import SheetsIcon from '@/components/icons/SheetsIcon';
import { MasterDataRow, CellAddress } from '@/components/spreadsheet/types';

// --- Sheet configuration ---
const sheetConfiguration = {
  '综合': {
    columns: [
      { key: 'productImage', header: '产品图片' }, { key: 'productNumber', header: '产品编号' }, { key: 'productName', header: '产品名称' },
      { key: 'material', header: '材质' }, { key: 'surfaceFinish', header: '表面处理' },
      { key: 'quantity', header: '数量' }, { key: 'remarks', header: '备注' },
    ]
  },
  '外协': {
    columns: [
      { key: 'productImage', header: '产品图片' }, { key: 'productNumber', header: '产品编号' }, { key: 'productName', header: '产品名称' },
      { key: 'material', header: '材质' }, { key: 'surfaceFinish', header: '表面处理' },
      { key: 'quantity', header: '数量' }, { key: 'remarks', header: '备注' },
      { key: 'isOutsourced', header: '外协' },
    ]
  },
  '出货': {
    columns: [
      { key: 'productImage', header: '产品图片' }, { key: 'productNumber', header: '产品编号' }, { key: 'productName', header: '产品名称' },
      { key: 'material', header: '材质' }, { key: 'surfaceFinish', header: '表面处理' },
      { key: 'quantity', header: '数量' }, { key: 'remarks', header: '备注' },
    ]
  }
};
type SheetName = keyof typeof sheetConfiguration;

// --- Types for the metadata panel ---
type ComprehensiveData = { salesOrderNumber: string; customerName: string; contactPerson: string; dueDate: string };
type OutsourcingOrderData = {
  counterpartName: string; // 对方名称
  counterpartContact: string; // 对方联系人
  outsourceOrderNumber: string; // 外协单号
  dispatchDate: string; // 寄出时间
  returnDate: string; // 寄回时间（假设第二个“寄出时间”为“寄回时间”）
  orderAmount: string; // 订单金额
  ourCompany: string; // 我方
  ourAddress: string; // 我方收件地址
  ourContact: string; // 我方联系人
  remarks: string; // 备注
};
type ShippingOrderData = {
  customerName: string; // 客户名称
  customerContact: string; // 客户联系人
  contactPhone: string; // 联系方式
  productionOrderNumber: string; // 生产单号
  contractNumber: string; // 合同编号
  deliveryDate: string; // 送货日期
  totalProductCount: string; // 货品总数
  ourCompany: string; // 我方
  ourContact: string; // 我方联系人
  remarks: string; // 备注
};

// --- Helpers ---
const NUM_ROWS_TOTAL = 100;
const makeBlankRows = (): MasterDataRow[] => Array.from({ length: NUM_ROWS_TOTAL }, () => ({
  productImage: '', productNumber: '', productName: '', material: '', surfaceFinish: '', quantity: '', remarks: '', isOutsourced: false,
}));

export default function SheetEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [sheetId, setSheetId] = useState(params.id);

  // --- STATE ---
  const [title, setTitle] = useState<string>("");
  const [editingTitle, setEditingTitle] = useState<boolean>(false);
  const [loaded, setLoaded] = useState(false);
  const [masterData, setMasterData] = useState<MasterDataRow[]>(makeBlankRows());
  const [activeSheet, setActiveSheet] = useState<SheetName>('综合');

  // --- Metadata State ---
  const [comprehensiveData, setComprehensiveData] = useState<ComprehensiveData>({ salesOrderNumber: '', customerName: '', contactPerson: '', dueDate: '' });
  const [outsourcingData, setOutsourcingData] = useState<OutsourcingOrderData>({
    counterpartName: '',
    counterpartContact: '',
    outsourceOrderNumber: '',
    dispatchDate: '',
    returnDate: '',
    orderAmount: '',
    ourCompany: '',
    ourAddress: '',
    ourContact: '',
    remarks: '',
  });
  const [shippingData, setShippingData] = useState<ShippingOrderData>({
    customerName: '',
    customerContact: '',
    contactPhone: '',
    productionOrderNumber: '',
    contractNumber: '',
    deliveryDate: '',
    totalProductCount: '',
    ourCompany: '',
    ourContact: '',
    remarks: '',
  });

  // --- Grid State ---
  const [activeCell, setActiveCell] = useState<CellAddress>({ row: 0, col: 0 });
  const [selectionArea, setSelectionArea] = useState<{ start: CellAddress; end: CellAddress }>({
    start: { row: 0, col: 0 }, end: { row: 0, col: 0 }
  });
  const [editingCell, setEditingCell] = useState<CellAddress | null>(null);
  const [editBuffer, setEditBuffer] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // --- DERIVED ---
  const visibleColumns = sheetConfiguration[activeSheet].columns;
  const numCols = visibleColumns.length;
  const getCellId = (row: number, col: number) => `${String.fromCharCode(65 + col)}${row + 1}`;
  const activeColumnKey = visibleColumns[activeCell.col]?.key as keyof MasterDataRow;
  const selectedValue = masterData[activeCell.row]?.[activeColumnKey] ?? '';

  // --- Persistence ---
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (sheetId === 'new') {
        setTitle('Untitled');
        setActiveSheet('综合');
        setMasterData(makeBlankRows());
        setComprehensiveData({ salesOrderNumber: '', customerName: '', contactPerson: '', dueDate: '' });
        setOutsourcingData({
          counterpartName: '', counterpartContact: '', outsourceOrderNumber: '', dispatchDate: '', returnDate: '', orderAmount: '', ourCompany: '', ourAddress: '', ourContact: '', remarks: ''
        });
        setShippingData({
          customerName: '', customerContact: '', contactPhone: '', productionOrderNumber: '', contractNumber: '', deliveryDate: '', totalProductCount: '', ourCompany: '', ourContact: '', remarks: ''
        });
        setLoaded(true);
        return;
      }
      const res = await fetch(`/api/sheets/${sheetId}`, { cache: 'no-store' });
      if (!res.ok) { setLoaded(true); return; }
      const data = await res.json();
      if (cancelled) return;
      const sheet = data.sheet;
      const s = sheet?.data ?? {};
      setTitle(sheet?.title || 'Untitled');
      setActiveSheet(s.activeSheet ?? '综合');
      setMasterData(Array.isArray(s.masterData) ? s.masterData : makeBlankRows());
      setComprehensiveData(s.comprehensiveData ?? { salesOrderNumber: '', customerName: '', contactPerson: '', dueDate: '' });
      setOutsourcingData(s.outsourcingData ?? {
        counterpartName: '', counterpartContact: '', outsourceOrderNumber: '', dispatchDate: '', returnDate: '', orderAmount: '', ourCompany: '', ourAddress: '', ourContact: '', remarks: ''
      });
      setShippingData(s.shippingData ?? {
        customerName: '', customerContact: '', contactPhone: '', productionOrderNumber: '', contractNumber: '', deliveryDate: '', totalProductCount: '', ourCompany: '', ourContact: '', remarks: ''
      });
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [sheetId]);

  const commitTitle = async () => {
    const next = title.trim() || 'Untitled';
    setTitle(next);
    setEditingTitle(false);
    if (sheetId === 'new') return; // don't create sheet on title-only change
    await fetch(`/api/sheets/${sheetId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: next })
    });
  };

  useEffect(() => {
    if (!loaded || sheetId === 'new') return; // only autosave for existing sheets
    const h = setTimeout(() => {
      void fetch(`/api/sheets/${sheetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { activeSheet, masterData, comprehensiveData, outsourcingData, shippingData }
        })
      });
    }, 800);
    return () => clearTimeout(h);
  }, [sheetId, loaded, activeSheet, masterData, comprehensiveData, outsourcingData, shippingData]);

  // Create sheet on first meaningful cell input
  const creatingRef = useRef(false);
  const createIfDraft = async (): Promise<string> => {
    if (sheetId !== 'new' || creatingRef.current) return sheetId;
    creatingRef.current = true;
    try {
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: (title || '').trim() || 'Untitled',
          data: { activeSheet, masterData, comprehensiveData, outsourcingData, shippingData }
        })
      });
      const data = await res.json().catch(() => ({} as any));
      const newId = data?.sheet?.id as string | undefined;
      if (newId) {
        setSheetId(newId);
        router.replace(`/sheet/${newId}`);
        return newId;
      }
      return sheetId;
    } finally {
      creatingRef.current = false;
    }
  };

  // Detect any non-empty cell to trigger creation (avoids saving untouched drafts)
  useEffect(() => {
    if (!loaded || sheetId !== 'new') return;
    const hasAnyCell = masterData.some(row => {
      return Object.entries(row).some(([key, val]) => {
        if (key === 'isOutsourced') return Boolean(val);
        if (typeof val === 'string') return val.trim().length > 0;
        return Boolean(val);
      });
    });
    if (hasAnyCell) void createIfDraft();
  }, [loaded, sheetId, masterData]);

  // --- GRID helpers ---
  const isCellInSelection = (row: number, col: number) => {
    const startRow = Math.min(selectionArea.start.row, selectionArea.end.row);
    const endRow = Math.max(selectionArea.start.row, selectionArea.end.row);
    const startCol = Math.min(selectionArea.start.col, selectionArea.end.col);
    const endCol = Math.max(selectionArea.start.col, selectionArea.end.col);
    return row >= startRow && row <= endRow && col >= startCol && col <= endCol;
  };

  const updateMasterData = (rowIndex: number, columnKey: keyof MasterDataRow, value: any) => {
    setMasterData(prev => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], [columnKey]: value } as MasterDataRow;
      return next;
    });
  };

  const startEditing = (row: number, col: number, initialText?: string) => {
    setEditingCell({ row, col });
    const key = visibleColumns[col].key as keyof MasterDataRow;
    const existing = masterData[row]?.[key];
    const startValue = initialText ?? String(existing ?? '');
    setEditBuffer(startValue);
  };

  const commitEdit = (move?: 'down' | 'right' | 'left' | 'up') => {
    if (!editingCell) return;
    const { row, col } = editingCell;
    const columnKey = visibleColumns[col].key as keyof MasterDataRow;
    updateMasterData(row, columnKey, editBuffer);
    setEditingCell(null);
    setEditBuffer('');

    if (move) {
      let next = { row, col };
      if (move === 'down') next = { row: Math.min(NUM_ROWS_TOTAL - 1, row + 1), col };
      if (move === 'up') next = { row: Math.max(0, row - 1), col };
      if (move === 'right') next = { row, col: Math.min(numCols - 1, col + 1) };
      if (move === 'left') next = { row, col: Math.max(0, col - 1) };
      setActiveCell(next);
      setSelectionArea({ start: next, end: next });
    }
  };
  const cancelEdit = () => { setEditingCell(null); setEditBuffer(''); };

  // --- HANDLERS ---
  const handleMouseDown = (e: MouseEvent, row: number, col: number) => {
    e.preventDefault();
    if (editingCell && (editingCell.row !== row || editingCell.col !== col)) commitEdit();
    setActiveCell({ row, col });
    setSelectionArea({ start: { row, col }, end: { row, col } });
    setIsDragging(true);
    gridContainerRef.current?.focus();
  };

  const handleMouseEnter = (row: number, col: number) => { if (isDragging) setSelectionArea(prev => ({ ...prev, end: { row, col } })); };
  const handleDoubleClick = (row: number, col: number) => startEditing(row, col);

  const handleGridKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Ignore when focusing an input/textarea/contentEditable (e.g., title field, metadata fields)
    const t = e.target as HTMLElement | null;
    const tag = t?.tagName;
    if (
      tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t?.isContentEditable
    ) {
      return;
    }
    if (editingCell) return;
    let { row, col } = activeCell;
    let shouldUpdate = true;
    switch (e.key) {
      case 'ArrowUp': row = Math.max(0, row - 1); e.preventDefault(); break;
      case 'ArrowDown': row = Math.min(NUM_ROWS_TOTAL - 1, row + 1); e.preventDefault(); break;
      case 'ArrowLeft': col = Math.max(0, col - 1); e.preventDefault(); break;
      case 'ArrowRight': col = Math.min(numCols - 1, col + 1); e.preventDefault(); break;
      case 'Tab': e.preventDefault(); col = e.shiftKey ? Math.max(0, col - 1) : Math.min(numCols - 1, col + 1); break;
      case 'Enter': e.preventDefault(); startEditing(row, col); shouldUpdate = false; break;
      case 'F2': e.preventDefault(); startEditing(row, col); shouldUpdate = false; break;
      default:
        if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
          e.preventDefault(); startEditing(activeCell.row, activeCell.col, e.key); shouldUpdate = false;
        } else shouldUpdate = false;
        break;
    }
    if (shouldUpdate) {
      const nextCell = { row, col };
      setActiveCell(nextCell);
      setSelectionArea({ start: nextCell, end: nextCell });
    }
  };

  // Helper: downscale + convert to a web-friendly blob (client-side)
  const optimizeImageBlob = async (file: File): Promise<Blob> => {
    try {
      // Try decode via createImageBitmap first (fast, avoids DOM Image caching)
      const bitmap = await createImageBitmap(file).catch(async () => {
        // Fallback via <img> if createImageBitmap fails
        return await new Promise<ImageBitmap>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const src = img.src;
            createImageBitmap(img).then((bm) => {
              URL.revokeObjectURL(src);
              resolve(bm);
            }, (err) => {
              URL.revokeObjectURL(src);
              reject(err);
            });
          };
          img.onerror = reject;
          img.src = URL.createObjectURL(file);
        });
      });

      const maxDim = 1400; // cap longest edge for performance
      const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return file; // fallback
      ctx.drawImage(bitmap, 0, 0, w, h);

      // Prefer webp when available; fallback to jpeg
      const type = 'image/webp';
      const quality = 0.85;
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, type, quality));
      return (blob || file) as Blob;
    } catch {
      // If decoding fails (e.g., HEIC) just return original file; server will store as-is
      return file as Blob;
    }
  };

  const uploadImageBlob = async (blob: Blob, sid: string): Promise<string> => {
    const res = await fetch('/api/uploads', {
      method: 'POST',
      headers: {
        'content-type': blob.type || 'application/octet-stream',
        'x-sheet-id': sid,
      },
      body: blob,
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.url as string;
  };

  const handleGridPaste = async (e: ClipboardEvent<HTMLDivElement>) => {
    // Allow paste into inputs/textareas/contentEditable (e.g., title or metadata)
    const t = e.target as HTMLElement | null;
    const tag = t?.tagName;
    if (
      tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t?.isContentEditable
    ) {
      return;
    }
    e.preventDefault(); if (editingCell) return;
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find(item => item.type.startsWith('image/'));

    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        // Optimize client-side to reduce size, then upload and store URL (not base64)
        const optimized = await optimizeImageBlob(file);
        const sid = await createIfDraft();
        const url = await uploadImageBlob(optimized, sid);
        const { row, col } = activeCell;
        const columnKey = visibleColumns[col].key as keyof MasterDataRow;
        updateMasterData(row, columnKey, url);
      }
      return;
    }

    const text = e.clipboardData.getData('text/plain');
    const rows = text.split('\n').map(r => r.split('\t'));
    const { row: startRow, col: startCol } = activeCell;
    rows.forEach((pRow, rOff) => {
      const rIndex = startRow + rOff;
      if (rIndex < NUM_ROWS_TOTAL) {
        pRow.forEach((pCell, cOff) => {
          const cIndex = startCol + cOff;
          if (cIndex < numCols) {
            const columnKey = visibleColumns[cIndex].key as keyof MasterDataRow;
            updateMasterData(rIndex, columnKey, pCell);
          }
        });
      }
    });
  };

  useEffect(() => { const up = () => setIsDragging(false); window.addEventListener('mouseup', up); return () => window.removeEventListener('mouseup', up); }, []);
  useEffect(() => { if (!editingCell) gridContainerRef.current?.focus(); }, [activeCell, editingCell]);
  useEffect(() => () => {
    masterData.forEach(row => {
      Object.values(row).forEach(value => {
        if (typeof value === 'string' && value.startsWith('blob:')) URL.revokeObjectURL(value);
      });
    });
  }, [masterData]);

  // Loading screen to avoid visual glitching while fetching/initializing
  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-[#1A73E8] animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-screen bg-gray-100 text-sm outline-none"
      ref={gridContainerRef}
      tabIndex={0}
      onKeyDown={handleGridKeyDown}
      onPaste={handleGridPaste}
    >
      <Header
        title={title}
        editingTitle={editingTitle}
        setEditingTitle={setEditingTitle}
        onTitleChange={setTitle}
        onTitleCommit={commitTitle}
      />
      <MetadataPanel
        activeSheet={activeSheet}
        comprehensiveData={comprehensiveData}
        setComprehensiveData={setComprehensiveData}
        outsourcingData={outsourcingData}
        setOutsourcingData={setOutsourcingData}
        shippingData={shippingData}
        setShippingData={setShippingData}
      />

      <FormulaBar
        selectedCellId={getCellId(activeCell.row, activeCell.col)}
        value={editingCell ? editBuffer : String(selectedValue)}
        onValueChange={(newValue) => {
          if (editingCell) setEditBuffer(newValue);
          else updateMasterData(activeCell.row, activeColumnKey, newValue);
        }}
        onCommit={commitEdit}
      />

      <div className="flex-grow overflow-auto min-h-0">
        <SpreadsheetGrid
          numRows={NUM_ROWS_TOTAL}
          visibleColumns={visibleColumns}
          masterData={masterData}
          activeCell={activeCell}
          editingCell={editingCell}
          editBuffer={editBuffer}
          extraCols={12}
          isCellInSelection={isCellInSelection}
          onDataChange={updateMasterData}
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
          onDoubleClick={handleDoubleClick}
          onEditBufferChange={setEditBuffer}
          onCommitEdit={commitEdit}
          onCancelEdit={cancelEdit}
        />
      </div>

      <Footer
        sheets={Object.keys(sheetConfiguration) as SheetName[]}
        activeSheet={activeSheet}
        setActiveSheet={(sheet) => {
          setActiveSheet(sheet);
          setActiveCell({ row: 0, col: 0 });
          setSelectionArea({ start: { row: 0, col: 0 }, end: { row: 0, col: 0 } });
          if (editingCell) cancelEdit();
        }}
      />

      {(activeSheet === '外协' || activeSheet === '出货') && (
        <button
          onClick={() => {
            const mode = activeSheet === '外协' ? 'outsourcing' : 'shipping';
            window.open(`/sheet/${sheetId}/print/${mode}`, '_blank');
          }}
          className="fixed bottom-4 right-4 rounded-full bg-white/90 p-3 shadow-lg border hover:bg-white"
          aria-label="Print"
        >
          <Printer className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

/** ================== UI bits ================== */

const Header = ({
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
}) => (
  <header className="flex-shrink-0 bg-white p-2 border-b">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Link href="/" className="w-7 h-7 inline-flex items-center justify-center" title="Back to Dashboard">
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
                title="Rename"
              >
                {title || 'Untitled'}
              </button>
            )}
            <div className="flex items-center ml-2 text-gray-500">
              <Star size={16} className="p-1 hover:bg-gray-200 rounded-full" />
              <Folder size={16} className="p-1 hover:bg-gray-200 rounded-full" />
              <Cloud size={16} className="p-1 hover:bg-gray-200 rounded-full" />
            </div>
          </div>
          <div className="flex items-center text-xs gap-3 text-gray-600">
            <span>File</span><span>Edit</span><span>View</span><span>Insert</span>
            <span>Format</span><span>Data</span><span>Tools</span><span>Help</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="flex items-center bg-[#1a73e8] text-white px-4 py-1.5 rounded-md text-sm font-medium">
          <Lock size={16} className="mr-2" /> Share
        </button>
        <div className="w-8 h-8 bg-purple-600 text-white flex items-center justify-center rounded-full font-bold">A</div>
      </div>
    </div>
  </header>
);

const MetadataPanel = ({
  activeSheet, comprehensiveData, setComprehensiveData, outsourcingData, setOutsourcingData, shippingData, setShippingData
}: {
  activeSheet: SheetName;
  comprehensiveData: ComprehensiveData;
  setComprehensiveData: (d: ComprehensiveData) => void;
  outsourcingData: OutsourcingOrderData;
  setOutsourcingData: (d: OutsourcingOrderData) => void;
  shippingData: ShippingOrderData;
  setShippingData: (d: ShippingOrderData) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = activeSheet !== '综合';

  return (
    <div className="border-b">
      <div className="px-4 py-3 bg-gray-50/75 flex items-start gap-3">
        {hasDetails && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className={`mt-1 h-7 w-7 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition ${expanded ? 'rotate-180' : ''}`}
            title={expanded ? '收起详细' : '展开详细'}
          >
            <ChevronDown size={18} />
          </button>
        )}
        <div className="grid grid-cols-4 gap-x-6 gap-y-3 flex-1">
          <MetaField label="销售单号" value={comprehensiveData.salesOrderNumber} onChange={v => setComprehensiveData({ ...comprehensiveData, salesOrderNumber: v })} />
          <MetaField label="客户名称" value={comprehensiveData.customerName} onChange={v => setComprehensiveData({ ...comprehensiveData, customerName: v })} />
          <MetaField label="联系人" value={comprehensiveData.contactPerson} onChange={v => setComprehensiveData({ ...comprehensiveData, contactPerson: v })} />
          <MetaDateField label="交期" value={comprehensiveData.dueDate} onChange={v => setComprehensiveData({ ...comprehensiveData, dueDate: v })} />
        </div>
      </div>

      {hasDetails && expanded && (
        <div className="px-6 py-4 bg-white">
          {activeSheet === '外协' && (
            <div className="grid grid-cols-1 gap-y-3">
              <MetaField label="对方名称" value={outsourcingData.counterpartName} onChange={v => setOutsourcingData({ ...outsourcingData, counterpartName: v })} />
              <MetaField label="对方联系人" value={outsourcingData.counterpartContact} onChange={v => setOutsourcingData({ ...outsourcingData, counterpartContact: v })} />
              <MetaField label="外协单号" value={outsourcingData.outsourceOrderNumber} onChange={v => setOutsourcingData({ ...outsourcingData, outsourceOrderNumber: v })} />
              <MetaDateField label="寄出时间" value={outsourcingData.dispatchDate} onChange={v => setOutsourcingData({ ...outsourcingData, dispatchDate: v })} />
              <MetaDateField label="寄回时间" value={outsourcingData.returnDate} onChange={v => setOutsourcingData({ ...outsourcingData, returnDate: v })} />
              <MetaField label="订单金额" value={outsourcingData.orderAmount} onChange={v => setOutsourcingData({ ...outsourcingData, orderAmount: v })} />
              <MetaField label="我方" value={outsourcingData.ourCompany} onChange={v => setOutsourcingData({ ...outsourcingData, ourCompany: v })} />
              <MetaField label="我方收件地址" value={outsourcingData.ourAddress} onChange={v => setOutsourcingData({ ...outsourcingData, ourAddress: v })} />
              <MetaField label="我方联系人" value={outsourcingData.ourContact} onChange={v => setOutsourcingData({ ...outsourcingData, ourContact: v })} />
              <MetaField label="备注" value={outsourcingData.remarks} onChange={v => setOutsourcingData({ ...outsourcingData, remarks: v })} />
            </div>
          )}
          {activeSheet === '出货' && (
            <div className="grid grid-cols-1 gap-y-3">
              <MetaField label="客户名称" value={shippingData.customerName} onChange={v => setShippingData({ ...shippingData, customerName: v })} />
              <MetaField label="客户联系人" value={shippingData.customerContact} onChange={v => setShippingData({ ...shippingData, customerContact: v })} />
              <MetaField label="联系方式" value={shippingData.contactPhone} onChange={v => setShippingData({ ...shippingData, contactPhone: v })} />
              <MetaField label="生产单号" value={shippingData.productionOrderNumber} onChange={v => setShippingData({ ...shippingData, productionOrderNumber: v })} />
              <MetaField label="合同编号" value={shippingData.contractNumber} onChange={v => setShippingData({ ...shippingData, contractNumber: v })} />
              <MetaDateField label="送货日期" value={shippingData.deliveryDate} onChange={v => setShippingData({ ...shippingData, deliveryDate: v })} />
              <MetaField label="货品总数" value={shippingData.totalProductCount} onChange={v => setShippingData({ ...shippingData, totalProductCount: v })} />
              <MetaField label="我方" value={shippingData.ourCompany} onChange={v => setShippingData({ ...shippingData, ourCompany: v })} />
              <MetaField label="我方联系人" value={shippingData.ourContact} onChange={v => setShippingData({ ...shippingData, ourContact: v })} />
              <MetaField label="备注" value={shippingData.remarks} onChange={v => setShippingData({ ...shippingData, remarks: v })} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MetaField = ({ label, value, onChange, containerClassName = "" }: { label: string; value: string; onChange: (v: string) => void; containerClassName?: string }) => (
  <div className={`flex items-center gap-2 ${containerClassName}`}>
    <label className="text-xs font-medium text-gray-500 whitespace-nowrap">{label}:</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.stopPropagation()}
      className="w-full bg-transparent text-gray-900 text-sm p-1 rounded-md hover:bg-gray-200 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
    />
  </div>
);

const MetaDateField = ({ label, value, onChange, containerClassName = "" }: { label: string; value: string; onChange: (v: string) => void; containerClassName?: string }) => (
  <div className={`flex items-center gap-2 ${containerClassName}`}>
    <label className="text-xs font-medium text-gray-500 whitespace-nowrap">{label}:</label>
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.stopPropagation()}
      className="w-full bg-transparent text-gray-900 text-sm p-1 rounded-md hover:bg-gray-200 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
    />
  </div>
);

const FormulaBar = ({
  selectedCellId, value, onValueChange, onCommit
}: { selectedCellId: string, value: string, onValueChange: (newValue: string) => void, onCommit: () => void }) => (
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

const Footer = ({
  sheets, activeSheet, setActiveSheet
}: { sheets: SheetName[], activeSheet: SheetName, setActiveSheet: (s: SheetName) => void }) => (
  <footer className="flex-shrink-0 bg-white p-1.5 border-t flex items-center shadow-inner">
    <button className="p-1.5 rounded hover:bg-gray-200"><Plus size={20} /></button>
    <div className="h-5 w-px bg-gray-300 mx-1" />
    {sheets.map(name => (
      <button
        key={name}
        onClick={() => setActiveSheet(name)}
        className={`px-4 py-1.5 text-sm font-medium transition-colors ${
          activeSheet === name ? 'text-green-700 border-b-2 border-green-600' : 'text-gray-600 hover:bg-gray-200 rounded-md'
        }`}
      >
        {name}
      </button>
    ))}
    <div className="ml-auto">
      <button className="p-1.5 rounded hover:bg-gray-200"><List size={18} /></button>
    </div>
  </footer>
);
