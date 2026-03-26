import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getR2 } from '@/lib/server/r2';
import { getR2PublicUrl } from '@/lib/cloudflare';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const r2 = getR2();
  if (!r2) {
    return NextResponse.json({ error: 'Storage not available' }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 10MB' }, { status: 400 });
    }

    // Validate magic bytes to prevent disguised file uploads
    const bytes = new Uint8Array(await file.arrayBuffer());
    const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    const isGif = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
    const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
      && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;

    if (!isJpeg && !isPng && !isGif && !isWebp) {
      return NextResponse.json({ error: 'Invalid image file' }, { status: 400 });
    }

    // Sanitize folder param — allow only alphanumeric and hyphens
    const sanitizedFolder = /^[a-zA-Z0-9-]+$/.test(folder) ? folder : 'uploads';

    const ext = file.name.split('.').pop() || 'png';
    const key = `${sanitizedFolder}/${crypto.randomUUID()}.${ext}`;

    await r2.put(key, bytes.buffer as ArrayBuffer, {
      httpMetadata: { contentType: file.type },
    });

    const r2PublicUrl = getR2PublicUrl();
    const url = r2PublicUrl ? `${r2PublicUrl}/${key}` : `/api/upload/${key}`;

    return NextResponse.json({ url, key });
  } catch (error) {
    console.error('Failed to upload file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
