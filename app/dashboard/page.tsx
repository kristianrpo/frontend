"use client"
import { useAuth } from '../providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import ProtectedData from '../components/ProtectedData'

export default function DashboardPage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
        <div className="text-center">Cargando...</div>
      </div>
    )
  }

  if (!user) {
    return null // Se redirigirá automáticamente
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <button 
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Cerrar Sesión
        </button>
      </div>
      
      <div className="mb-4">
        <p className="text-lg">¡Bienvenido, {user.name || user.email}!</p>
        {user.email && <p className="text-gray-600">Email: {user.email}</p>}
        {user.id_citizen && <p className="text-gray-600">ID Ciudadano: {user.id_citizen}</p>}
        {user.role && <p className="text-gray-600">Rol: {user.role}</p>}
      </div>

      <div className="text-sm text-gray-600 mt-4">
        <div className="font-semibold mb-2">Información del usuario:</div>
        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>

      <div className="mt-8">
        <ProtectedData />
      </div>
    </div>
  )
}
