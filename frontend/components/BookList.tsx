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

  const handleDelete = (id: number) => {
    setBooks(books.filter((book) => book.id !== id))
  }

  const handleUploadSuccess = () => {
    loadBooks()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Carregando livros...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadBooks}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Nenhum livro encontrado</p>
        <p className="text-gray-400 text-sm mt-2">
          Faça upload do seu primeiro livro acima
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Meus Livros</h2>
        <span className="text-sm text-gray-500">{books.length} livro(s)</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {books.map((book) => (
          <BookCard key={book.id} book={book} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  )
}

