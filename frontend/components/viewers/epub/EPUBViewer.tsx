'use client'

import { useEffect, useState } from 'react'
import { useEPUBViewer } from '@/hooks/viewers/useEPUBViewer'
import { useEPUBNavigation } from '@/hooks/viewers/useEPUBNavigation'
import EPUBControls from './EPUBControls'
import ChaptersPanel from './ChaptersPanel'
import LoadingState from '../shared/LoadingState'
import ErrorState from '../shared/ErrorState'
import type { Chapter } from '@/lib/viewers/epub/epubUtils'

interface EPUBViewerProps {
  fileUrl: string
  userId?: number
  initialLocation?: string
  initialProgress?: number
  onLocationChange?: (location: string, progress: number) => void
  onProgressChange?: (percentage: number) => void
}

export default function EPUBViewer({
  fileUrl,
  userId,
  initialLocation,
  initialProgress,
  onLocationChange,
  onProgressChange,
}: EPUBViewerProps) {
  const [showChapters, setShowChapters] = useState(false)

  const {
    viewerRef,
    bookRef,
    renditionRef,
    isLoading,
    error,
    currentProgress,
    chapters,
  } = useEPUBViewer({
    fileUrl,
    userId,
    initialLocation,
    initialProgress,
    onLocationChange,
    onProgressChange,
  })

  const { navigateToChapter, nextPage, prevPage } = useEPUBNavigation({
    renditionRef,
    bookRef,
    onCloseChapters: () => setShowChapters(false),
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

  return (
    <div className="flex flex-col h-full">
      <EPUBControls
        onPrev={prevPage}
        onNext={nextPage}
        isLoading={isLoading}
        error={error}
        currentProgress={currentProgress}
        hasChapters={chapters.length > 0}
        onToggleChapters={() => setShowChapters(!showChapters)}
      />

      <ChaptersPanel
        chapters={chapters}
        isOpen={showChapters}
        onClose={() => setShowChapters(false)}
        onChapterClick={navigateToChapter}
      />

      <div
        className={`flex-1 overflow-hidden bg-gray-100 relative transition-all duration-300 ${
          showChapters ? 'md:ml-64' : ''
        }`}
        style={{ minHeight: '400px' }}
      >
        <div
          ref={viewerRef}
          className="w-full h-full"
          style={{
            minHeight: '400px',
            height: '100%',
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: 'white',
          }}
          id="epub-viewer-container"
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `
              #epub-viewer-container > div:not(:last-child) {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                position: absolute !important;
                top: -9999px !important;
                left: -9999px !important;
                width: 0 !important;
                height: 0 !important;
                z-index: -1 !important;
                pointer-events: none !important;
              }
              #epub-viewer-container > div:last-child {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                width: 100% !important;
                height: 100% !important;
                z-index: 10 !important;
              }
            `,
            }}
          />
        </div>
        
        {isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <LoadingState message="Carregando EPUB..." />
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <ErrorState error={error} />
          </div>
        )}
      </div>
    </div>
  )
}

