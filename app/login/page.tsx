"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'

// Función para convertir errores técnicos en mensajes amigables
function getFriendlyErrorMessage(error: string, code?: string): string {
  const errorLower = error.toLowerCase()
  
  // Errores de credenciales
  if (errorLower.includes('invalid credentials') || errorLower.includes('unauthorized') || code === 'INVALID_CREDENTIALS') {
    return 'Email o contraseña incorrectos. Verifica tus credenciales e intenta nuevamente.'
  }
  
  // Errores de usuario no encontrado
  if (errorLower.includes('user not found') || errorLower.includes('usuario no encontrado')) {
    return 'No existe una cuenta con este email. Verifica tu email o regístrate.'
  }
  
  // Errores de contraseña
  if (errorLower.includes('password') && errorLower.includes('incorrect')) {
    return 'La contraseña es incorrecta. Intenta nuevamente o recupera tu contraseña.'
  }
  
  // Errores de cuenta bloqueada
  if (errorLower.includes('account locked') || errorLower.includes('cuenta bloqueada')) {
    return 'Tu cuenta está temporalmente bloqueada. Contacta al soporte técnico.'
  }
  
  // Errores de servicio no disponible
  if (errorLower.includes('service unavailable') || errorLower.includes('microservicio no disponible')) {
    return 'El servicio está temporalmente no disponible. Intenta nuevamente en unos minutos.'
  }
  
  // Errores de red/conexión
  if (errorLower.includes('network') || errorLower.includes('connection') || errorLower.includes('timeout')) {
    return 'Problema de conexión. Verifica tu internet e intenta nuevamente.'
  }
  
  // Errores de validación
  if (errorLower.includes('validation') || errorLower.includes('campos requeridos')) {
    return 'Por favor completa todos los campos requeridos correctamente.'
  }
  
  // Error genérico para casos no manejados
  return 'No se pudo iniciar sesión. Verifica tus credenciales e intenta nuevamente.'
}

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
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i
    if (!re.test(email)) {
      setError('Email no tiene formato válido')
      return false
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
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
      
      let errorMessage = 'Error al iniciar sesión'
      
      try {
        const errorData = JSON.parse(err.message)
        if (errorData.error) {
          // Convertir errores técnicos a mensajes amigables
          errorMessage = getFriendlyErrorMessage(errorData.error, errorData.code)
        }
      } catch (parseErr) {
        // Si no se puede parsear, usar mensaje genérico
        errorMessage = 'Credenciales incorrectas. Verifica tu email y contraseña.'
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
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
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
