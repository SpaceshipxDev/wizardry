"use client";

import {
  useState, useRef, useEffect,
  KeyboardEvent, ClipboardEvent, MouseEvent
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Printer } from 'lucide-react';
import SpreadsheetGrid from '@/components/spreadsheet/Grid';
import { MasterDataRow, CellAddress } from '@/components/spreadsheet/types';
import Header from '@/components/sheets/Header';
import MetadataPanel from '@/components/sheets/MetadataPanel';
import FormulaBar from '@/components/sheets/FormulaBar';
import Footer from '@/components/sheets/Footer';

// --- Stages ---
type InternalStage =
  | '待生产'
  | '分析'
  | '编程'
  | '操机'
  | '手工'
  | '表面处理'
  | '检验'
  | '已出货';

const STAGES: InternalStage[] = ['待生产', '分析', '编程', '操机', '手工', '表面处理', '检验', '已出货'];

// Comments remain simple strings; stage is tracked separately

// --- Sheet configuration ---
const sheetConfiguration = {
  '综合': {
    columns: [
      { key: 'productImage', header: '产品图片' }, { key: 'productNumber', header: '产品编号' }, { key: 'productName', header: '产品名称' },
      { key: 'material', header: '材质' }, { key: 'surfaceFinish', header: '表面处理' },
      { key: 'quantity', header: '数量' }, { key: 'remarks', header: '备注' },
    ]
  },
  '报价': {
    columns: [
      { key: 'productImage', header: '产品图片' }, { key: 'productNumber', header: '产品编号' }, { key: 'productName', header: '产品名称' },
      { key: 'material', header: '材质' }, { key: 'surfaceFinish', header: '表面处理' },
      { key: 'quantity', header: '数量' }, { key: 'unitPrice', header: '单价' }, { key: 'totalPrice', header: '总价' },
      { key: 'remarks', header: '备注' },
    ]
  },
  '生产': {
    columns: [
      { key: 'productImage', header: '产品图片' }, { key: 'productNumber', header: '产品编号' }, { key: 'productName', header: '产品名称' },
      { key: 'material', header: '材质' }, { key: 'surfaceFinish', header: '表面处理' },
      { key: 'processingMethod', header: '加工方式' }, { key: 'processRequirements', header: '工艺要求' },
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

// Derive which column keys are reused across multiple sheets ("global" fields)
const REUSED_COLUMN_KEYS: Set<string> = (() => {
  const counts: Record<string, number> = {};
  (Object.keys(sheetConfiguration) as SheetName[]).forEach((name) => {
    const cols = sheetConfiguration[name].columns;
    cols.forEach((c) => { counts[c.key] = (counts[c.key] ?? 0) + 1; });
  });
  return new Set(Object.keys(counts).filter((k) => counts[k] > 1));
})();

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
  productImage: '',
  productNumber: '',
  productName: '',
  material: '',
  surfaceFinish: '',
  quantity: '',
  remarks: '',
  // Quotation
  unitPrice: '',
  totalPrice: '',
  // Production
  processingMethod: '',
  processRequirements: '',
  // Outsourcing
  isOutsourced: false,
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
  const [highlightSpecific, setHighlightSpecific] = useState<boolean>(false);

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

  // --- Comment + Stage State ---
  const [comments, setComments] = useState<string[]>([]);
  const [currentStage, setCurrentStage] = useState<InternalStage | null>(null);
  const [isCommentPopupVisible, setIsCommentPopupVisible] = useState(false);
  const [showStagePicker, setShowStagePicker] = useState(false);
  // Stage selection inside popup (only commit on Comment)
  const [pendingStage, setPendingStage] = useState<InternalStage | null>(null);

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
        setTitle('未命名');
        setActiveSheet('综合');
        setMasterData(makeBlankRows());
        setComprehensiveData({ salesOrderNumber: '', customerName: '', contactPerson: '', dueDate: '' });
        setOutsourcingData({
          counterpartName: '', counterpartContact: '', outsourceOrderNumber: '', dispatchDate: '', returnDate: '', orderAmount: '', ourCompany: '', ourAddress: '', ourContact: '', remarks: ''
        });
        setShippingData({
          customerName: '', customerContact: '', contactPhone: '', productionOrderNumber: '', contractNumber: '', deliveryDate: '', totalProductCount: '', ourCompany: '', ourContact: '', remarks: ''
        });
        setComments([]);
        setCurrentStage(null);
        setLoaded(true);
        return;
      }
      const res = await fetch(`/api/sheets/${sheetId}`, { cache: 'no-store' });
      if (!res.ok) { setLoaded(true); return; }
      const data = await res.json();
      if (cancelled) return;
      const sheet = data.sheet;
      const s = sheet?.data ?? {};
      setTitle(sheet?.title || '未命名');
      setActiveSheet(s.activeSheet ?? '综合');
      setMasterData(Array.isArray(s.masterData) ? s.masterData : makeBlankRows());
      setComprehensiveData(s.comprehensiveData ?? { salesOrderNumber: '', customerName: '', contactPerson: '', dueDate: '' });
      setOutsourcingData(s.outsourcingData ?? {
        counterpartName: '', counterpartContact: '', outsourceOrderNumber: '', dispatchDate: '', returnDate: '', orderAmount: '', ourCompany: '', ourAddress: '', ourContact: '', remarks: ''
      });
      setShippingData(s.shippingData ?? {
        customerName: '', customerContact: '', contactPhone: '', productionOrderNumber: '', contractNumber: '', deliveryDate: '', totalProductCount: '', ourCompany: '', ourContact: '', remarks: ''
      });
      // Normalize comments to plain strings to avoid rendering objects
      const normalizedComments: string[] = Array.isArray(s.comments)
        ? (s.comments as any[]).map((v) => {
            if (typeof v === 'string') return v;
            if (v && typeof (v as any).text === 'string') return String((v as any).text);
            try { return String(v); } catch { return ''; }
          }).filter((v) => typeof v === 'string')
        : [];
      setComments(normalizedComments);

      // Ensure stage is a string (some old data may store objects like { kind, text })
      const incomingStage: any = (s as any).currentStage;
      const normalizedStage: InternalStage | null =
        typeof incomingStage === 'string'
          ? (incomingStage as InternalStage)
          : (incomingStage && typeof incomingStage.text === 'string'
              ? (incomingStage.text as InternalStage)
              : null);
      setCurrentStage(normalizedStage);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [sheetId]);

  const commitTitle = async () => {
    const next = title.trim() || '未命名';
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
          data: { activeSheet, masterData, comprehensiveData, outsourcingData, shippingData, comments, currentStage }
        })
      });
    }, 800);
    return () => clearTimeout(h);
  }, [sheetId, loaded, activeSheet, masterData, comprehensiveData, outsourcingData, shippingData, comments, currentStage]);

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
          title: (title || '').trim() || '未命名',
          data: { activeSheet, masterData, comprehensiveData, outsourcingData, shippingData, comments, currentStage }
        })
      });
      const data = await res.json().catch(() => ({} as any));
      const newId = data?.sheet?.id as string | undefined;
      if (newId) {
        setSheetId(newId);
        router.replace(`/sheets/${newId}`);
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
  
  const handleAddComment = (text: string) => {
    if (text.trim()) setComments(prev => [...prev, text.trim()]);
    setIsCommentPopupVisible(false);
    setShowStagePicker(false);
  };

  const handleSelectStage = (stage: string) => {
    // Do not commit yet; wait until user clicks Comment
    setPendingStage(stage as InternalStage);
  };

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

  // Robustly cancel dragging on pointer up, tab switch, or visibility changes
  useEffect(() => {
    const endDrag = () => setIsDragging(false);
    const onVisibility = () => { if (document.visibilityState !== 'visible') endDrag(); };

    window.addEventListener('mouseup', endDrag);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('blur', endDrag);
    window.addEventListener('pagehide', endDrag);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('blur', endDrag);
      window.removeEventListener('pagehide', endDrag);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  useEffect(() => { if (!editingCell) gridContainerRef.current?.focus(); }, [activeCell, editingCell]);
  useEffect(() => () => {
    masterData.forEach(row => {
      Object.values(row).forEach(value => {
        if (typeof value === 'string' && value.startsWith('blob:')) URL.revokeObjectURL(value);
      });
    });
  }, [masterData]);

  // After returning from print/dialog or tab switch, force a lightweight repaint
  // to avoid rare compositor glitches (seen on macOS/Chrome/Safari with many sticky cells)
  useEffect(() => {
    const forceRepaint = () => {
      if (document.visibilityState !== 'visible') return;
      const el = gridContainerRef.current;
      if (!el) return;
      const prevWill = el.style.willChange;
      const prevTransform = el.style.transform;
      try {
        el.style.willChange = 'transform';
        el.style.transform = 'translateZ(0)';
        // Force reflow
        void el.offsetHeight;
        requestAnimationFrame(() => {
          el.style.willChange = prevWill;
          el.style.transform = prevTransform;
        });
      } catch {}
    };
    window.addEventListener('focus', forceRepaint);
    document.addEventListener('visibilitychange', forceRepaint);
    return () => {
      window.removeEventListener('focus', forceRepaint);
      document.removeEventListener('visibilitychange', forceRepaint);
    };
  }, []);

  // Derive sheet-specific column keys each render based on active sheet
  const sheetSpecificKeys = new Set(visibleColumns.filter(c => !REUSED_COLUMN_KEYS.has(c.key)).map(c => c.key));

  // When active sheet changes, briefly highlight sheet-specific columns
  useEffect(() => {
    setHighlightSpecific(true);
    const t = setTimeout(() => setHighlightSpecific(false), 2000);
    return () => clearTimeout(t);
  }, [activeSheet]);

  return (
    <div
      className="relative flex flex-col h-screen bg-gray-100 text-sm outline-none"
      ref={gridContainerRef}
      tabIndex={0}
      onKeyDown={handleGridKeyDown}
      onPaste={handleGridPaste}
    >
      {!loaded && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white">
          <div className="h-12 w-12 rounded-full border-4 border-gray-200 border-t-[#1A73E8] animate-spin" />
        </div>
      )}
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
        comments={comments}
        currentStage={currentStage}
        isCommentPopupVisible={isCommentPopupVisible}
        onOpenCommentPopup={() => {
          setIsCommentPopupVisible(true);
          const shouldPick = currentStage === null;
          setShowStagePicker(shouldPick);
          setPendingStage(currentStage);
        }}
        onCloseCommentPopup={() => {
          // Cancel: revert any pending selection
          setIsCommentPopupVisible(false);
          setShowStagePicker(false);
          setPendingStage(currentStage);
        }}
        onAddComment={(text: string) => {
          // Commit stage if picker is shown and a selection exists
          if (showStagePicker && pendingStage) {
            setCurrentStage(pendingStage);
          }
          handleAddComment(text);
        }}
        onSelectStage={handleSelectStage}
        onEditStage={() => {
          setIsCommentPopupVisible(true);
          setShowStagePicker(true);
          setPendingStage(currentStage);
        }}
        showStagePicker={showStagePicker}
        stageValue={pendingStage}
        stageOptions={STAGES}
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

      <div className="flex-grow overflow-auto min-h-0" onMouseLeave={() => setIsDragging(false)}>
        <SpreadsheetGrid
          numRows={NUM_ROWS_TOTAL}
          visibleColumns={visibleColumns}
          reusedColumnKeys={REUSED_COLUMN_KEYS}
          sheetSpecificColumnKeys={sheetSpecificKeys}
          highlightSpecific={highlightSpecific}
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
          setActiveSheet(sheet as SheetName);
          setActiveCell({ row: 0, col: 0 });
          setSelectionArea({ start: { row: 0, col: 0 }, end: { row: 0, col: 0 } });
          if (editingCell) cancelEdit();
        }}
      />

      {(activeSheet === '外协' || activeSheet === '出货') && (
        <button
          onClick={() => {
            // Ensure we aren't in a drag/select state before opening print
            setIsDragging(false);
            const mode = activeSheet === '外协' ? 'outsourcing' : 'shipping';
            window.open(`/sheets/${sheetId}/print/${mode}`, '_blank');
          }}
          className="fixed bottom-4 right-4 rounded-full bg-white/90 p-3 shadow-lg border hover:bg-white"
          aria-label="打印"
        >
          <Printer className="h-5 w-5 text-black" />
        </button>
      )}
    </div>
  );
}

/** ================== UI bits moved to components/sheets/* ================== */
