'use client'

import { useEffect, useState } from 'react'
import { getBooks, type BookResponse } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import BookCard from './BookCard'

export default function BookList() {
  const { user } = useAuth()
  const [books, setBooks] = useState<BookResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadBooks = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await getBooks(user.id)
      console.log('BookList - Livros carregados:', response.books.map(b => ({ 
        id: b.id, 
        title: b.title, 
        progress: b.progress_percentage 
      })))
      setBooks(response.books)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar livros')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBooks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Recarregar livros quando a página recebe foco ou quando recebe evento de atualização
  useEffect(() => {
    const handleFocus = () => {
      console.log('BookList - Página recebeu foco, recarregando livros...')
      loadBooks()
    }

    const handleBooksUpdated = () => {
      console.log('BookList - Evento books-updated recebido, recarregando livros...')
      loadBooks()
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('books-updated', handleBooksUpdated)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('books-updated', handleBooksUpdated)
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = (id: number) => {
    setBooks(books.filter((book) => book.id !== id))
  }

  const handleUploadSuccess = () => {
    loadBooks()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Carregando sua biblioteca...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-red-600 font-medium mb-2">{error}</p>
            <button
              onClick={loadBooks}
              className="btn btn-danger text-sm"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-violet-100 rounded-full mb-6">
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum livro encontrado</h3>
        <p className="text-gray-500 mb-1">
          Sua biblioteca está vazia
        </p>
        <p className="text-gray-400 text-sm">
          Faça upload do seu primeiro livro acima para começar
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Meus Livros</h2>
        <div className="flex items-center gap-2">
          <span className="badge badge-primary">
            {books.length} {books.length === 1 ? 'livro' : 'livros'}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {books.map((book, index) => (
          <div
            key={book.id}
            className="animate-slide-in flex"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <BookCard book={book} onDelete={handleDelete} />
          </div>
        ))}
      </div>
    </div>
  )
}

