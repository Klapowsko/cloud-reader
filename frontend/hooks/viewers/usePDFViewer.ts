'use client'

import { useEffect, useRef, useState } from 'react'
import {
  loadPDFJS,
  setupPDFJSWarnings,
  loadPDFFile,
  loadPDFOutline,
  type OutlineItem,
} from '@/lib/viewers/pdf/pdfUtils'

interface UsePDFViewerProps {
  fileUrl: string
  userId?: number
  initialPage?: number
  onPageChange?: (page: number, totalPages: number) => void
  onProgressChange?: (percentage: number) => void
}

export function usePDFViewer({
  fileUrl,
  userId,
  initialPage = 1,
  onPageChange,
  onProgressChange,
}: UsePDFViewerProps) {
  const loadingRef = useRef(false)
  const blobUrlRef = useRef<string | null>(null)
  const [pdf, setPdf] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [outline, setOutline] = useState<OutlineItem[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Evitar múltiplas chamadas simultâneas
    if (loadingRef.current) return
    
    let cancelled = false

    setIsLoading(true)
    setError(null)
    loadingRef.current = true

    const loadPdf = async () => {
      const restoreWarn = setupPDFJSWarnings()
      
      try {
        // 1. Carregar biblioteca PDF.js
        const pdfjsLib = await loadPDFJS()
        
        if (cancelled) {
          restoreWarn()
          return
        }

        // 2. Carregar arquivo PDF
        const url = await loadPDFFile(fileUrl, userId, blobUrlRef)
        
        if (cancelled) {
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current)
            blobUrlRef.current = null
          }
          restoreWarn()
          return
        }

        // 3. Carregar documento PDF
        const pdfDoc = await pdfjsLib.getDocument(url).promise
        
        if (cancelled) {
          pdfDoc.destroy()
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current)
            blobUrlRef.current = null
          }
          restoreWarn()
          return
        }
        
        setPdf(pdfDoc)
        setTotalPages(pdfDoc.numPages)
        setIsLoading(false)
        loadingRef.current = false
        
        // 4. Carregar outline (capítulos)
        try {
          const pdfOutline = await loadPDFOutline(pdfDoc)
          setOutline(pdfOutline)
        } catch (err) {
          setOutline([])
        }
        
        restoreWarn()
        
        if (onPageChange) {
          onPageChange(initialPage, pdfDoc.numPages)
        }
      } catch (err: any) {
        loadingRef.current = false
        restoreWarn()
        
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
  }, [fileUrl, userId, initialPage])

  return {
    pdf,
    currentPage,
    setCurrentPage,
    totalPages,
    isLoading,
    error,
    outline,
  }
}

