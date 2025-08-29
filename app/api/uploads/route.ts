import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/bmp': '.bmp',
    'image/svg+xml': '.svg',
    'image/tiff': '.tiff',
    'image/heic': '.heic',
    'image/heif': '.heif',
    'application/octet-stream': '.bin'
  };
  return map[mime] || '.bin';
}

export async function POST(req: NextRequest) {
  const ct = req.headers.get('content-type') || 'application/octet-stream';
  if (!ct.startsWith('image/')) {
    return new Response('Unsupported content-type', { status: 415 });
  }

  const sheetId = (req.headers.get('x-sheet-id') || 'common').replace(/[^a-zA-Z0-9_-]/g, '');
  const bytes = await req.arrayBuffer();
  const buf = Buffer.from(bytes);
  if (buf.length === 0) return new Response('Empty body', { status: 400 });

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', sheetId);
  ensureDir(uploadsDir);
  const ext = extFromMime(ct);
  const fileName = `${randomUUID()}${ext}`;
  const destPath = path.join(uploadsDir, fileName);

  fs.writeFileSync(destPath, buf);

  // Public URL for the saved file
  const urlPath = `/uploads/${sheetId}/${fileName}`;
  return Response.json({ url: urlPath });
}

