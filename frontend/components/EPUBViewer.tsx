'use client'

import { useEffect, useRef, useState } from 'react'

interface EPUBViewerProps {
  fileUrl: string
  userId?: number
  initialLocation?: string
  onLocationChange?: (location: string, progress: number) => void
  onProgressChange?: (percentage: number) => void
}

export default function EPUBViewer({
  fileUrl,
  userId,
  initialLocation,
  onLocationChange,
  onProgressChange,
}: EPUBViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const bookRef = useRef<any>(null)
  const renditionRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentLocation, setCurrentLocation] = useState<string | null>(initialLocation || null)
  const [totalLocations, setTotalLocations] = useState(0)

  useEffect(() => {
    if (!viewerRef.current || typeof window === 'undefined') return

    setIsLoading(true)
    setError(null)

    const loadEpub = async () => {
      try {
        // Carregar epubjs via CDN (mais confiável que webpack para este caso)
        // @ts-ignore
        let ePub = window.ePub || window.EPUB || (window as any).ePub
        
        if (!ePub) {
          await loadScript('https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js')
          // Aguardar um pouco para o script carregar
          await new Promise((resolve) => setTimeout(resolve, 100))
          // @ts-ignore
          ePub = window.ePub || window.EPUB || (window as any).ePub
        }
        
        if (!ePub) {
          throw new Error('Não foi possível carregar epubjs do CDN')
        }
        
        const Book = ePub.Book
        const Rendition = ePub.Rendition
        
        if (!Book || !Rendition) {
          throw new Error('epubjs não foi carregado corretamente do CDN')
        }

        let url = fileUrl
        // Se tiver userId, fazer fetch com header
        if (userId) {
          const response = await fetch(fileUrl, {
            headers: {
              'X-User-ID': userId.toString(),
            },
          })
          if (!response.ok) {
            throw new Error('Erro ao carregar EPUB')
          }
          const blob = await response.blob()
          url = URL.createObjectURL(blob)
        }

        // Criar instância do livro
        const book = new Book(url)
        bookRef.current = book

        // Criar renderização
        const rendition = new Rendition(viewerRef.current)
        renditionRef.current = rendition

        await book.ready
        rendition.load(book)
        setTotalLocations(book.locations.total)

        // Navegar para localização inicial se fornecida
        if (initialLocation) {
          rendition.display(initialLocation)
        }

        // Listener para mudanças de localização
        rendition.on('relocated', (location: any) => {
          const loc = location.start.cfi
          setCurrentLocation(loc)
          
          if (onLocationChange) {
            const progress = location.percentage || 0
            onLocationChange(loc, progress)
          }
          
          if (onProgressChange) {
            const progress = location.percentage || 0
            onProgressChange(progress * 100)
          }
        })

        setIsLoading(false)
      } catch (err: any) {
        setError('Erro ao carregar EPUB: ' + (err.message || 'Erro desconhecido'))
        setIsLoading(false)
      }
    }

    loadEpub()

    return () => {
      if (renditionRef.current) {
        renditionRef.current.destroy()
      }
    }
  }, [fileUrl, userId, initialLocation, onLocationChange, onProgressChange])

  const nextPage = () => {
    if (renditionRef.current) {
      renditionRef.current.next()
    }
  }

  const prevPage = () => {
    if (renditionRef.current) {
      renditionRef.current.prev()
    }
  }

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault()
        nextPage()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        prevPage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando EPUB...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controles */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button onClick={prevPage} className="btn btn-outline-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="px-4 py-2 text-sm font-medium text-gray-700">
            {currentLocation ? 'Lendo...' : 'Carregando...'}
          </span>
          <button onClick={nextPage} className="btn btn-outline-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 overflow-hidden bg-gray-100">
        <div ref={viewerRef} className="w-full h-full" style={{ minHeight: '600px' }} />
      </div>
    </div>
  )
}

