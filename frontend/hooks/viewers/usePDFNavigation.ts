'use client'

import { useCallback, useState } from 'react'
import { resolveOutlinePage, type OutlineItem } from '@/lib/viewers/pdf/pdfUtils'

interface UsePDFNavigationProps {
  pdf: any
  totalPages: number
  currentPage: number
  setCurrentPage: (page: number) => void
  onCloseOutline?: () => void
}

export function usePDFNavigation({
  pdf,
  totalPages,
  currentPage,
  setCurrentPage,
  onCloseOutline,
}: UsePDFNavigationProps) {
  const [scale, setScale] = useState(1.5)

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages, setCurrentPage])

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1)
    }
  }, [currentPage, totalPages, goToPage])

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }, [currentPage, goToPage])

  const zoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.25, 3))
  }, [])

  const zoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.25, 0.5))
  }, [])

  const navigateToOutlineItem = useCallback(async (item: OutlineItem) => {
    if (!pdf) return
    
    try {
      const pageNumber = await resolveOutlinePage(pdf, item, totalPages)
      
      if (pageNumber !== null) {
        setCurrentPage(pageNumber)
        if (onCloseOutline) {
          onCloseOutline()
        }
      }
    } catch (err) {
      // Erro silencioso - não é crítico
    }
  }, [pdf, totalPages, setCurrentPage, onCloseOutline])

  return {
    scale,
    zoomIn,
    zoomOut,
    goToPage,
    nextPage,
    prevPage,
    navigateToOutlineItem,
  }
}

