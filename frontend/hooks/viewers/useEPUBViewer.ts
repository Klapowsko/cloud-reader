'use client'

import { useEffect, useRef, useState } from 'react'
import { 
  loadEpubJS, 
  waitForViewerElement, 
  createBookOptions, 
  waitForBookReady,
  loadChapters,
  type Chapter
} from '@/lib/viewers/epub/epubUtils'
import {
  setupViewManager,
  setupRenditionEvents,
  calculateInitialLocation,
  displayInitialPage,
  setupRelocatedHandler,
  generateFullLocations,
} from '@/lib/viewers/epub/renditionUtils'

interface UseEPUBViewerProps {
  fileUrl: string
  userId?: number
  initialLocation?: string
  initialProgress?: number
  onLocationChange?: (location: string, progress: number) => void
  onProgressChange?: (percentage: number) => void
}

export function useEPUBViewer({
  fileUrl,
  userId,
  initialLocation,
  initialProgress,
  onLocationChange,
  onProgressChange,
}: UseEPUBViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const bookRef = useRef<any>(null)
  const renditionRef = useRef<any>(null)
  const blobUrlRef = useRef<string | null>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentProgress, setCurrentProgress] = useState<number>(initialProgress || 0)
  const [chapters, setChapters] = useState<Chapter[]>([])
  
  const onLocationChangeRef = useRef(onLocationChange)
  const onProgressChangeRef = useRef(onProgressChange)
  
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange
    onProgressChangeRef.current = onProgressChange
  }, [onLocationChange, onProgressChange])

  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsLoading(true)
    setError(null)

    const loadEpub = async () => {
      try {
        // 1. Aguardar elemento do viewer estar disponível no DOM
        // Aguardar um pouco para garantir que o DOM foi renderizado
        await new Promise((resolve) => setTimeout(resolve, 200))
        
        // Tentar encontrar o elemento
        await waitForViewerElement(viewerRef)
        
        // 2. Carregar biblioteca epubjs
        const { Book, Rendition } = await loadEpubJS()
        
        // 3. Criar opções do livro
        const bookOptions = createBookOptions(fileUrl, userId)
        
        // 4. Criar instância do livro
        const book = new Book(fileUrl, bookOptions)
        bookRef.current = book

        // 5. Configurar handler de erros
        let errorCount = 0
        const maxErrors = 5
        const errorHandler = (err: any) => {
          errorCount++
          if (errorCount >= maxErrors) {
            setError('Erro ao processar livro EPUB: Muitas requisições falharam. O arquivo pode estar corrompido.')
            setIsLoading(false)
            return
          }
        }
        book.on('error', errorHandler)

        // 6. Aguardar livro estar pronto
        try {
          await waitForBookReady(book)
        } catch (err: any) {
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current)
            blobUrlRef.current = null
          }
          book.off('error', errorHandler)
          throw err
        }

        if (!viewerRef.current) {
          throw new Error('Elemento do viewer não encontrado')
        }
        
        // 7. Criar e configurar renderização
        // @ts-ignore
        const rendition = new Rendition(book, {
          width: viewerRef.current.offsetWidth || '100%',
          height: viewerRef.current.offsetHeight || '100%',
          spread: 'none',
          manager: 'default',
          flow: 'paginated',
          allowScriptedContent: true,
        })
        
        // @ts-ignore
        rendition.attachTo(viewerRef.current)
        renditionRef.current = rendition
        
        // 8. Configurar gerenciador de views
        setupViewManager(rendition)
        
        // 9. Ajustar tamanho após um delay
        setTimeout(() => {
          if (viewerRef.current) {
            const width = viewerRef.current.offsetWidth || window.innerWidth
            const height = viewerRef.current.offsetHeight || window.innerHeight
            
            // @ts-ignore
            if (rendition.resize) {
              // @ts-ignore
              rendition.resize(width, height)
            }
            
            viewerRef.current.style.width = '100%'
            viewerRef.current.style.height = '100%'
            
            // @ts-ignore
            if (rendition.manager && rendition.manager.views) {
              // @ts-ignore
              const views = rendition.manager.views
              if (views && Array.isArray(views)) {
                // @ts-ignore
                views.forEach((v: any) => {
                  if (v && v.element) {
                    v.element.style.width = '100%'
                    v.element.style.height = '100%'
                  }
                })
              }
            }
          }
        }, 200)
        
        // 10. Configurar eventos da renderização
        setupRenditionEvents(rendition, book)
        
        await new Promise((resolve) => setTimeout(resolve, 100))
        
        // 11. Gerar locations completas do livro (em background para não bloquear)
        // Isso garante que o livro inteiro seja processado
        generateFullLocations(book).catch((err) => {
          console.warn('Erro ao gerar locations em background:', err)
        })
        
        // 12. Calcular localização inicial
        const targetLocation = await calculateInitialLocation(book, initialLocation, initialProgress)
        
        // 12. Exibir página inicial
        await displayInitialPage(rendition, targetLocation)
        
        // 13. Configurar handler de relocação
        setupRelocatedHandler(
          rendition,
          book,
          onLocationChangeRef.current,
          onProgressChangeRef.current,
          setCurrentProgress
        )

        // 14. Carregar capítulos
        try {
          const loadedChapters = await loadChapters(book)
          setChapters(loadedChapters)
        } catch (chaptersErr) {
          console.warn('EPUBViewer - Erro ao carregar capítulos:', chaptersErr)
          // Não é crítico, continuar sem capítulos
        }

        setIsLoading(false)
      } catch (err: any) {
        console.error('EPUBViewer - Erro ao carregar EPUB:', err)
        setError('Erro ao carregar EPUB: ' + (err.message || 'Erro desconhecido'))
        setIsLoading(false)
      }
    }

    loadEpub().catch((err) => {
      console.error('EPUBViewer - Erro não capturado:', err)
      setError('Erro ao carregar EPUB: ' + (err.message || 'Erro desconhecido'))
      setIsLoading(false)
    })

    return () => {
      if (renditionRef.current) {
        try {
          renditionRef.current.destroy()
        } catch (err) {
          console.error('EPUBViewer - Erro ao destruir renderização:', err)
        }
      }
      if (blobUrlRef.current) {
        try {
          URL.revokeObjectURL(blobUrlRef.current)
          blobUrlRef.current = null
        } catch (err) {
          // Ignorar erros na limpeza
        }
      }
    }
  }, [fileUrl, userId, initialLocation, initialProgress])

  return {
    viewerRef,
    bookRef,
    renditionRef,
    isLoading,
    error,
    currentProgress,
    chapters,
  }
}

