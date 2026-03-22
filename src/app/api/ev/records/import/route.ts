import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getDatabase } from '@/lib/server';
import { chargingRecords, chargingNetworks } from '@/lib/db/schema';
import * as XLSX from 'xlsx';

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
  power?: number | string;
  chargingPowerKw?: number | string;
  chargingPower?: number | string;
  finishTime?: string | number | Date;
  chargingFinishDatetime?: string | number | Date;
  endTime?: string | number | Date;
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

    // Convert to JSON
    const rows = XLSX.utils.sheet_to_json<ImportRow>(worksheet);

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

        // Parse charging power (optional)
        const powerValue = row.power || row.chargingPowerKw || row.chargingPower;
        let chargingPowerKw: number | null = null;
        if (powerValue !== undefined && powerValue !== null && powerValue !== '') {
          chargingPowerKw = parseFloat(String(powerValue));
          if (isNaN(chargingPowerKw)) chargingPowerKw = null;
        }

        // Parse charging finish time (optional)
        const finishValue = row.finishTime || row.chargingFinishDatetime || row.endTime;
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
          createdAt: now,
          updatedAt: now,
        });
      } catch (err) {
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
      } catch (e) {
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
