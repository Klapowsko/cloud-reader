'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { type BookResponse, updateBookProgress } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

// Carregar visualizadores apenas no cliente com configuração mais agressiva
const PDFViewer = dynamic(
  () => import('./PDFViewer').catch(() => ({ default: () => <div>Erro ao carregar visualizador PDF</div> })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando visualizador...</p>
        </div>
      </div>
    ),
  }
)

const EPUBViewer = dynamic(
  () => import('./EPUBViewer').catch(() => ({ default: () => <div>Erro ao carregar visualizador EPUB</div> })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando visualizador...</p>
        </div>
      </div>
    ),
  }
)

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface BookViewerProps {
  book: BookResponse
  onClose?: () => void
}

export default function BookViewer({ book, onClose }: BookViewerProps) {
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState(book.current_page || 1)
  const [progressPercentage, setProgressPercentage] = useState(book.progress_percentage || 0)
  const [isSaving, setIsSaving] = useState(false)
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  const fileUrl = user ? `${API_URL}/api/v1/books/${book.id}/download` : ''

  // Função para salvar progresso com debounce
  const saveProgress = (page: number, percentage: number) => {
    if (!user) return

    // Limpar timeout anterior
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    // Criar novo timeout
    const timeout = setTimeout(async () => {
      setIsSaving(true)
      try {
        console.log('BookViewer - Salvando progresso:', { bookId: book.id, page, percentage })
        await updateBookProgress(book.id, user.id, page, percentage)
        console.log('BookViewer - Progresso salvo com sucesso')
      } catch (error) {
        console.error('BookViewer - Erro ao salvar progresso:', error)
      } finally {
        setIsSaving(false)
      }
    }, 1000) // Debounce de 1 segundo

    setSaveTimeout(timeout)
  }

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
    }
  }, [saveTimeout])

  const handlePageChange = (page: number, totalPages: number) => {
    setCurrentPage(page)
    const percentage = (page / totalPages) * 100
    setProgressPercentage(percentage)
    saveProgress(page, percentage)
  }

  const handleProgressChange = (percentage: number) => {
    setProgressPercentage(percentage)
    // Para PDF, já temos a página, então não precisamos salvar aqui novamente
    // Mas para EPUB, podemos salvar baseado na porcentagem
    if (book.format.toLowerCase() === 'epub') {
      saveProgress(Math.round((percentage / 100) * 100), percentage)
    }
  }

  const handleLocationChange = (location: string, progress: number) => {
    const percentage = progress * 100
    setProgressPercentage(percentage)
    // Para EPUB, salvar baseado na porcentagem
    saveProgress(Math.round(percentage), percentage)
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div>
            <h2 className="text-lg font-bold">{book.title}</h2>
            <p className="text-sm text-blue-100">{book.format.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isSaving && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Salvando...</span>
            </div>
          )}
          <div className="text-sm">
            <div className="font-semibold">{Math.round(progressPercentage)}% lido</div>
            {book.format.toLowerCase() === 'pdf' && (
              <div className="text-blue-100">Página {currentPage}</div>
            )}
          </div>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 overflow-hidden">
        {book.format.toLowerCase() === 'pdf' ? (
          <PDFViewer
            fileUrl={fileUrl}
            userId={user?.id}
            initialPage={currentPage}
            onPageChange={handlePageChange}
            onProgressChange={handleProgressChange}
          />
        ) : book.format.toLowerCase() === 'epub' ? (
          <EPUBViewer
            fileUrl={fileUrl}
            userId={user?.id}
            onLocationChange={handleLocationChange}
            onProgressChange={handleProgressChange}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6">
              <p className="text-gray-600">Formato {book.format.toUpperCase()} não suportado para visualização</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

