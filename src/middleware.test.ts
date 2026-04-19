import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock next-intl middleware - use vi.hoisted to avoid TDZ issues
const { mockIntlMiddleware } = vi.hoisted(() => ({
  mockIntlMiddleware: vi.fn(),
}));

vi.mock('next-intl/middleware', () => ({
  default: () => mockIntlMiddleware,
}));

vi.mock('@/i18n/routing', () => ({
  routing: { defaultLocale: 'en', locales: ['en', 'th'] },
}));

import middleware from './middleware';

// --- Helpers ---

function createRequest(path: string, cookies: Record<string, string> = {}): NextRequest {
  const url = `http://localhost:3000${path}`;
  const req = new NextRequest(url);
  for (const [name, value] of Object.entries(cookies)) {
    req.cookies.set(name, value);
  }
  return req;
}

describe('Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: intl middleware returns a basic response
    mockIntlMiddleware.mockReturnValue(
      new NextResponse(null, { status: 200 })
    );
  });

  describe('Route skipping', () => {
    it('should skip API routes', async () => {
      const response = await middleware(createRequest('/api/ev/records'));
      // NextResponse.next() returns a response, not the intl middleware one
      expect(mockIntlMiddleware).not.toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should skip _next routes', async () => {
      await middleware(createRequest('/_next/static/chunk.js'));
      expect(mockIntlMiddleware).not.toHaveBeenCalled();
    });

    it('should skip favicon', async () => {
      await middleware(createRequest('/favicon.ico'));
      expect(mockIntlMiddleware).not.toHaveBeenCalled();
    });

    it('should skip files with extensions', async () => {
      await middleware(createRequest('/images/logo.png'));
      expect(mockIntlMiddleware).not.toHaveBeenCalled();
    });
  });

  describe('Security headers', () => {
    it('should add X-Content-Type-Options header', async () => {
      const response = await middleware(createRequest('/en'));
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should add X-Frame-Options DENY header', async () => {
      const response = await middleware(createRequest('/en'));
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('should add Referrer-Policy header', async () => {
      const response = await middleware(createRequest('/en'));
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });

    it('should add X-DNS-Prefetch-Control header', async () => {
      const response = await middleware(createRequest('/en'));
      expect(response.headers.get('X-DNS-Prefetch-Control')).toBe('off');
    });

    it('should add Permissions-Policy header', async () => {
      const response = await middleware(createRequest('/en'));
      expect(response.headers.get('Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=()');
    });
  });

  describe('Protected routes - /boss-office', () => {
    it('should redirect to signin when accessing /en/boss-office without session', async () => {
      const response = await middleware(createRequest('/en/boss-office'));
      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/en/auth/signin');
      expect(location).toContain('callbackUrl=%2Fen%2Fboss-office');
    });

    it('should redirect to signin when accessing /th/boss-office without session', async () => {
      const response = await middleware(createRequest('/th/boss-office'));
      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/th/auth/signin');
      expect(location).toContain('callbackUrl=%2Fth%2Fboss-office');
    });

    it('should allow access with authjs.session-token cookie', async () => {
      const response = await middleware(createRequest('/en/boss-office', {
        'authjs.session-token': 'valid-token',
      }));
      expect(response.status).toBe(200);
    });

    it('should allow access with __Secure-authjs.session-token cookie', async () => {
      const response = await middleware(createRequest('/en/boss-office', {
        '__Secure-authjs.session-token': 'valid-token',
      }));
      expect(response.status).toBe(200);
    });
  });

  describe('Protected routes - /ev/history', () => {
    it('should redirect to signin when accessing /en/ev/history without session', async () => {
      const response = await middleware(createRequest('/en/ev/history'));
      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/en/auth/signin');
      expect(location).toContain('callbackUrl=%2Fen%2Fev%2Fhistory');
    });

    it('should redirect to signin when accessing /th/ev/history without session', async () => {
      const response = await middleware(createRequest('/th/ev/history'));
      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/th/auth/signin');
      expect(location).toContain('callbackUrl=%2Fth%2Fev%2Fhistory');
    });

    it('should allow access to /en/ev/history with valid session token', async () => {
      const response = await middleware(createRequest('/en/ev/history', {
        'authjs.session-token': 'valid-token',
      }));
      expect(response.status).toBe(200);
    });

    it('should allow access to /th/ev/history with valid session token', async () => {
      const response = await middleware(createRequest('/th/ev/history', {
        'authjs.session-token': 'valid-token',
      }));
      expect(response.status).toBe(200);
    });
  });

  describe('Non-protected routes', () => {
    it('should allow access to /en/ev without session', async () => {
      const response = await middleware(createRequest('/en/ev'));
      expect(response.status).toBe(200);
    });

    it('should allow access to home page without session', async () => {
      const response = await middleware(createRequest('/en'));
      expect(response.status).toBe(200);
    });

    it('should allow access to /en/auth/signin without session', async () => {
      const response = await middleware(createRequest('/en/auth/signin'));
      expect(response.status).toBe(200);
    });
  });

  describe('Locale extraction', () => {
    it('should use default locale when path has no locale prefix', async () => {
      const response = await middleware(createRequest('/boss-office'));
      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      // Should use 'en' as default locale
      expect(location).toContain('/en/auth/signin');
    });

    it('should extract en locale from path', async () => {
      const response = await middleware(createRequest('/en/ev/history'));
      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/en/auth/signin');
    });

    it('should extract th locale from path', async () => {
      const response = await middleware(createRequest('/th/ev/history'));
      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/th/auth/signin');
    });
  });

  describe('Protected route sub-paths', () => {
    it('should protect sub-paths of /boss-office', async () => {
      const response = await middleware(createRequest('/en/boss-office/users'));
      expect(response.status).toBe(307);
    });

    it('should not protect /ev (parent of /ev/history)', async () => {
      const response = await middleware(createRequest('/en/ev'));
      expect(response.status).toBe(200);
    });
  });
});
