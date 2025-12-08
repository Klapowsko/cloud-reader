'use client'

import { useEffect, useRef } from 'react'

interface PDFCanvasProps {
  pdf: any
  currentPage: number
  scale: number
  isRendering: boolean
  onRenderingChange: (rendering: boolean) => void
  onPageChange?: (page: number, totalPages: number) => void
  onProgressChange?: (percentage: number) => void
}

export default function PDFCanvas({
  pdf,
  currentPage,
  scale,
  isRendering,
  onRenderingChange,
  onPageChange,
  onProgressChange,
}: PDFCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderTaskRef = useRef<any>(null)
  const onPageChangeRef = useRef(onPageChange)
  const onProgressChangeRef = useRef(onProgressChange)
  const lastRenderedPageRef = useRef<number | null>(null)
  const lastRenderedScaleRef = useRef<number | null>(null)
  
  // Atualizar refs quando callbacks mudarem
  useEffect(() => {
    onPageChangeRef.current = onPageChange
    onProgressChangeRef.current = onProgressChange
  }, [onPageChange, onProgressChange])

  useEffect(() => {
    if (!pdf || !canvasRef.current) return

    // Evitar renderização se página e escala não mudaram
    if (
      lastRenderedPageRef.current === currentPage &&
      lastRenderedScaleRef.current === scale
    ) {
      return
    }

    // Cancelar renderização anterior se existir
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel()
      } catch (err) {
        // Ignorar erros de cancelamento
      }
      renderTaskRef.current = null
    }

    let cancelled = false

    onRenderingChange(true)

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

        renderTaskRef.current = page.render(renderContext)
        renderTaskRef.current.promise
          .then(() => {
            if (cancelled) return
            
            // Marcar como renderizado
            lastRenderedPageRef.current = currentPage
            lastRenderedScaleRef.current = scale
            
            onRenderingChange(false)
            
            // Usar refs para evitar re-renders desnecessários
            if (onPageChangeRef.current) {
              onPageChangeRef.current(currentPage, pdf.numPages)
            }
            if (onProgressChangeRef.current) {
              const percentage = (currentPage / pdf.numPages) * 100
              onProgressChangeRef.current(percentage)
            }
            
            renderTaskRef.current = null
          })
          .catch((err: any) => {
            // Ignorar erros de cancelamento
            if (err.name === 'RenderingCancelledException' || cancelled) {
              return
            }
            onRenderingChange(false)
            renderTaskRef.current = null
            if (!cancelled) {
              console.error('Erro ao renderizar página:', err)
            }
          })
      })
      .catch((err: any) => {
        onRenderingChange(false)
        renderTaskRef.current = null
        if (!cancelled) {
          console.error('Erro ao obter página:', err)
        }
      })

    // Cleanup: cancelar renderização quando o componente desmonta ou dependências mudam
    return () => {
      cancelled = true
      onRenderingChange(false)
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel()
        } catch (err) {
          // Ignorar erros de cancelamento
        }
        renderTaskRef.current = null
      }
    }
  }, [pdf, currentPage, scale, onRenderingChange])

  return (
    <div className="min-h-full flex items-center justify-center">
      <div className="relative">
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <canvas 
          ref={canvasRef} 
          className="shadow-lg bg-white"
        />
      </div>
    </div>
  )
}

