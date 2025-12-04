// Utilitários para gerenciar cookies de autenticação

export interface SessionData {
  user: {
    id: number
    name: string
    email: string
  }
  token?: string
}

const SESSION_COOKIE_NAME = 'cloud-reader-session'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7 dias em segundos

/**
 * Salva os dados da sessão em um cookie
 */
export function setSessionCookie(data: SessionData): void {
  if (typeof window === 'undefined') return

  const cookieValue = encodeURIComponent(JSON.stringify(data))
  const expires = new Date()
  expires.setTime(expires.getTime() + COOKIE_MAX_AGE * 1000)

  document.cookie = `${SESSION_COOKIE_NAME}=${cookieValue}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

/**
 * Lê os dados da sessão do cookie
 */
export function getSessionCookie(): SessionData | null {
  if (typeof window === 'undefined') return null

  const cookies = document.cookie.split(';')
  const sessionCookie = cookies.find((cookie) =>
    cookie.trim().startsWith(`${SESSION_COOKIE_NAME}=`)
  )

  if (!sessionCookie) return null

  try {
    const cookieValue = sessionCookie.split('=')[1]
    const decodedValue = decodeURIComponent(cookieValue)
    return JSON.parse(decodedValue) as SessionData
  } catch (error) {
    console.error('Erro ao ler cookie de sessão:', error)
    return null
  }
}

/**
 * Remove o cookie de sessão
 */
export function removeSessionCookie(): void {
  if (typeof window === 'undefined') return

  document.cookie = `${SESSION_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

/**
 * Verifica se existe uma sessão válida
 */
export function hasValidSession(): boolean {
  const session = getSessionCookie()
  return session !== null && session.user !== undefined
}

