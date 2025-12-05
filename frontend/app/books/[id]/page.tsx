'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getBook, type BookResponse } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import BookViewer from '@/components/BookViewer'

export default function BookReaderPage() {
  const router = useRouter()
  const params = useParams()
  const { user, isLoading: authLoading } = useAuth()
  const [book, setBook] = useState<BookResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const bookId = params?.id ? parseInt(params.id as string) : null

  useEffect(() => {
    if (authLoading) return
    if (!user || !bookId) {
      router.push('/')
      return
    }

    const loadBook = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const bookData = await getBook(bookId, user.id)
        setBook(bookData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar livro')
      } finally {
        setIsLoading(false)
      }
    }

    loadBook()
  }, [user, bookId, router, authLoading])

  const handleClose = () => {
    // Forçar recarregamento da página principal para atualizar o progresso
    router.push('/')
    // Disparar evento customizado para recarregar a lista
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('books-updated'))
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error || 'Livro não encontrado'}</p>
          <button
            onClick={handleClose}
            className="mt-4 btn btn-primary"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return <BookViewer book={book} onClose={handleClose} />
}

