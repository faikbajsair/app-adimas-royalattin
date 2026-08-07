import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  const isDashboardPath = request.nextUrl.pathname.startsWith('/dashboard');
  const isLoginPath = request.nextUrl.pathname === '/login';

  if (isDashboardPath) {
    if (!token) {
      // Tidak ada token, arahkan kembali ke login
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifySessionToken(token);
    if (!payload) {
      // Token tidak valid atau expired, arahkan ke login dan hapus cookie
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('session_token');
      return response;
    }
  }

  if (isLoginPath && token) {
    const payload = await verifySessionToken(token);
    if (payload) {
      // Sesi masih aktif, arahkan langsung ke dashboard
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
