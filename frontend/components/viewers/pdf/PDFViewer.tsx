'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePDFViewer } from '@/hooks/viewers/usePDFViewer'
import { usePDFNavigation } from '@/hooks/viewers/usePDFNavigation'
import PDFControls from './PDFControls'
import OutlinePanel from './OutlinePanel'
import PDFCanvas from './PDFCanvas'
import LoadingState from '../shared/LoadingState'
import ErrorState from '../shared/ErrorState'

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
  const [showOutline, setShowOutline] = useState(false)
  const [isRendering, setIsRendering] = useState(false)

  const {
    pdf,
    currentPage,
    setCurrentPage,
    totalPages,
    isLoading,
    error,
    outline,
  } = usePDFViewer({
    fileUrl,
    userId,
    initialPage,
    onPageChange,
    onProgressChange,
  })

  const handleCloseOutline = useCallback(() => setShowOutline(false), [])
  const handleToggleOutline = useCallback(() => setShowOutline(prev => !prev), [])
  
  const {
    scale,
    zoomIn,
    zoomOut,
    goToPage,
    nextPage,
    prevPage,
    navigateToOutlineItem,
  } = usePDFNavigation({
    pdf,
    totalPages,
    currentPage,
    setCurrentPage,
    onCloseOutline: handleCloseOutline,
  })

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
  }, [nextPage, prevPage])

  if (isLoading && !error) {
    return <LoadingState message="Carregando PDF..." />
  }

  if (error) {
    return <ErrorState error={error} />
  }

  return (
    <div className="flex flex-col h-full relative">
      <PDFControls
        onPrev={prevPage}
        onNext={nextPage}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        scale={scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        hasOutline={outline.length > 0}
        onToggleOutline={handleToggleOutline}
        isLoading={isLoading}
        error={error}
      />

      <OutlinePanel
        outline={outline}
        isOpen={showOutline}
        onClose={handleCloseOutline}
        onItemClick={navigateToOutlineItem}
      />

      <div
        className={`flex-1 overflow-auto bg-gray-100 p-4 ${
          showOutline ? 'ml-64' : ''
        } transition-all duration-300`}
      >
        {pdf && (
          <PDFCanvas
            pdf={pdf}
            currentPage={currentPage}
            scale={scale}
            isRendering={isRendering}
            onRenderingChange={setIsRendering}
            onPageChange={onPageChange}
            onProgressChange={onProgressChange}
          />
        )}
      </div>
    </div>
  )
}

