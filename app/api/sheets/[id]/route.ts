import { NextRequest } from 'next/server';
import { getSheet, updateSheet, type SheetData } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sheet = getSheet(id);
  if (!sheet) return new Response('Not found', { status: 404 });
  return Response.json({ sheet });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const updatePayload: { title?: string; data?: SheetData } = {};
  if (typeof body?.title === 'string') updatePayload.title = body.title;
  if (body?.data) updatePayload.data = body.data as SheetData;
  const updated = updateSheet(id, updatePayload);
  if (!updated) return new Response('Not found', { status: 404 });
  return Response.json({ sheet: updated });
}
