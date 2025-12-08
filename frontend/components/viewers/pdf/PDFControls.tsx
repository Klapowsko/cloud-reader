'use client'

import ViewerControls from '../shared/ViewerControls'

interface PDFControlsProps {
  onPrev: () => void
  onNext: () => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  scale: number
  onZoomIn: () => void
  onZoomOut: () => void
  hasOutline: boolean
  onToggleOutline: () => void
  isLoading?: boolean
  error?: string | null
}

export default function PDFControls({
  onPrev,
  onNext,
  currentPage,
  totalPages,
  onPageChange,
  scale,
  onZoomIn,
  onZoomOut,
  hasOutline,
  onToggleOutline,
  isLoading = false,
  error = null,
}: PDFControlsProps) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between p-2 md:p-4 bg-white border-b border-gray-200 gap-2 md:gap-0">
      <div className="flex items-center gap-1 md:gap-2 flex-wrap">
        <button
          onClick={onPrev}
          disabled={currentPage === 1 || isLoading || !!error}
          className="btn btn-outline-primary disabled:opacity-50 disabled:cursor-not-allowed p-2 md:p-1"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">
          {currentPage}/{totalPages}
        </span>
        <button
          onClick={onNext}
          disabled={currentPage === totalPages || isLoading || !!error}
          className="btn btn-outline-primary disabled:opacity-50 disabled:cursor-not-allowed p-2 md:p-1"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <input
          type="number"
          min="1"
          max={totalPages}
          value={currentPage}
          onChange={(e) => onPageChange(parseInt(e.target.value) || 1)}
          className="ml-2 md:ml-4 w-16 md:w-20 px-1 md:px-2 py-1 text-xs md:text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={isLoading || !!error}
        />
        {hasOutline && (
          <button
            onClick={onToggleOutline}
            className="ml-2 md:ml-4 btn btn-outline-primary p-2 md:p-1"
            title="Mostrar capítulos"
            disabled={isLoading || !!error}
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex items-center gap-1 md:gap-2">
        <button
          onClick={onZoomOut}
          className="btn btn-outline-primary p-2 md:p-1"
          disabled={isLoading || !!error}
          title="Diminuir zoom"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </button>
        <span className="px-2 md:px-3 py-1 text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          className="btn btn-outline-primary p-2 md:p-1"
          disabled={isLoading || !!error}
          title="Aumentar zoom"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

