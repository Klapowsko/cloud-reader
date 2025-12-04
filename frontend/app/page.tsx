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
      <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Carregando...</span>
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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Cloud Reader</h1>
          {user && (
            <p className="text-gray-600">
              Olá, <span className="font-semibold">{user.name}</span>! Gerencie seus livros aqui.
            </p>
          )}
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Adicionar Novo Livro
          </h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <BookUpload onUploadSuccess={handleUploadSuccess} />
          </div>
        </div>

        {/* Books List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <BookList key={refreshKey} />
        </div>
      </div>
    </main>
  )
}

