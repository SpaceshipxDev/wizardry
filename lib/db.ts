import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

export type SheetData = {
  activeSheet: '综合' | '外协' | '出货';
  masterData: any[]; // Grid rows
  comprehensiveData: { salesOrderNumber: string; customerName: string; contactPerson: string; dueDate: string };
  outsourcingData: {
    counterpartName: string; // 对方名称
    counterpartContact: string; // 对方联系人
    outsourceOrderNumber: string; // 外协单号
    dispatchDate: string; // 寄出时间
    returnDate: string; // 寄回时间
    orderAmount: string; // 订单金额
    ourCompany: string; // 我方
    ourAddress: string; // 我方收件地址
    ourContact: string; // 我方联系人
    remarks: string; // 备注
  };
  shippingData: {
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
};

export type SheetRow = {
  id: string;
  title: string;
  data: SheetData;
  created_at: string;
  updated_at: string;
};

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'sheetx.sqlite');

function ensureDb(): Database.Database {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS sheets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sheets_updated_at ON sheets(updated_at DESC);
  `);
  return db;
}

export function createDefaultSheetData(): SheetData {
  const NUM_ROWS_TOTAL = 100;
  const blankRows = Array.from({ length: NUM_ROWS_TOTAL }, () => ({
    productImage: '',
    productNumber: '',
    productName: '',
    material: '',
    surfaceFinish: '',
    quantity: '',
    remarks: '',
    isOutsourced: false,
  }));
  return {
    activeSheet: '综合',
    masterData: blankRows,
    comprehensiveData: { salesOrderNumber: '', customerName: '', contactPerson: '', dueDate: '' },
    outsourcingData: {
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
    },
    shippingData: {
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
    },
  };
}

export function listSheets(limit = 50): Omit<SheetRow, 'data'>[] {
  const db = ensureDb();
  const stmt = db.prepare(`SELECT id, title, created_at, updated_at FROM sheets ORDER BY updated_at DESC LIMIT ?`);
  const rows = stmt.all(limit) as { id: string; title: string; created_at: string; updated_at: string }[];
  return rows;
}

export function searchSheets(query: string, limit = 20): Omit<SheetRow, 'data'>[] {
  const db = ensureDb();
  // Basic LIKE search on title, ordered by most recently updated
  const q = `%${query}%`;
  const stmt = db.prepare(
    `SELECT id, title, created_at, updated_at
     FROM sheets
     WHERE title LIKE ? COLLATE NOCASE
     ORDER BY updated_at DESC
     LIMIT ?`
  );
  const rows = stmt.all(q, limit) as { id: string; title: string; created_at: string; updated_at: string }[];
  return rows;
}

export function createSheet(title = 'Untitled', data?: SheetData): SheetRow {
  const db = ensureDb();
  const id = randomUUID();
  const now = new Date().toISOString();
  const payload = data ?? createDefaultSheetData();
  const stmt = db.prepare(`INSERT INTO sheets (id, title, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`);
  stmt.run(id, title, JSON.stringify(payload), now, now);
  return { id, title, data: payload, created_at: now, updated_at: now };
}

export function getSheet(id: string): SheetRow | null {
  const db = ensureDb();
  const row = db.prepare(`SELECT * FROM sheets WHERE id = ?`).get(id) as
    | { id: string; title: string; data: string; created_at: string; updated_at: string }
    | undefined;
  if (!row) return null;
  return { id: row.id, title: row.title, data: JSON.parse(row.data), created_at: row.created_at, updated_at: row.updated_at };
}

export function updateSheet(id: string, updates: { title?: string; data?: SheetData }): SheetRow | null {
  const existing = getSheet(id);
  if (!existing) return null;
  const db = ensureDb();
  const now = new Date().toISOString();
  const nextTitle = updates.title ?? existing.title;
  const nextData = updates.data ?? existing.data;
  db.prepare(`UPDATE sheets SET title = ?, data = ?, updated_at = ? WHERE id = ?`).run(
    nextTitle,
    JSON.stringify(nextData),
    now,
    id
  );
  return { id, title: nextTitle, data: nextData, created_at: existing.created_at, updated_at: now };
}
