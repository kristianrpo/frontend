"use client"
import { useState } from 'react'
import { useAuth } from '../providers/AuthProvider'

export default function ProtectedData() {
  const { fetchWithRefresh } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProtectedData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Ejemplo de cómo usar fetchWithRefresh para hacer requests autenticados
      const response = await fetchWithRefresh('/api/protected-endpoint', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setData(result)
    } catch (err: any) {
      setError(err.message || 'Error al obtener datos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h3 className="text-lg font-semibold mb-4">Datos Protegidos</h3>
      
      <button 
        onClick={fetchProtectedData}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 mb-4"
      >
        {loading ? 'Cargando...' : 'Obtener Datos'}
      </button>

      {error && (
        <div className="text-red-600 mb-4">
          Error: {error}
        </div>
      )}

      {data && (
        <div className="text-sm text-gray-600">
          <div className="font-semibold mb-2">Datos obtenidos:</div>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
