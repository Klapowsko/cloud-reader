'use client'

interface Chapter {
  id: string
  label: string
  href?: string
  level: number
  items?: Chapter[]
}

interface ChaptersPanelProps {
  chapters: Chapter[]
  isOpen: boolean
  onClose: () => void
  onChapterClick: (chapter: Chapter) => void
}

export default function ChaptersPanel({
  chapters,
  isOpen,
  onClose,
  onChapterClick,
}: ChaptersPanelProps) {
  if (!isOpen || chapters.length === 0) return null

  const renderChapters = (items: Chapter[], level: number = 0): JSX.Element[] => {
    return items.map((item, index) => (
      <div key={item.id || index}>
        <button
          onClick={() => onChapterClick(item)}
          className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${
            level > 0 ? 'pl-' + (4 + level * 4) : ''
          }`}
          style={{ paddingLeft: `${1 + level * 1}rem` }}
        >
          <span className="text-sm text-gray-700">{item.label}</span>
        </button>
        {item.items && item.items.length > 0 && (
          <div className="ml-4">
            {renderChapters(item.items, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  return (
    <div className="absolute left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 shadow-lg z-20 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Capítulos</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="py-2">
        {renderChapters(chapters)}
      </div>
    </div>
  )
}

