import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard')
  const isOnLogin = req.nextUrl.pathname.startsWith('/login')
  const isOnAPI = req.nextUrl.pathname.startsWith('/api')
  const isOnAuthAPI = req.nextUrl.pathname.startsWith('/api/auth')
  const isRoot = req.nextUrl.pathname === '/'

  // Allow auth API routes
  if (isOnAuthAPI) {
    return NextResponse.next()
  }

  // Redirect root to dashboard if logged in, otherwise to login
  if (isRoot) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    } else {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // If user is not logged in and trying to access protected routes
  if (!isLoggedIn && (isOnDashboard || isOnAPI)) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // If user is logged in and trying to access login page
  if (isLoggedIn && isOnLogin) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)', '/']
}