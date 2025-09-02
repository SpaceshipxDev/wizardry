import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function contentTypeFromExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.bmp':
      return 'image/bmp';
    case '.svg':
    case '.svgz':
      return 'image/svg+xml';
    case '.tif':
    case '.tiff':
      return 'image/tiff';
    case '.heic':
      return 'image/heic';
    case '.heif':
      return 'image/heif';
    default:
      return 'application/octet-stream';
  }
}

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await ctx.params;
  if (!Array.isArray(segments) || segments.length === 0) {
    return new Response('Not found', { status: 404 });
  }

  // Prevent path traversal by resolving under the uploads root
  const uploadsRoot = path.join(process.cwd(), 'data', 'uploads');
  const abs = path.join(uploadsRoot, ...segments);
  if (!abs.startsWith(uploadsRoot)) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const stat = fs.statSync(abs);
    if (!stat.isFile()) return new Response('Not found', { status: 404 });
    const buf = fs.readFileSync(abs);
    const ct = contentTypeFromExt(path.extname(abs));
    return new Response(buf, {
      status: 200,
      headers: {
        'content-type': ct,
        // Cache long with immutable filenames
        'cache-control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

