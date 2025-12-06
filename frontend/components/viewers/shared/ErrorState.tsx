'use client'

interface ErrorStateProps {
  error: string
}

export default function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg max-w-md">
        <p className="text-red-600 font-semibold mb-2">Erro ao carregar</p>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    </div>
  )
}

