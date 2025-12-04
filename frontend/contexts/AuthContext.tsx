'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  getSessionCookie,
  setSessionCookie,
  removeSessionCookie,
  type SessionData,
} from '@/lib/auth/cookies'

interface AuthContextType {
  user: SessionData['user'] | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (sessionData: SessionData) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionData['user'] | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Carrega a sessão dos cookies ao inicializar
  useEffect(() => {
    const session = getSessionCookie()
    if (session) {
      setUser(session.user)
      setToken(session.token || null)
    }
    setIsLoading(false)
  }, [])

  const login = (sessionData: SessionData) => {
    setSessionCookie(sessionData)
    setUser(sessionData.user)
    setToken(sessionData.token || null)
  }

  const logout = () => {
    removeSessionCookie()
    setUser(null)
    setToken(null)
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext deve ser usado dentro de um AuthProvider')
  }
  return context
}

