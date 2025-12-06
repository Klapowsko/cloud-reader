'use client'

import type { OutlineItem } from '@/lib/viewers/pdf/pdfUtils'

interface OutlinePanelProps {
  outline: OutlineItem[]
  isOpen: boolean
  onClose: () => void
  onItemClick: (item: OutlineItem) => void
}

export default function OutlinePanel({
  outline,
  isOpen,
  onClose,
  onItemClick,
}: OutlinePanelProps) {
  if (!isOpen || outline.length === 0) return null

  const renderOutline = (items: OutlineItem[], level: number = 0): JSX.Element[] => {
    return items.map((item, index) => (
      <div key={index}>
        <button
          onClick={() => onItemClick(item)}
          className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${
            level > 0 ? 'pl-' + (4 + level * 4) : ''
          }`}
          style={{ paddingLeft: `${1 + level * 1}rem` }}
        >
          <span className="text-sm text-gray-700">{item.title}</span>
        </button>
        {item.items && item.items.length > 0 && (
          <div className="ml-4">
            {renderOutline(item.items, level + 1)}
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
        {renderOutline(outline)}
      </div>
    </div>
  )
}

