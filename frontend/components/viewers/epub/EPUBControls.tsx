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
      <span className="px-4 py-2 text-sm font-medium text-gray-700">
        {error ? 'Erro' : isLoading ? 'Carregando...' : currentProgress > 0 ? `${Math.round(currentProgress)}%` : 'Pronto'}
      </span>
      {hasChapters && (
        <button
          onClick={onToggleChapters}
          className="ml-4 btn btn-outline-primary"
          title="Mostrar capítulos"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </ViewerControls>
  )
}

