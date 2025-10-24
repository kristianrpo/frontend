"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function validate() {
    setError(null)
    if (!email || !password) {
      setError('Email y password son requeridos')
      return false
    }
    // simple email check
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i
    if (!re.test(email)) {
      setError('Email no tiene formato válido')
      return false
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return false
    }
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setError(null)
    
    try {
      await login(email, password)
      router.push('/documents')
    } catch (err: any) {
      console.error('Login error:', err)
      
      // Intentar parsear el error como JSON para obtener detalles específicos
      let errorMessage = err.message || 'Error al iniciar sesión'
      
      try {
        const errorData = JSON.parse(err.message)
        if (errorData.error) {
          errorMessage = errorData.error
          if (errorData.details) {
            errorMessage += ` - ${errorData.details}`
          }
          if (errorData.code) {
            errorMessage += ` (Código: ${errorData.code})`
          }
        }
      } catch (parseErr) {
        // Si no se puede parsear como JSON, usar el mensaje original
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">C</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Iniciar Sesión</h2>
          <p className="text-gray-600">Accede a tu Carpeta Ciudadana</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="Correo electrónico" 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
            />
          </div>
          <div>
            <input 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              type="password" 
              placeholder="Contraseña" 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
            />
          </div>
          
          <button 
            disabled={loading} 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {loading ? 'Entrando...' : 'Iniciar Sesión'}
          </button>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
