'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [apiStatus, setApiStatus] = useState<string>('Verificando...')
  const [apiMessage, setApiMessage] = useState<string>('')

  useEffect(() => {
    const checkApi = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
        const response = await fetch(`${apiUrl}/api/v1/`)
        const data = await response.json()
        setApiStatus('Conectado')
        setApiMessage(data.message || 'API funcionando')
      } catch (error) {
        setApiStatus('Desconectado')
        setApiMessage('Não foi possível conectar à API')
      }
    }

    checkApi()
  }, [])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 text-center">
          Cloud Reader
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Bem-vindo à aplicação Cloud Reader
        </p>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Status da API
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-semibold ${
                apiStatus === 'Conectado' ? 'text-green-600' : 'text-red-600'
              }`}>
                {apiStatus}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Mensagem:</span>
              <span className="text-gray-800">{apiMessage}</span>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Frontend: Next.js 14</p>
          <p>Backend: Go + Gin</p>
        </div>
      </div>
    </main>
  )
}

