'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import BookUpload from '@/components/BookUpload'
import BookList from '@/components/BookList'
import { type BookResponse } from '@/lib/api'

export default function Home() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    // Se não estiver carregando e não estiver autenticado, redireciona para login
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  // Mostra loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md card animate-fade-in">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Carregando sua biblioteca...</p>
          </div>
        </div>
      </main>
    )
  }

  // Se não estiver autenticado, não renderiza nada (middleware vai redirecionar)
  if (!isAuthenticated) {
    return null
  }

  const handleUploadSuccess = (book: BookResponse) => {
    // Força atualização da lista de livros
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <main className="min-h-screen py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">
                Cloud Reader
              </h1>
              {user && (
                <p className="text-lg text-gray-600">
                  Olá, <span className="font-semibold text-gray-900">{user.name}</span>! 👋
                </p>
              )}
            </div>
          </div>
          <div className="h-1 w-24 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full mt-4"></div>
        </div>

        {/* Upload Section */}
        <section className="animate-slide-in" style={{ animationDelay: '100ms' }}>
          <div className="mb-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Adicionar Novo Livro
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Faça upload dos seus livros em PDF, EPUB ou ORG
            </p>
          </div>
          <div className="card">
            <BookUpload onUploadSuccess={handleUploadSuccess} />
          </div>
        </section>

        {/* Books List Section */}
        <section className="animate-slide-in" style={{ animationDelay: '200ms' }}>
          <div className="card">
            <BookList key={refreshKey} />
          </div>
        </section>
      </div>
    </main>
  )
}

