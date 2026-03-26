import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';

// --- Mocks ---

const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

const mockGetDatabase = vi.fn();
vi.mock('@/lib/server', () => ({
  getDatabase: () => mockGetDatabase(),
}));

vi.mock('@/lib/db/schema', () => ({
  chargingNetworks: {
    id: 'id',
    name: 'name',
    slug: 'slug',
    logo: 'logo',
    website: 'website',
    phone: 'phone',
    brandColor: 'brand_color',
    referralCode: 'referral_code',
    referralCaptionEn: 'referral_caption_en',
    referralCaptionTh: 'referral_caption_th',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
}));

import { POST } from './route';

// --- Helpers ---

function createExcelBuffer(rows: Record<string, unknown>[]): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

function createMockFile(rows: Record<string, unknown>[]): File {
  const buffer = createExcelBuffer(rows);
  return {
    arrayBuffer: () => Promise.resolve(buffer),
    name: 'networks.xlsx',
    size: buffer.byteLength,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  } as unknown as File;
}

function createRequest(file: File | null): Request {
  const mockFormData = {
    get: vi.fn((key: string) => (key === 'file' ? file : null)),
  };

  return {
    url: 'http://localhost:3000/api/admin/charging-networks/import',
    method: 'POST',
    formData: () => Promise.resolve(mockFormData),
  } as unknown as Request;
}

function createFailingFormDataRequest(): Request {
  return {
    url: 'http://localhost:3000/api/admin/charging-networks/import',
    method: 'POST',
    formData: () => Promise.reject(new Error('Failed to parse')),
  } as unknown as Request;
}

function createMockDb(insertError?: Error) {
  return {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockImplementation(() => {
        if (insertError) {
          return Promise.reject(insertError);
        }
        return Promise.resolve();
      }),
    }),
  };
}

const adminSession = {
  user: { id: 'admin-1', email: 'admin@example.com', role: 'admin' },
};

const userSession = {
  user: { id: 'user-1', email: 'user@example.com', role: 'user' },
};

// --- Tests ---

describe('POST /api/admin/charging-networks/import', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);
      const file = createMockFile([{ name: 'Test' }]);
      const response = await POST(createRequest(file));
      expect(response.status).toBe(401);
    });

    it('should return 401 when session has no user', async () => {
      mockAuth.mockResolvedValue({});
      const file = createMockFile([{ name: 'Test' }]);
      const response = await POST(createRequest(file));
      expect(response.status).toBe(401);
    });

    it('should return 403 when user is not admin', async () => {
      mockAuth.mockResolvedValue(userSession);
      const file = createMockFile([{ name: 'Test' }]);
      const response = await POST(createRequest(file));
      expect(response.status).toBe(403);
    });
  });

  describe('Database availability', () => {
    it('should return 503 when database is not available', async () => {
      mockAuth.mockResolvedValue(adminSession);
      mockGetDatabase.mockResolvedValue(null);
      const file = createMockFile([{ name: 'Test' }]);
      const response = await POST(createRequest(file));
      expect(response.status).toBe(503);
    });
  });

  describe('File validation', () => {
    it('should return 400 when no file is provided', async () => {
      mockAuth.mockResolvedValue(adminSession);
      mockGetDatabase.mockResolvedValue(createMockDb());

      const response = await POST(createRequest(null));
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('No file provided');
    });

    it('should return 400 when form data parsing fails', async () => {
      mockAuth.mockResolvedValue(adminSession);
      mockGetDatabase.mockResolvedValue(createMockDb());

      const response = await POST(createFailingFormDataRequest());
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('Failed to parse form data');
    });

    it('should return 400 when file has no data rows', async () => {
      mockAuth.mockResolvedValue(adminSession);
      mockGetDatabase.mockResolvedValue(createMockDb());

      const file = createMockFile([]);
      const response = await POST(createRequest(file));
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toBe('No data found in file');
    });
  });

  describe('Successful import', () => {
    it('should import networks with name and auto-generate slug', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      const file = createMockFile([
        { name: 'EA Anywhere' },
        { name: 'PEA Volta' },
      ]);

      const response = await POST(createRequest(file));
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.imported).toBe(2);
      expect(body.total).toBe(2);
    });

    it('should use provided slug instead of generating one', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      const file = createMockFile([
        { name: 'EA Anywhere', slug: 'ea-custom' },
      ]);

      const response = await POST(createRequest(file));
      expect(response.status).toBe(200);

      const insertCall = db.insert.mock.results[0].value.values;
      const valuesArg = insertCall.mock.calls[0][0];
      expect(valuesArg.slug).toBe('ea-custom');
      expect(valuesArg.id).toBe('ea-custom');
    });

    it('should import all optional fields', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      const file = createMockFile([
        {
          name: 'EA Anywhere',
          slug: 'ea',
          website: 'https://ea.co.th',
          phone: '1234',
          brandColor: '#00AA00',
          logo: 'https://example.com/logo.png',
          referralCode: 'REF123',
          referralCaptionEn: 'Get 300 THB free',
          referralCaptionTh: 'รับฟรี 300 บาท',
        },
      ]);

      const response = await POST(createRequest(file));
      expect(response.status).toBe(200);

      const insertCall = db.insert.mock.results[0].value.values;
      const valuesArg = insertCall.mock.calls[0][0];
      expect(valuesArg.name).toBe('EA Anywhere');
      expect(valuesArg.website).toBe('https://ea.co.th');
      expect(valuesArg.phone).toBe('1234');
      expect(valuesArg.brandColor).toBe('#00AA00');
      expect(valuesArg.logo).toBe('https://example.com/logo.png');
      expect(valuesArg.referralCode).toBe('REF123');
      expect(valuesArg.referralCaptionEn).toBe('Get 300 THB free');
      expect(valuesArg.referralCaptionTh).toBe('รับฟรี 300 บาท');
    });

    it('should accept snake_case column names', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      const file = createMockFile([
        {
          name: 'Test Network',
          brand_color: '#FF0000',
          referral_code: 'CODE1',
          referral_caption_en: 'English caption',
          referral_caption_th: 'คำอธิบายภาษาไทย',
        },
      ]);

      const response = await POST(createRequest(file));
      expect(response.status).toBe(200);

      const insertCall = db.insert.mock.results[0].value.values;
      const valuesArg = insertCall.mock.calls[0][0];
      expect(valuesArg.brandColor).toBe('#FF0000');
      expect(valuesArg.referralCode).toBe('CODE1');
      expect(valuesArg.referralCaptionEn).toBe('English caption');
      expect(valuesArg.referralCaptionTh).toBe('คำอธิบายภาษาไทย');
    });
  });

  describe('Row validation', () => {
    it('should skip rows with missing name and report errors', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      const file = createMockFile([
        { name: 'Valid Network' },
        { slug: 'no-name' },
      ]);

      const response = await POST(createRequest(file));
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.imported).toBe(1);
      expect(body.total).toBe(2);
      expect(body.errors).toBeDefined();
      expect(body.errors.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Database error handling', () => {
    it('should handle duplicate slug errors gracefully', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockRejectedValue(new Error('UNIQUE constraint failed')),
        }),
      };
      mockGetDatabase.mockResolvedValue(db);

      const file = createMockFile([
        { name: 'Duplicate Network', slug: 'dup' },
      ]);

      const response = await POST(createRequest(file));
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Failed to insert any networks');
      expect(body.errors).toBeDefined();
      expect(body.errors[0].error).toContain('Duplicate slug');
    });

    it('should continue importing other rows when one fails', async () => {
      mockAuth.mockResolvedValue(adminSession);
      let callCount = 0;
      const db = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              return Promise.reject(new Error('UNIQUE constraint failed'));
            }
            return Promise.resolve();
          }),
        }),
      };
      mockGetDatabase.mockResolvedValue(db);

      const file = createMockFile([
        { name: 'First Network', slug: 'first' },
        { name: 'Second Network', slug: 'second' },
      ]);

      const response = await POST(createRequest(file));
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.imported).toBe(1);
      expect(body.total).toBe(2);
      expect(body.errors).toBeDefined();
    });
  });

  describe('Header normalization', () => {
    it('should handle uppercase column headers', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      const file = createMockFile([
        { Name: 'EA Anywhere', Website: 'https://ea.co.th', Phone: '1234' },
      ]);

      const response = await POST(createRequest(file));
      expect(response.status).toBe(200);

      const insertCall = db.insert.mock.results[0].value.values;
      const valuesArg = insertCall.mock.calls[0][0];
      expect(valuesArg.name).toBe('EA Anywhere');
      expect(valuesArg.website).toBe('https://ea.co.th');
      expect(valuesArg.phone).toBe('1234');
    });

    it('should handle mixed case column headers', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      const file = createMockFile([
        { NAME: 'Test', BrandColor: '#FF0000', ReferralCode: 'ABC' },
      ]);

      const response = await POST(createRequest(file));
      expect(response.status).toBe(200);

      const insertCall = db.insert.mock.results[0].value.values;
      const valuesArg = insertCall.mock.calls[0][0];
      expect(valuesArg.name).toBe('Test');
      expect(valuesArg.brandColor).toBe('#FF0000');
      expect(valuesArg.referralCode).toBe('ABC');
    });

    it('should handle spaced column headers like exported CSV', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      const file = createMockFile([
        { Name: 'Spark', Slug: 'spark', Website: 'https://spark.co', Phone: '123', 'Brand Color': '#fc4c02', 'Referral Code': 'SMILES' },
      ]);

      const response = await POST(createRequest(file));
      expect(response.status).toBe(200);

      const insertCall = db.insert.mock.results[0].value.values;
      const valuesArg = insertCall.mock.calls[0][0];
      expect(valuesArg.name).toBe('Spark');
      expect(valuesArg.slug).toBe('spark');
      expect(valuesArg.brandColor).toBe('#fc4c02');
      expect(valuesArg.referralCode).toBe('SMILES');
    });
  });

  describe('Slug generation', () => {
    it('should auto-generate slug from name', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      const file = createMockFile([
        { name: 'EA Anywhere Thailand' },
      ]);

      const response = await POST(createRequest(file));
      expect(response.status).toBe(200);

      const insertCall = db.insert.mock.results[0].value.values;
      const valuesArg = insertCall.mock.calls[0][0];
      expect(valuesArg.slug).toBe('ea-anywhere-thailand');
    });

    it('should handle special characters in slug generation', async () => {
      mockAuth.mockResolvedValue(adminSession);
      const db = createMockDb();
      mockGetDatabase.mockResolvedValue(db);

      const file = createMockFile([
        { name: 'PEA Volta (Thailand)' },
      ]);

      const response = await POST(createRequest(file));
      expect(response.status).toBe(200);

      const insertCall = db.insert.mock.results[0].value.values;
      const valuesArg = insertCall.mock.calls[0][0];
      expect(valuesArg.slug).toBe('pea-volta-thailand');
    });
  });
});
