'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { loginUser, type LoginRequest } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login: saveSession, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ 
    email?: string
    password?: string
    general?: string
  }>({})
  const [isLoading, setIsLoading] = useState(false)

  // Se já estiver autenticado, redireciona para home ou página de destino
  // Lê searchParams.get('redirect') dentro do effect para evitar re-renders infinitos
  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
    }
  }, [isAuthenticated, router]) // searchParams não está nas dependências - valor é lido dentro do effect

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: { email?: string; password?: string } = {}

    if (!email) {
      newErrors.email = 'Email é obrigatório'
    } else if (!validateEmail(email)) {
      newErrors.email = 'Email inválido'
    }

    if (!password) {
      newErrors.password = 'Senha é obrigatória'
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true)
      try {
        const loginData: LoginRequest = {
          email: email.trim(),
          password,
        }

        const response = await loginUser(loginData)
        
        // Salva a sessão em cookies usando o contexto
        saveSession({
          user: response.user,
          token: response.token,
        })
        
        // Reseta o estado de loading antes do redirect
        setIsLoading(false)
        
        // Redireciona para a página de destino ou home
        const redirect = searchParams.get('redirect') || '/'
        router.push(redirect)
      } catch (error) {
        setIsLoading(false)
        const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer login'
        
        // Verifica se é erro de credenciais
        if (errorMessage.includes('credenciais') || errorMessage.includes('inválidas')) {
          setErrors({ general: 'Email ou senha incorretos' })
        } else {
          setErrors({ general: errorMessage })
        }
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-amber-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-orange-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Book-like card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-amber-100/50 overflow-hidden">
          {/* Decorative header */}
          <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 px-8 py-6 relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiPjxwYXRoIGQ9Ik0wIDUwaDEwME01MCAwdjEwMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] opacity-20"></div>
            <div className="relative z-10">
              <h1 className="text-3xl font-serif font-bold text-white mb-2 tracking-wide">
                Cloud Reader
              </h1>
              <p className="text-amber-100 text-sm">Entre na sua biblioteca digital</p>
            </div>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <span>⚠</span> {errors.general}
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (errors.email) setErrors({ ...errors, email: undefined })
                    }}
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                      errors.email
                        ? 'border-red-300 bg-red-50'
                        : 'border-amber-200 bg-amber-50/50 focus:border-amber-400'
                    }`}
                    placeholder="seu@email.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <span>⚠</span> {errors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Password field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (errors.password) setErrors({ ...errors, password: undefined })
                    }}
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                      errors.password
                        ? 'border-red-300 bg-red-50'
                        : 'border-amber-200 bg-amber-50/50 focus:border-amber-400'
                    }`}
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <span>⚠</span> {errors.password}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Entrando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-amber-200"></div>
              <span className="px-4 text-sm text-gray-500">ou</span>
              <div className="flex-1 border-t border-amber-200"></div>
            </div>

            {/* Register link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Não tem uma conta?{' '}
                <Link
                  href="/register"
                  className="text-amber-600 hover:text-amber-700 font-semibold transition-colors duration-200 underline decoration-2 underline-offset-2"
                >
                  Criar conta
                </Link>
              </p>
            </div>
          </div>

          {/* Decorative footer lines */}
          <div className="px-8 py-4 bg-amber-50/30 border-t border-amber-100">
            <div className="flex gap-2 justify-center">
              <div className="w-12 h-0.5 bg-amber-300"></div>
              <div className="w-8 h-0.5 bg-amber-200"></div>
              <div className="w-4 h-0.5 bg-amber-100"></div>
            </div>
          </div>
        </div>

        {/* Decorative quote */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 italic font-serif">
            "Um livro é um sonho que você segura nas mãos"
          </p>
        </div>
      </div>
    </div>
  )
}

