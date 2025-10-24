"use client"
import { useAuth } from '../providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DocumentsPage() {
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
    return null
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
        <h2 className="text-2xl font-semibold">Documentos</h2>
        <button 
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors duration-200"
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

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Estado de Autenticación</h3>
        <p className="text-blue-700">
          Usuario autenticado correctamente
        </p>
        <p className="text-sm text-blue-600 mt-1">
          Los tokens se renuevan automáticamente en segundo plano
        </p>
      </div>
    </div>
  )
}
