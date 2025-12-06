'use client'

interface ViewerControlsProps {
  onPrev: () => void
  onNext: () => void
  isLoading?: boolean
  error?: string | null
  children?: React.ReactNode
}

export default function ViewerControls({
  onPrev,
  onNext,
  isLoading = false,
  error = null,
  children,
}: ViewerControlsProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          className="btn btn-outline-primary"
          disabled={isLoading || !!error}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {children}
        <button
          onClick={onNext}
          className="btn btn-outline-primary"
          disabled={isLoading || !!error}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

