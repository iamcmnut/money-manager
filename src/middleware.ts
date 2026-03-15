import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Protected routes that require authentication
const protectedRoutes = ['/boss-office'];

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
      const signInUrl = new URL(`/${locale}/auth/signin`, req.nextUrl.origin);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
