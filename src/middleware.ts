import { NextResponse, type NextRequest } from 'next/server'

// Phones get the classic multi-page site under /m; the iris home page is for larger screens.
export function middleware(req: NextRequest) {
  if (/iPhone|Android.*Mobile/i.test(req.headers.get('user-agent') ?? ''))
    return NextResponse.redirect(new URL(`/m${req.nextUrl.pathname === '/' ? '' : req.nextUrl.pathname}`, req.url))
}

export const config = { matcher: ['/', '/about', '/projects', '/personal', '/contact'] }
