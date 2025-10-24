"use client"
import Link from 'next/link'
import { useAuth } from '../providers/AuthProvider'

export default function Navbar() {
  const { user, loading, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  return (
    <header className="py-4">
      <nav className="container mx-auto flex gap-4 items-center justify-between">
        <div className="flex gap-4">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          {!user && !loading && (
            <>
              <Link href="/register" className="hover:text-blue-600">Register</Link>
              <Link href="/login" className="hover:text-blue-600">Login</Link>
            </>
          )}
        </div>
        
        <div className="flex gap-4 items-center">
          {loading ? (
            <span className="text-gray-500">Cargando...</span>
          ) : user ? (
            <>
              <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
              <span className="text-gray-600">Hola, {user.name || user.email}</span>
              <button 
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Cerrar Sesión
              </button>
            </>
          ) : (
            <span className="text-gray-500">No autenticado</span>
          )}
        </div>
      </nav>
    </header>
  )
}
