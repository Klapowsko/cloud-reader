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
  const [showOutline, setShowOutline] = useState(false)
  const [outline, setOutline] = useState<any[]>([])

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
        
        // Carregar outline (capítulos) do PDF
        try {
          const pdfOutline = await pdfDoc.getOutline()
          setOutline(pdfOutline || [])
        } catch (err) {
          // Se não houver outline, deixa vazio
          setOutline([])
        }
        
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

  const handleOutlineItemClick = async (item: any) => {
    if (!pdf) return
    
    try {
      // Obter a página de destino do item do outline
      const dest = item.dest
      if (!dest) {
        console.warn('Item do outline não tem destino:', item)
        return
      }
      
      let pageNumber = 1
      
      // O PDF.js retorna destinos de diferentes formas
      // A melhor forma é usar getPageIndex que resolve a referência corretamente
      try {
        // Se o destino for um array, o primeiro elemento é geralmente a referência da página
        if (Array.isArray(dest) && dest.length > 0) {
          const destRef = dest[0]
          
          // Se for um objeto com referência, usar getPageIndex
          if (destRef && typeof destRef === 'object') {
            try {
              // getPageIndex retorna o índice baseado em 0, então adicionamos 1
              const pageIndex = await pdf.getPageIndex(destRef)
              pageNumber = pageIndex + 1
              console.log('Navegando para página via getPageIndex:', pageNumber, 'do item:', item.title)
            } catch (err) {
              // Se getPageIndex falhar, tentar usar a propriedade 'num' se existir
              if ('num' in destRef && typeof destRef.num === 'number') {
                pageNumber = destRef.num + 1
                console.log('Navegando para página via num:', pageNumber, 'do item:', item.title)
              } else {
                console.warn('Não foi possível obter página do destino:', destRef)
                return
              }
            }
          } else if (typeof destRef === 'number') {
            // Se for número direto (índice baseado em 0)
            pageNumber = destRef + 1
            console.log('Navegando para página via número direto:', pageNumber, 'do item:', item.title)
          }
        } else if (typeof dest === 'string') {
          // Se for uma string (nome de destino), tentar resolver
          try {
            // Primeiro tentar getDestination se disponível
            if (typeof pdf.getDestination === 'function') {
              const resolvedDest = await pdf.getDestination(dest)
              if (resolvedDest && Array.isArray(resolvedDest) && resolvedDest.length > 0) {
                const destRef = resolvedDest[0]
                if (destRef && typeof destRef === 'object') {
                  const pageIndex = await pdf.getPageIndex(destRef)
                  pageNumber = pageIndex + 1
                }
              }
            } else {
              // Fallback: tentar usar getPageIndex diretamente
              const pageIndex = await pdf.getPageIndex(dest)
              pageNumber = pageIndex + 1
            }
            console.log('Navegando para página via string destino:', pageNumber, 'do item:', item.title)
          } catch (err) {
            console.warn('Não foi possível resolver destino string:', dest, err)
            return
          }
        } else {
          console.warn('Formato de destino desconhecido:', dest)
          return
        }
      } catch (err) {
        console.error('Erro ao processar destino:', err, 'Item:', item.title)
        return
      }
      
      // Garantir que o número da página está dentro dos limites
      pageNumber = Math.max(1, Math.min(pageNumber, totalPages))
      
      if (pageNumber >= 1 && pageNumber <= totalPages) {
        console.log('Navegando para página final:', pageNumber, 'do item:', item.title)
        setCurrentPage(pageNumber)
        setShowOutline(false) // Fechar o painel de capítulos após navegar
      } else {
        console.warn('Número de página fora dos limites:', pageNumber, 'Total:', totalPages)
      }
    } catch (err) {
      console.error('Erro ao navegar para capítulo:', err, 'Item:', item)
    }
  }

  const renderOutline = (items: any[], level: number = 0): JSX.Element[] => {
    return items.map((item, index) => (
      <div key={index}>
        <button
          onClick={() => handleOutlineItemClick(item)}
          className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${
            level > 0 ? 'pl-' + (4 + level * 4) : ''
          }`}
          style={{ paddingLeft: `${1 + level * 1}rem` }}
        >
          <span className="text-sm text-gray-700">{item.title}</span>
        </button>
        {item.items && item.items.length > 0 && (
          <div className="ml-4">
            {renderOutline(item.items, level + 1)}
          </div>
        )}
      </div>
    ))
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
    <div className="flex flex-col h-full relative">
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
          {outline.length > 0 && (
            <button
              onClick={() => setShowOutline(!showOutline)}
              className="ml-4 btn btn-outline-primary"
              title="Mostrar capítulos"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
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

      {/* Painel de Capítulos (Outline) */}
      {showOutline && outline.length > 0 && (
        <div className="absolute left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 shadow-lg z-20 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Capítulos</h3>
            <button
              onClick={() => setShowOutline(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="py-2">
            {renderOutline(outline)}
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className={`flex-1 overflow-auto bg-gray-100 p-4 ${showOutline ? 'ml-64' : ''} transition-all duration-300`}>
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

