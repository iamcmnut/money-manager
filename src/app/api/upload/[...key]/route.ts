import { NextResponse } from 'next/server';
import { getR2 } from '@/lib/server/r2';

interface RouteParams {
  params: Promise<{ key: string[] }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { key } = await params;
  const objectKey = key.join('/');

  const r2 = getR2();
  if (!r2) {
    return NextResponse.json({ error: 'Storage not available' }, { status: 503 });
  }

  try {
    const object = await r2.get(objectKey);

    if (!object) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Read full buffer — streaming responses cause issues with social media crawlers
    const arrayBuffer = await object.arrayBuffer();

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Content-Length': String(arrayBuffer.byteLength),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Failed to get file:', error);
    return NextResponse.json({ error: 'Failed to get file' }, { status: 500 });
  }
}
