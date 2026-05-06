import { auth } from '@/lib/auth'

type MiddlewareReq = {
  nextUrl: { pathname: string }
  url: string
}

/**
 * ミドルウェアのルーティングロジックを純粋関数として切り出す。
 * テストで auth モックなしにロジックをテストできるようにする。
 */
export function handleMiddlewareRequest(
  req: MiddlewareReq,
  isLoggedIn: boolean,
): Response | undefined {
  const { pathname } = req.nextUrl

  const isAuthRoute = pathname.startsWith('/api/auth')
  const isLoginPage = pathname === '/login'
  const isOfflinePage = pathname === '/offline'

  if (isAuthRoute || isLoginPage || isOfflinePage) {
    return undefined // 通過
  }

  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    return Response.redirect(loginUrl)
  }

  return undefined // 認証済み → 通過
}

export const middlewareConfig = {
  matcher: ['/((?!_next/static|_next/image|icon|manifest|sw\\.js|favicon).*)'],
}

export default auth((req) => {
  const isLoggedIn = !!req.auth
  return handleMiddlewareRequest(req, isLoggedIn)
})

export const config = middlewareConfig
