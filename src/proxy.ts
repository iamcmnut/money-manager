import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Protected routes that require authentication
const protectedRoutes = ['/boss-office', '/ev/history', '/settings'];

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Skip API routes and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Apply i18n middleware first
  const response = intlMiddleware(req);

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Check if the path (without locale) is a protected route
  const localePattern = /^\/(en|th)(\/|$)/;
  const pathnameWithoutLocale = pathname.replace(localePattern, '/');

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathnameWithoutLocale === route || pathnameWithoutLocale.startsWith(`${route}/`)
  );

  if (isProtectedRoute) {
    // Get the session token from cookies
    const sessionToken =
      req.cookies.get('authjs.session-token')?.value ||
      req.cookies.get('__Secure-authjs.session-token')?.value;

    if (!sessionToken) {
      // Extract locale from the path
      const localeMatch = pathname.match(localePattern);
      const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;

      // Redirect to locale-aware sign-in page
      // callbackUrl is safe here: pathname is always a relative path from Next.js routing
      const signInUrl = new URL(`/${locale}/auth/signin`, req.nextUrl.origin);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return response;
}

// OpenNext for Cloudflare only supports Edge proxy/middleware. Without this the
// build fails with: "Node.js middleware is not currently supported."
export const runtime = 'edge';

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
