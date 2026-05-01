import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getR2 } from '@/lib/server/r2';
import { getR2PublicUrl } from '@/lib/cloudflare';

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const r2 = getR2();
  if (!r2) return NextResponse.json({ error: 'Storage not available' }, { status: 503 });

  const form = await request.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File size must be under 5MB' }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isWebp =
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50;
  // HEIC starts with 4-byte length then 'ftyp' at offset 4 and 'heic'/'heif'/'mif1' brand at 8
  const isHeic =
    bytes.length > 12 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70 &&
    ((bytes[8] === 0x68 && bytes[9] === 0x65 && (bytes[10] === 0x69 || bytes[10] === 0x76)) ||
      (bytes[8] === 0x6d && bytes[9] === 0x69 && bytes[10] === 0x66 && bytes[11] === 0x31));

  if (!isJpeg && !isPng && !isWebp && !isHeic) {
    return NextResponse.json({ error: 'Invalid image file' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || (isPng ? 'png' : isJpeg ? 'jpg' : isWebp ? 'webp' : 'heic');
  const safeExt = /^[a-z0-9]{2,5}$/.test(ext) ? ext : 'bin';
  const key = `charging-slips/${session.user.id}/${crypto.randomUUID()}.${safeExt}`;

  await r2.put(key, bytes.buffer as ArrayBuffer, { httpMetadata: { contentType: file.type } });

  const r2PublicUrl = await getR2PublicUrl();
  const url = r2PublicUrl ? `${r2PublicUrl}/${key}` : `/api/upload/${key}`;
  return NextResponse.json({ key, url });
}
