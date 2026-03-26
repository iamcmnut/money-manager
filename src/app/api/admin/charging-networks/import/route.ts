import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { chargingNetworks } from '@/lib/db/schema';
import * as XLSX from 'xlsx';

interface ImportRow {
  name?: string;
  slug?: string;
  website?: string;
  phone?: string;
  brandColor?: string;
  brand_color?: string;
  color?: string;
  logo?: string;
  referralCode?: string;
  referral_code?: string;
  referralCaptionEn?: string;
  referral_caption_en?: string;
  captionEn?: string;
  referralCaptionTh?: string;
  referral_caption_th?: string;
  captionTh?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = await getDatabase();

  if (!db) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  try {
    let formData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: 'Failed to parse form data' }, { status: 400 });
    }

    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();

    let workbook;
    try {
      workbook = XLSX.read(arrayBuffer, { type: 'array' });
    } catch {
      return NextResponse.json({ error: 'Failed to parse Excel file' }, { status: 400 });
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<ImportRow>(worksheet);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No data found in file' }, { status: 400 });
    }

    const MAX_ROWS = 200;
    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `Too many rows (${rows.length}). Maximum is ${MAX_ROWS} rows per import.` },
        { status: 400 }
      );
    }

    const importedNetworks: (typeof chargingNetworks.$inferInsert)[] = [];
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        const name = row.name?.toString().trim();
        if (!name) {
          errors.push({ row: rowNum, error: 'Missing name' });
          continue;
        }

        const slug = row.slug?.toString().trim() || slugify(name);
        if (!slug) {
          errors.push({ row: rowNum, error: 'Missing slug' });
          continue;
        }

        const brandColor = row.brandColor || row.brand_color || row.color || null;
        const referralCode = row.referralCode || row.referral_code || null;
        const referralCaptionEn = row.referralCaptionEn || row.referral_caption_en || row.captionEn || null;
        const referralCaptionTh = row.referralCaptionTh || row.referral_caption_th || row.captionTh || null;

        const now = new Date();

        importedNetworks.push({
          id: slug,
          name,
          slug,
          logo: row.logo?.toString().trim() || null,
          website: row.website?.toString().trim() || null,
          phone: row.phone?.toString().trim() || null,
          brandColor: brandColor?.toString().trim() || null,
          referralCode: referralCode?.toString().trim() || null,
          referralCaptionEn: referralCaptionEn?.toString().trim() || null,
          referralCaptionTh: referralCaptionTh?.toString().trim() || null,
          createdAt: now,
          updatedAt: now,
        });
      } catch {
        errors.push({ row: rowNum, error: 'Processing error' });
      }
    }

    let insertedCount = 0;

    for (const network of importedNetworks) {
      try {
        await db.insert(chargingNetworks).values(network);
        insertedCount++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown';
        if (msg.includes('UNIQUE constraint')) {
          errors.push({ row: 0, error: `Duplicate slug: ${network.slug}` });
        } else {
          errors.push({ row: 0, error: `Failed to insert "${network.name}": ${msg}` });
        }
      }
    }

    if (insertedCount === 0 && importedNetworks.length > 0) {
      return NextResponse.json(
        { error: 'Failed to insert any networks', errors: errors.slice(0, 10) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imported: insertedCount,
      total: rows.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      hasMoreErrors: errors.length > 10,
    });
  } catch (error) {
    console.error('Failed to import charging networks:', error);
    return NextResponse.json({ error: 'Failed to import networks' }, { status: 500 });
  }
}
