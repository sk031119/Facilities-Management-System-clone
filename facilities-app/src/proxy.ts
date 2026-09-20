import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

// Next.js 16: middleware is now called `proxy`, file is `proxy.ts`
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only guard /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Check session via Better-Auth
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = (session.user as { role?: string }).role;

  // Staff cannot access room/building management pages
  if (role === 'PUBLIC') {
    const fallbackUrl = new URL('/', request.url);
    return NextResponse.redirect(fallbackUrl);
  }

  if (
    role === 'STAFF' &&
    (pathname.startsWith('/admin/rooms') || pathname.startsWith('/admin/buildings'))
  ) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
