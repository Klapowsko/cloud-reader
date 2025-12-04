import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE_NAME = 'cloud-reader-session'

// Rotas públicas que não precisam de autenticação
const publicRoutes = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verifica se é uma rota pública
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Se for rota pública, permite acesso
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Verifica se existe cookie de sessão
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)

  // Se não tiver cookie de sessão, redireciona para login
  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url)
    // Adiciona o path original como query param para redirecionar após login
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Tenta validar o cookie (verifica se tem estrutura válida)
  try {
    const sessionData = JSON.parse(decodeURIComponent(sessionCookie.value))
    if (!sessionData.user || !sessionData.user.id) {
      // Cookie inválido, redireciona para login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  } catch (error) {
    // Cookie inválido, redireciona para login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Usuário autenticado, permite acesso
  return NextResponse.next()
}

// Configura quais rotas o middleware deve executar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (arquivos públicos)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

