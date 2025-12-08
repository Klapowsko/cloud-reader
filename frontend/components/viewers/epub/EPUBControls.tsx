'use client'

import ViewerControls from '../shared/ViewerControls'

interface EPUBControlsProps {
  onPrev: () => void
  onNext: () => void
  isLoading: boolean
  error: string | null
  currentProgress: number
  hasChapters: boolean
  onToggleChapters: () => void
}

export default function EPUBControls({
  onPrev,
  onNext,
  isLoading,
  error,
  currentProgress,
  hasChapters,
  onToggleChapters,
}: EPUBControlsProps) {
  return (
    <ViewerControls onPrev={onPrev} onNext={onNext} isLoading={isLoading} error={error}>
      <span className="px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">
        {error ? 'Erro' : isLoading ? 'Carregando...' : currentProgress > 0 ? `${Math.round(currentProgress)}%` : 'Pronto'}
      </span>
      {hasChapters && (
        <button
          onClick={onToggleChapters}
          className="ml-2 md:ml-4 btn btn-outline-primary p-2 md:p-1"
          title="Mostrar capítulos"
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </ViewerControls>
  )
}

