import { and, desc, eq } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './db/schema';
import { legalDocuments, userConsents } from './db/schema';

export type DB = DrizzleD1Database<typeof schema>;
export type DocumentType = 'terms' | 'privacy';
export type Locale = 'en' | 'th';

export const REQUIRED_DOCUMENT_TYPES: readonly DocumentType[] = ['terms', 'privacy'];

export interface ActiveDocument {
  id: string;
  version: number;
  content: string;
  effectiveAt: Date | null;
}

export async function getActiveDocumentVersion(
  db: DB,
  type: DocumentType,
  locale: Locale,
): Promise<ActiveDocument | null> {
  const rows = await db
    .select({
      id: legalDocuments.id,
      version: legalDocuments.version,
      content: legalDocuments.content,
      effectiveAt: legalDocuments.effectiveAt,
    })
    .from(legalDocuments)
    .where(and(eq(legalDocuments.type, type), eq(legalDocuments.locale, locale), eq(legalDocuments.isActive, true)))
    .orderBy(desc(legalDocuments.version))
    .limit(1);
  return rows[0] ?? null;
}

export interface ConsentStatus {
  type: DocumentType;
  acceptedVersion: number | null;
  currentVersion: number | null;
  mustAccept: boolean;
}

export async function getUserConsentStatus(
  db: DB,
  userId: string,
  type: DocumentType,
  locale: Locale = 'en',
): Promise<ConsentStatus> {
  const active = await getActiveDocumentVersion(db, type, locale);
  if (!active) {
    return { type, acceptedVersion: null, currentVersion: null, mustAccept: false };
  }

  const rows = await db
    .select({ version: userConsents.version })
    .from(userConsents)
    .where(and(eq(userConsents.userId, userId), eq(userConsents.documentType, type)))
    .orderBy(desc(userConsents.version))
    .limit(1);
  const accepted = rows[0]?.version ?? null;
  return {
    type,
    acceptedVersion: accepted,
    currentVersion: active.version,
    mustAccept: accepted === null || accepted < active.version,
  };
}

export class ConsentRequiredError extends Error {
  readonly missing: DocumentType[];
  constructor(missing: DocumentType[]) {
    super(`Consent required: ${missing.join(', ')}`);
    this.name = 'ConsentRequiredError';
    this.missing = missing;
  }
}

export async function requireCurrentConsents(
  db: DB,
  userId: string,
  locale: Locale = 'en',
): Promise<void> {
  const missing: DocumentType[] = [];
  for (const t of REQUIRED_DOCUMENT_TYPES) {
    const status = await getUserConsentStatus(db, userId, t, locale);
    if (status.mustAccept) missing.push(t);
  }
  if (missing.length > 0) throw new ConsentRequiredError(missing);
}
