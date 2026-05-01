import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/server';
import { carBrands, carModels } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';

export const revalidate = 300;

export async function GET() {
  const db = await getDatabase();
  if (!db) return NextResponse.json({ error: 'Database not available' }, { status: 503 });

  const rows = await db
    .select({
      brandId: carBrands.id,
      brandName: carBrands.name,
      brandSlug: carBrands.slug,
      brandLogo: carBrands.logo,
      modelId: carModels.id,
      modelName: carModels.name,
      modelYear: carModels.modelYear,
      batteryKwh: carModels.batteryKwh,
      isActive: carModels.isActive,
    })
    .from(carBrands)
    .leftJoin(carModels, eq(carModels.brandId, carBrands.id))
    .orderBy(asc(carBrands.name), asc(carModels.name));

  type Brand = {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    models: { id: string; name: string; modelYear: number | null; batteryKwh: number | null }[];
  };

  const byId = new Map<string, Brand>();
  for (const row of rows) {
    if (!byId.has(row.brandId)) {
      byId.set(row.brandId, {
        id: row.brandId,
        name: row.brandName,
        slug: row.brandSlug,
        logo: row.brandLogo,
        models: [],
      });
    }
    if (row.modelId && row.isActive) {
      byId.get(row.brandId)!.models.push({
        id: row.modelId,
        name: row.modelName!,
        modelYear: row.modelYear,
        batteryKwh: row.batteryKwh,
      });
    }
  }

  return NextResponse.json(
    { brands: Array.from(byId.values()) },
    { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } },
  );
}
