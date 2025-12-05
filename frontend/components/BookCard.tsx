'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { type BookResponse, deleteBook } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

interface BookCardProps {
  book: BookResponse
  onDelete?: (id: number) => void
}

export default function BookCard({ book, onDelete }: BookCardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  // Garantir que progress_percentage seja um número válido
  const progress = typeof book.progress_percentage === 'number' ? book.progress_percentage : 0
  const progressWidth = Math.min(Math.max(progress, 0), 100)

  // Debug: verificar progresso recebido
  useEffect(() => {
    console.log('BookCard - Livro:', book.title, 'Progresso:', book.progress_percentage, 'Tipo:', typeof book.progress_percentage, 'Progress calculado:', progress, 'Width:', progressWidth)
  }, [book, progress, progressWidth])

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'pdf':
        return (
          <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        )
      case 'epub':
        return (
          <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        )
      case 'org':
        return (
          <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  const getFormatBadgeColor = (format: string) => {
    switch (format.toLowerCase()) {
      case 'pdf':
        return 'badge-danger'
      case 'epub':
        return 'badge-primary'
      case 'org':
        return 'badge-success'
      default:
        return 'badge-primary'
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

  const handleRead = () => {
    router.push(`/books/${book.id}`)
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
    <div className="card card-hover group overflow-hidden relative animate-scale-in">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-violet-50/0 group-hover:from-blue-50/50 group-hover:to-violet-50/50 transition-all duration-300 pointer-events-none"></div>
      
      <div className="relative">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
            {getFormatIcon(book.format)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-lg font-bold text-gray-900 truncate flex-1" title={book.title}>
                {book.title}
              </h3>
              <span className={`badge ${getFormatBadgeColor(book.format)} flex-shrink-0`}>
                {book.format.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-3 truncate" title={book.filename}>
              {book.filename}
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                <span>{formatFileSize(book.file_size)}</span>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(book.created_at)}</span>
              </div>
              {progress > 0 && (
                <>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    <span>{Math.round(progress)}% lido</span>
                  </div>
                </>
              )}
            </div>
            {/* Barra de progresso - sempre visível */}
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden relative" style={{ position: 'relative' }}>
              <div
                className="h-1.5 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${progressWidth}%`, 
                  backgroundColor: progress > 0 ? '#4f46e5' : '#d1d5db',
                  minWidth: progress > 0 ? '2px' : '0',
                  display: 'block',
                  position: 'relative',
                  zIndex: 1
                }}
                title={`${Math.round(progress)}% lido`}
              ></div>
              {/* Debug: mostrar valor do progresso */}
              {process.env.NODE_ENV === 'development' && (
                <div className="absolute top-0 right-0 text-xs text-gray-400" style={{ zIndex: 2 }}>
                  {Math.round(progress)}%
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-gray-100">
          <button
            onClick={handleRead}
            disabled={isDeleting}
            className="flex-1 btn btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>Ler</span>
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="btn btn-danger flex items-center justify-center gap-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Deletando...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden sm:inline">Deletar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
