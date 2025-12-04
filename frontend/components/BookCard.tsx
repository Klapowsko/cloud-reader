'use client'

import { useState } from 'react'
import { type BookResponse, deleteBook, downloadBook } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

interface BookCardProps {
  book: BookResponse
  onDelete?: (id: number) => void
}

export default function BookCard({ book, onDelete }: BookCardProps) {
  const { user } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'pdf':
        return '📕'
      case 'epub':
        return '📖'
      case 'org':
        return '📝'
      default:
        return '📄'
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const handleDownload = async () => {
    if (!user) return

    setIsDownloading(true)
    try {
      const blob = await downloadBook(book.id, user.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = book.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao fazer download')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return
    if (!confirm('Tem certeza que deseja deletar este livro?')) return

    setIsDeleting(true)
    try {
      await deleteBook(book.id, user.id)
      if (onDelete) {
        onDelete(book.id)
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao deletar livro')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="text-4xl flex-shrink-0">{getFormatIcon(book.format)}</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate" title={book.title}>
              {book.title}
            </h3>
            <p className="text-sm text-gray-500 mb-2 truncate" title={book.filename}>
              {book.filename}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
              <span>{formatFileSize(book.file_size)}</span>
              <span>•</span>
              <span>{book.format.toUpperCase()}</span>
              <span>•</span>
              <span>{formatDate(book.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={handleDownload}
          disabled={isDownloading || isDeleting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
        >
          {isDownloading ? 'Baixando...' : 'Baixar'}
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting || isDownloading}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm font-medium"
        >
          {isDeleting ? 'Deletando...' : 'Deletar'}
        </button>
      </div>
    </div>
  )
}

