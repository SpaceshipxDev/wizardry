import { NextRequest } from 'next/server';
import { createSheet, listSheets, searchSheets, type SheetData } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  const items = q ? searchSheets(q, 20) : listSheets(50);
  return Response.json({ items });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const incoming = typeof body?.title === 'string' ? body.title.trim() : '';
  const title = incoming || 'Untitled';
  const data = body?.data ? (body.data as SheetData) : undefined;
  const created = createSheet(title, data);
  return Response.json({ sheet: created }, { status: 201 });
}
