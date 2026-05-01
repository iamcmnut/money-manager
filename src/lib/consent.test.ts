import { describe, it, expect, vi } from 'vitest';
import { ConsentRequiredError, requireCurrentConsents } from './consent';
import type { DB } from './consent';

interface DocRow {
  id: string;
  version: number;
  content: string;
  effectiveAt: Date | null;
}

interface ConsentRow {
  version: number;
}

function makeDb(opts: {
  active: Partial<Record<'terms_en' | 'privacy_en' | 'terms_th' | 'privacy_th', DocRow>>;
  accepted: Partial<Record<'terms' | 'privacy', ConsentRow>>;
}): DB {
  let queryNumber = 0;
  // Two queries per requireCurrentConsents call per type:
  //   1) getActiveDocumentVersion(type, locale) → legalDocuments
  //   2) getUserConsentStatus accepted version → userConsents
  // Order: terms doc, terms consent, privacy doc, privacy consent
  const responses: unknown[] = [
    opts.active.terms_en ? [opts.active.terms_en] : [],
    opts.accepted.terms ? [opts.accepted.terms] : [],
    opts.active.privacy_en ? [opts.active.privacy_en] : [],
    opts.accepted.privacy ? [opts.accepted.privacy] : [],
  ];

  const stub = {
    select: vi.fn(() => stub),
    from: vi.fn(() => stub),
    where: vi.fn(() => stub),
    orderBy: vi.fn(() => stub),
    limit: vi.fn(() => Promise.resolve(responses[queryNumber++] ?? [])),
  };
  return stub as unknown as DB;
}

describe('requireCurrentConsents', () => {
  it('passes when both docs are accepted at current version', async () => {
    const db = makeDb({
      active: {
        terms_en: { id: 'd1', version: 1, content: '', effectiveAt: null },
        privacy_en: { id: 'd2', version: 1, content: '', effectiveAt: null },
      },
      accepted: { terms: { version: 1 }, privacy: { version: 1 } },
    });
    await expect(requireCurrentConsents(db, 'user-1')).resolves.toBeUndefined();
  });

  it('throws when neither doc is accepted', async () => {
    const db = makeDb({
      active: {
        terms_en: { id: 'd1', version: 1, content: '', effectiveAt: null },
        privacy_en: { id: 'd2', version: 1, content: '', effectiveAt: null },
      },
      accepted: {},
    });
    await expect(requireCurrentConsents(db, 'user-1')).rejects.toBeInstanceOf(ConsentRequiredError);
    try {
      await requireCurrentConsents(db, 'user-1');
    } catch (e) {
      expect((e as ConsentRequiredError).missing.sort()).toEqual(['privacy', 'terms']);
    }
  });

  it('throws when user accepted an older version', async () => {
    const db = makeDb({
      active: {
        terms_en: { id: 'd1', version: 2, content: '', effectiveAt: null },
        privacy_en: { id: 'd2', version: 1, content: '', effectiveAt: null },
      },
      accepted: { terms: { version: 1 }, privacy: { version: 1 } },
    });
    try {
      await requireCurrentConsents(db, 'user-1');
      expect.fail('should have thrown');
    } catch (e) {
      expect((e as ConsentRequiredError).missing).toEqual(['terms']);
    }
  });

  it('passes silently when no active doc exists for either type', async () => {
    const db = makeDb({ active: {}, accepted: {} });
    await expect(requireCurrentConsents(db, 'user-1')).resolves.toBeUndefined();
  });
});
