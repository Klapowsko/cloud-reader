'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// Função helper para carregar scripts via CDN
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}

interface PDFViewerProps {
  fileUrl: string
  userId?: number
  initialPage?: number
  onPageChange?: (page: number, totalPages: number) => void
  onProgressChange?: (percentage: number) => void
}

export default function PDFViewer({
  fileUrl,
  userId,
  initialPage = 1,
  onPageChange,
  onProgressChange,
}: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const loadingRef = useRef(false)
  const blobUrlRef = useRef<string | null>(null)
  const [pdf, setPdf] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.5)
  const [isLoading, setIsLoading] = useState(true)
  const [isRendering, setIsRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar PDF
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Evitar múltiplas chamadas simultâneas
    if (loadingRef.current) return
    
    let cancelled = false

    setIsLoading(true)
    setError(null)
    loadingRef.current = true

    const loadPdf = async () => {
      // Salvar console.warn original para restaurar depois
      const originalWarn = console.warn
      
      try {
        // Carregar pdfjs-dist via CDN (mais confiável que webpack para este caso)
        // @ts-ignore
        let pdfjsLib = window.pdfjsLib || window.pdfjs || (window as any).pdfjs
        
        if (!pdfjsLib) {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js')
          // Aguardar um pouco para o script carregar
          await new Promise((resolve) => setTimeout(resolve, 100))
          // @ts-ignore
          pdfjsLib = window.pdfjsLib || window.pdfjs || (window as any).pdfjs
        }
        
        if (cancelled) {
          console.warn = originalWarn
          return
        }
        
        if (!pdfjsLib) {
          console.warn = originalWarn
          throw new Error('Não foi possível carregar pdfjs-dist do CDN')
        }
        
        // Configurar worker do PDF.js (GlobalWorkerOptions é somente leitura, então configuramos diretamente)
        if (pdfjsLib.GlobalWorkerOptions) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`
        }

        // Suprimir avisos comuns do PDF.js (opcional)
        console.warn = (...args: any[]) => {
          // Ignorar avisos sobre knockout groups e outros avisos não críticos
          if (args[0] && typeof args[0] === 'string' && args[0].includes('Knockout groups')) {
            return
          }
          originalWarn.apply(console, args)
        }

        let url = fileUrl
        // Se tiver userId, fazer fetch com header
        if (userId) {
          if (cancelled) return
          
          const response = await fetch(fileUrl, {
            headers: {
              'X-User-ID': userId.toString(),
            },
          })
          
          if (cancelled) return
          
          if (!response.ok) {
            throw new Error('Erro ao carregar PDF')
          }
          const blob = await response.blob()
          
          if (cancelled) {
            // Limpar blob se foi cancelado
            URL.revokeObjectURL(URL.createObjectURL(blob))
            return
          }
          
          // Limpar blob URL anterior se existir
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current)
          }
          
          blobUrlRef.current = URL.createObjectURL(blob)
          url = blobUrlRef.current
        }

        if (cancelled) {
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current)
            blobUrlRef.current = null
          }
          return
        }

        const pdfDoc = await pdfjsLib.getDocument(url).promise
        
        if (cancelled) {
          pdfDoc.destroy()
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current)
            blobUrlRef.current = null
          }
          return
        }
        
        setPdf(pdfDoc)
        setTotalPages(pdfDoc.numPages)
        setIsLoading(false)
        loadingRef.current = false
        
        // Restaurar console.warn original
        console.warn = originalWarn
        
        if (onPageChange) {
          onPageChange(initialPage, pdfDoc.numPages)
        }
      } catch (err: any) {
        loadingRef.current = false
        // Restaurar console.warn original mesmo em caso de erro
        console.warn = originalWarn
        
        if (!cancelled) {
          setError('Erro ao carregar PDF: ' + (err.message || 'Erro desconhecido'))
          setIsLoading(false)
        }
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current)
          blobUrlRef.current = null
        }
      }
    }

    loadPdf()

    // Cleanup: revogar blob URL e cancelar operações
    return () => {
      cancelled = true
      loadingRef.current = false
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [fileUrl, userId, initialPage]) // Removido onPageChange das dependências

  // Renderizar página
  useEffect(() => {
    if (!pdf || !canvasRef.current) return

    let cancelled = false
    let renderTask: any = null

    setIsRendering(true)

    // Cancelar renderização anterior imediatamente
    if (renderTask) {
      renderTask.cancel()
      renderTask = null
    }

    pdf
      .getPage(currentPage)
      .then((page: any) => {
        if (cancelled) return
        
        const canvas = canvasRef.current
        if (!canvas || cancelled) return

        const viewport = page.getViewport({ scale })
        
        // Só atualizar dimensões se mudaram para evitar "piscar"
        if (canvas.height !== viewport.height || canvas.width !== viewport.width) {
          canvas.height = viewport.height
          canvas.width = viewport.width
        }

        const renderContext = {
          canvasContext: canvas.getContext('2d')!,
          viewport: viewport,
        }

        renderTask = page.render(renderContext)
        renderTask.promise
          .then(() => {
            if (cancelled) return
            
            setIsRendering(false)
            
            if (onPageChange) {
              onPageChange(currentPage, totalPages)
            }
            if (onProgressChange) {
              const percentage = (currentPage / totalPages) * 100
              onProgressChange(percentage)
            }
          })
          .catch((err: any) => {
            // Ignorar erros de cancelamento
            if (err.name === 'RenderingCancelledException' || cancelled) {
              return
            }
            setIsRendering(false)
            if (!cancelled) {
              setError('Erro ao renderizar página: ' + err.message)
            }
          })
      })
      .catch((err: any) => {
        setIsRendering(false)
        if (!cancelled) {
          setError('Erro ao renderizar página: ' + err.message)
        }
      })

    // Cleanup: cancelar renderização quando o componente desmonta ou dependências mudam
    return () => {
      cancelled = true
      setIsRendering(false)
      if (renderTask) {
        renderTask.cancel()
        renderTask = null
      }
    }
  }, [pdf, currentPage, scale, totalPages]) // Removido onPageChange e onProgressChange das dependências

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3))
  }

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5))
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
  }, [currentPage, totalPages])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando PDF...</p>
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
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className="btn btn-outline-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="px-4 py-2 text-sm font-medium text-gray-700">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className="btn btn-outline-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
            className="ml-4 w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={zoomOut} className="btn btn-outline-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <span className="px-3 py-1 text-sm font-medium text-gray-700">
            {Math.round(scale * 100)}%
          </span>
          <button onClick={zoomIn} className="btn btn-outline-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="min-h-full flex items-center justify-center">
          <div className="relative">
            {isRendering && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded">
                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <canvas ref={canvasRef} className="shadow-lg bg-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

