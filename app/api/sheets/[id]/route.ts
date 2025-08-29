import { NextRequest } from 'next/server';
import { getSheet, updateSheet, type SheetData } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const sheet = getSheet(params.id);
  if (!sheet) return new Response('Not found', { status: 404 });
  return Response.json({ sheet });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const updatePayload: { title?: string; data?: SheetData } = {};
  if (typeof body?.title === 'string') updatePayload.title = body.title;
  if (body?.data) updatePayload.data = body.data as SheetData;
  const updated = updateSheet(params.id, updatePayload);
  if (!updated) return new Response('Not found', { status: 404 });
  return Response.json({ sheet: updated });
}
