import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Server-Side Role Enforcement
 * Agent Panel: Only AGENT allowed
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;

  // Allow login page and root redirect
  if (path === '/login' || path === '/') {
    return NextResponse.next();
  }

  // No token → redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Decode JWT payload (simple base64 decode, server validates signature)
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );

    const allowedRoles = ['AGENT'];
    
    if (!allowedRoles.includes(payload.role)) {
      // User has valid token but wrong role
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }

    return NextResponse.next();
  } catch (error) {
    // Invalid token format
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
