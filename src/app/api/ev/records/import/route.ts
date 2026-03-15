import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { chargingRecords, chargingNetworks } from '@/lib/db/schema';
import * as XLSX from 'xlsx';

export const runtime = 'edge';

interface ImportRow {
  brand?: string;
  brandId?: string;
  network?: string;
  date?: string | number | Date;
  datetime?: string | number | Date;
  chargingDatetime?: string | number | Date;
  kwh?: number | string;
  chargedKwh?: number | string;
  energy?: number | string;
  cost?: number | string;
  costThb?: number | string;
  price?: number | string;
  mileage?: number | string;
  mileageKm?: number | string;
  km?: number | string;
  notes?: string;
  note?: string;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDatabase();

  if (!db) {
    return NextResponse.json({ error: 'Database not available' }, { status: 503 });
  }

  try {
    console.log('[Import] Starting import...');

    let formData;
    try {
      formData = await request.formData();
      console.log('[Import] Form data parsed');
    } catch (e) {
      console.error('[Import] Form data error:', e);
      return NextResponse.json({ error: `Failed to parse form data: ${e instanceof Error ? e.message : 'Unknown'}` }, { status: 400 });
    }

    const file = formData.get('file') as File;
    console.log('[Import] File:', file?.name, file?.size);

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read the Excel file
    let arrayBuffer;
    try {
      arrayBuffer = await file.arrayBuffer();
      console.log('[Import] Array buffer size:', arrayBuffer.byteLength);
    } catch (e) {
      console.error('[Import] File read error:', e);
      return NextResponse.json({ error: `Failed to read file: ${e instanceof Error ? e.message : 'Unknown'}` }, { status: 400 });
    }

    let workbook;
    try {
      console.log('[Import] Parsing Excel...');
      workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      console.log('[Import] Workbook sheets:', workbook.SheetNames);
    } catch (e) {
      console.error('[Import] Excel parse error:', e);
      return NextResponse.json({ error: `Failed to parse Excel file: ${e instanceof Error ? e.message : 'Unknown'}` }, { status: 400 });
    }

    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const rows = XLSX.utils.sheet_to_json<ImportRow>(worksheet);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No data found in file' }, { status: 400 });
    }

    // Fetch all networks for mapping
    const networks = await db.select().from(chargingNetworks);

    if (networks.length === 0) {
      return NextResponse.json({
        error: 'No charging networks found. Please seed the database first.'
      }, { status: 400 });
    }

    const networkMap = new Map<string, string>();
    networks.forEach((n) => {
      networkMap.set(n.name.toLowerCase(), n.id);
      networkMap.set(n.slug.toLowerCase(), n.id);
      networkMap.set(n.id.toLowerCase(), n.id);
    });

    const importedRecords: typeof chargingRecords.$inferInsert[] = [];
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row number (1-indexed + header)

      try {
        // Find brand/network
        const brandValue = row.brand || row.brandId || row.network || '';
        const brandId = networkMap.get(String(brandValue).toLowerCase());

        if (!brandId) {
          errors.push({ row: rowNum, error: `Unknown network: ${brandValue}` });
          continue;
        }

        // Parse date
        const dateValue = row.datetime || row.chargingDatetime || row.date;
        let chargingDatetime: Date;

        if (dateValue instanceof Date) {
          chargingDatetime = dateValue;
        } else if (typeof dateValue === 'number') {
          // Excel serial date
          chargingDatetime = new Date((dateValue - 25569) * 86400 * 1000);
        } else if (typeof dateValue === 'string') {
          chargingDatetime = new Date(dateValue);
        } else {
          errors.push({ row: rowNum, error: 'Missing or invalid date' });
          continue;
        }

        if (isNaN(chargingDatetime.getTime())) {
          errors.push({ row: rowNum, error: 'Invalid date format' });
          continue;
        }

        // Parse kWh
        const kwhValue = row.kwh || row.chargedKwh || row.energy;
        const chargedKwh = parseFloat(String(kwhValue));

        if (isNaN(chargedKwh) || chargedKwh <= 0) {
          errors.push({ row: rowNum, error: 'Invalid or missing kWh value' });
          continue;
        }

        // Parse cost
        const costValue = row.cost || row.costThb || row.price;
        const costThb = parseFloat(String(costValue));

        if (isNaN(costThb) || costThb < 0) {
          errors.push({ row: rowNum, error: 'Invalid or missing cost value' });
          continue;
        }

        // Parse mileage (optional)
        const mileageValue = row.mileage || row.mileageKm || row.km;
        let mileageKm: number | null = null;
        if (mileageValue !== undefined && mileageValue !== null && mileageValue !== '') {
          mileageKm = parseInt(String(mileageValue));
          if (isNaN(mileageKm)) mileageKm = null;
        }

        // Notes (optional)
        const notes = row.notes || row.note || null;

        // Store as integers (cents/satang)
        const chargedKwhCents = Math.round(chargedKwh * 100);
        const costThbSatang = Math.round(costThb * 100);
        const avgUnitPrice = chargedKwhCents > 0 ? Math.round(costThbSatang / chargedKwhCents * 100) : null;

        const id = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${i}`;
        const now = new Date();

        importedRecords.push({
          id,
          userId: session.user.id,
          brandId,
          chargingDatetime,
          chargedKwh: chargedKwhCents,
          costThb: costThbSatang,
          avgUnitPrice,
          mileageKm,
          notes: notes ? String(notes) : null,
          createdAt: now,
          updatedAt: now,
        });
      } catch (err) {
        errors.push({ row: rowNum, error: `Processing error: ${err instanceof Error ? err.message : 'Unknown'}` });
      }
    }

    // Insert valid records one by one (D1 doesn't support batch inserts well)
    let insertedCount = 0;
    const insertErrors: { index: number; error: string }[] = [];

    for (let i = 0; i < importedRecords.length; i++) {
      try {
        await db.insert(chargingRecords).values(importedRecords[i]);
        insertedCount++;
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'Unknown';
        console.error(`[Import] Failed to insert record ${i}:`, errorMsg);
        insertErrors.push({ index: i, error: errorMsg });
        // Continue with other records
      }
    }

    if (insertedCount === 0 && importedRecords.length > 0) {
      return NextResponse.json({
        error: `Failed to insert any records. First error: ${insertErrors[0]?.error || 'Unknown'}`,
        debug: { recordsParsed: importedRecords.length, insertErrors: insertErrors.slice(0, 5) }
      }, { status: 500 });
    }

    // Combine parse errors and insert errors
    const allErrors = [
      ...errors,
      ...insertErrors.map(e => ({ row: e.index + 2, error: `Insert failed: ${e.error}` }))
    ];

    return NextResponse.json({
      success: true,
      imported: insertedCount,
      total: rows.length,
      errors: allErrors.length > 0 ? allErrors.slice(0, 10) : undefined,
      hasMoreErrors: allErrors.length > 10,
    });
  } catch (error) {
    console.error('Failed to import charging records:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to import records: ${errorMessage}` }, { status: 500 });
  }
}
