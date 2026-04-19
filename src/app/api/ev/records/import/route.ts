import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { chargingRecords, chargingNetworks, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import * as XLSX from 'xlsx';

interface ImportRow {
  brand?: string;
  brandid?: string;
  network?: string;
  date?: string | number | Date;
  datetime?: string | number | Date;
  chargingdatetime?: string | number | Date;
  kwh?: number | string;
  chargedkwh?: number | string;
  energy?: number | string;
  cost?: number | string;
  'cost(thb)'?: number | string;
  costthb?: number | string;
  price?: number | string;
  power?: number | string;
  chargingpowerkw?: number | string;
  chargingpower?: number | string;
  finishtime?: string | number | Date;
  chargingfinishdatetime?: string | number | Date;
  endtime?: string | number | Date;
  mileage?: number | string;
  'mileage(km)'?: number | string;
  mileagekm?: number | string;
  km?: number | string;
  'avgprice(thb/kwh)'?: number | string;
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
      return NextResponse.json({ error: 'Failed to parse form data' }, { status: 400 });
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
      return NextResponse.json({ error: 'Failed to read file' }, { status: 400 });
    }

    let workbook;
    try {
      console.log('[Import] Parsing Excel...');
      workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      console.log('[Import] Workbook sheets:', workbook.SheetNames);
    } catch (e) {
      console.error('[Import] Excel parse error:', e);
      return NextResponse.json({ error: 'Failed to parse Excel file' }, { status: 400 });
    }

    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON with normalized headers (lowercase, no spaces)
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
    const rows: ImportRow[] = rawRows.map((raw) => {
      const normalized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(raw)) {
        normalized[key.toLowerCase().replace(/\s+/g, '').trim()] = value;
      }
      return normalized as unknown as ImportRow;
    });

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No data found in file' }, { status: 400 });
    }

    // Limit rows to prevent CPU timeout on Workers
    const MAX_ROWS = 200;
    if (rows.length > MAX_ROWS) {
      return NextResponse.json({ error: `Too many rows (${rows.length}). Maximum is ${MAX_ROWS} rows per import.` }, { status: 400 });
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

    // Determine approval status based on user role or pre-approval
    let approvalStatus: 'pending' | 'approved' = 'pending';
    if (session.user.role === 'admin') {
      approvalStatus = 'approved';
    } else {
      const userRecord = await db.select({ isPreApproved: users.isPreApproved }).from(users).where(eq(users.id, session.user.id)).limit(1);
      if (userRecord[0]?.isPreApproved) {
        approvalStatus = 'approved';
      }
    }

    const importedRecords: typeof chargingRecords.$inferInsert[] = [];
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row number (1-indexed + header)

      try {
        // Find brand/network
        const brandValue = row.brand || row.brandid || row.network || '';
        const brandId = networkMap.get(String(brandValue).toLowerCase());

        if (!brandId) {
          errors.push({ row: rowNum, error: `Unknown network: ${brandValue}` });
          continue;
        }

        // Parse date
        const dateValue = row.datetime || row.chargingdatetime || row.date;
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
        const kwhValue = row.kwh || row.chargedkwh || row.energy;
        const chargedKwh = parseFloat(String(kwhValue));

        if (isNaN(chargedKwh) || chargedKwh <= 0) {
          errors.push({ row: rowNum, error: 'Invalid or missing kWh value' });
          continue;
        }

        // Parse cost
        const costValue = row.cost || row['cost(thb)'] || row.costthb || row.price;
        const costThb = parseFloat(String(costValue));

        if (isNaN(costThb) || costThb < 0) {
          errors.push({ row: rowNum, error: 'Invalid or missing cost value' });
          continue;
        }

        // Parse mileage (optional)
        const mileageValue = row.mileage || row['mileage(km)'] || row.mileagekm || row.km;
        let mileageKm: number | null = null;
        if (mileageValue !== undefined && mileageValue !== null && mileageValue !== '') {
          mileageKm = parseInt(String(mileageValue));
          if (isNaN(mileageKm)) mileageKm = null;
        }

        // Parse charging power (optional)
        const powerValue = row.power || row.chargingpowerkw || row.chargingpower;
        let chargingPowerKw: number | null = null;
        if (powerValue !== undefined && powerValue !== null && powerValue !== '') {
          chargingPowerKw = parseFloat(String(powerValue));
          if (isNaN(chargingPowerKw)) chargingPowerKw = null;
        }

        // Parse charging finish time (optional)
        const finishValue = row.finishtime || row.chargingfinishdatetime || row.endtime;
        let chargingFinishDatetime: Date | null = null;
        if (finishValue !== undefined && finishValue !== null && finishValue !== '') {
          if (finishValue instanceof Date) {
            chargingFinishDatetime = finishValue;
          } else if (typeof finishValue === 'number') {
            chargingFinishDatetime = new Date((finishValue - 25569) * 86400 * 1000);
          } else if (typeof finishValue === 'string') {
            const parsed = new Date(finishValue);
            if (!isNaN(parsed.getTime())) chargingFinishDatetime = parsed;
          }
        }

        // Notes (optional)
        const notes = row.notes || row.note || null;

        const avgUnitPrice = chargedKwh > 0 ? costThb / chargedKwh : null;

        const id = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${i}`;
        const now = new Date();

        importedRecords.push({
          id,
          userId: session.user.id,
          brandId,
          chargingDatetime,
          chargedKwh,
          costThb,
          avgUnitPrice,
          chargingPowerKw: chargingPowerKw ?? null,
          chargingFinishDatetime,
          mileageKm,
          notes: notes ? String(notes) : null,
          approvalStatus,
          createdAt: now,
          updatedAt: now,
        });
      } catch {
        errors.push({ row: rowNum, error: 'Processing error' });
      }
    }

    // Insert records in batches to reduce CPU time
    const BATCH_SIZE = 50;
    let insertedCount = 0;
    const insertErrors: { index: number; error: string }[] = [];

    for (let batchStart = 0; batchStart < importedRecords.length; batchStart += BATCH_SIZE) {
      const batch = importedRecords.slice(batchStart, batchStart + BATCH_SIZE);
      try {
        await db.insert(chargingRecords).values(batch);
        insertedCount += batch.length;
      } catch {
        // If batch fails, fall back to one-by-one for this batch
        for (let i = 0; i < batch.length; i++) {
          try {
            await db.insert(chargingRecords).values(batch[i]);
            insertedCount++;
          } catch (innerErr) {
            const errorMsg = innerErr instanceof Error ? innerErr.message : 'Unknown';
            console.error(`[Import] Failed to insert record ${batchStart + i}:`, errorMsg);
            insertErrors.push({ index: batchStart + i, error: errorMsg });
          }
        }
      }
    }

    if (insertedCount === 0 && importedRecords.length > 0) {
      return NextResponse.json({
        error: 'Failed to insert any records',
      }, { status: 500 });
    }

    // Combine parse errors and insert errors
    const allErrors = [
      ...errors,
      ...insertErrors.map(e => ({ row: e.index + 2, error: 'Insert failed' }))
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
    return NextResponse.json({ error: 'Failed to import records' }, { status: 500 });
  }
}
