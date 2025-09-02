import { NextRequest } from 'next/server';
import { createSheet, listSheets, searchSheets, getSheet, type SheetData } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  const base = q ? searchSheets(q, 20) : listSheets(50);
  // Project minimal metadata needed for dashboard: 客户名称 (customerName), 交期 (dueDate), 进度阶段 (currentStage)
  const items = base.map((row) => {
    let customerName = '';
    let dueDate = '';
    let currentStage: string | undefined = undefined;
    try {
      const full = getSheet(row.id);
      if (full) {
        const comp = full.data?.comprehensiveData as
          | { customerName?: string; dueDate?: string }
          | undefined;
        const ship = full.data?.shippingData as { customerName?: string; deliveryDate?: string } | undefined;
        customerName = comp?.customerName || ship?.customerName || '';
        // Prefer comprehensive dueDate, fallback to shipping deliveryDate
        dueDate = comp?.dueDate || ship?.deliveryDate || '';
        const cs = full.data?.currentStage;
        currentStage = typeof cs === 'string' ? cs : undefined;
      }
    } catch {}
    return { ...row, customerName, dueDate, currentStage };
  });
  return Response.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const incoming = typeof body?.title === 'string' ? body.title.trim() : '';
  const title = incoming || '未命名';
  const data = body?.data ? (body.data as SheetData) : undefined;
  const created = createSheet(title, data);
  return Response.json({ sheet: created }, { status: 201 });
}
