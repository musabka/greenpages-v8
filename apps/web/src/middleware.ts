import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Server-Side Role Enforcement
 * Public Web: USER and BUSINESS allowed (public access also allowed)
 * This middleware only validates role IF token exists
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  // No token → allow (public access)
  if (!token) {
    return NextResponse.next();
  }

  try {
    // Decode JWT payload (simple base64 decode, server validates signature)
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );

    const allowedRoles = ['USER', 'BUSINESS'];
    
    // If user has token with wrong role, clear it
    if (!allowedRoles.includes(payload.role)) {
      const response = NextResponse.next();
      response.cookies.delete('token');
      return response;
    }

    return NextResponse.next();
  } catch (error) {
    // Invalid token format → clear and continue
    const response = NextResponse.next();
    response.cookies.delete('token');
    return response;
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
