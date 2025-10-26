"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'

// Función para convertir errores técnicos en mensajes amigables para registro
function getFriendlyRegisterErrorMessage(error: string, code?: string): string {
  const errorLower = error.toLowerCase()
  
  // Errores de email ya existente
  if (errorLower.includes('email already exists') || errorLower.includes('email ya existe') || errorLower.includes('duplicate')) {
    return 'Ya existe una cuenta con este email. Intenta con otro email o inicia sesión.'
  }
  
  // Errores de ID ciudadano duplicado
  if (errorLower.includes('id_citizen') && errorLower.includes('duplicate')) {
    return 'Este número de cédula ya está registrado. Verifica tu número de identificación.'
  }
  
  // Errores de validación
  if (errorLower.includes('validation') || errorLower.includes('campos requeridos')) {
    return 'Por favor completa todos los campos correctamente.'
  }
  
  // Errores de contraseña débil
  if (errorLower.includes('password') && (errorLower.includes('weak') || errorLower.includes('débil'))) {
    return 'La contraseña debe tener al menos 8 caracteres y ser más segura.'
  }
  
  // Errores de servicio no disponible
  if (errorLower.includes('service unavailable') || errorLower.includes('microservicio no disponible')) {
    return 'El servicio está temporalmente no disponible. Intenta nuevamente en unos minutos.'
  }
  
  // Errores de red/conexión
  if (errorLower.includes('network') || errorLower.includes('connection') || errorLower.includes('timeout')) {
    return 'Problema de conexión. Verifica tu internet e intenta nuevamente.'
  }
  
  // Error genérico para casos no manejados
  return 'No se pudo crear la cuenta. Verifica los datos e intenta nuevamente.'
}

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [idCitizen, setIdCitizen] = useState<number | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function validate() {
    setError(null)
    if (!email || !password || !name || !idCitizen) {
      setError('Email, nombre, contraseña e ID Ciudadano son requeridos')
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
    if (Number.isNaN(Number(idCitizen))) {
      setError('ID Ciudadano debe ser un número')
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
      const payload: any = { email, password, name, id_citizen: Number(idCitizen) }
      
      await register(payload)
      router.push('/login')
    } catch (err: any) {
      console.error('Register error:', err)
      
      let errorMessage = 'Error al registrarse'
      
      try {
        const errorData = JSON.parse(err.message)
        if (errorData.error) {
          // Convertir errores técnicos a mensajes amigables
          errorMessage = getFriendlyRegisterErrorMessage(errorData.error, errorData.code)
        }
      } catch (parseErr) {
        // Si no se puede parsear, usar mensaje genérico
        errorMessage = 'No se pudo crear la cuenta. Verifica los datos e intenta nuevamente.'
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Crear Cuenta</h2>
          <p className="text-gray-600">Únete a Carpeta Ciudadana</p>
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
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Nombre completo" 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
            />
          </div>
          <div>
            <input 
              required
              value={idCitizen} 
              onChange={e => setIdCitizen(e.target.value === '' ? '' : Number(e.target.value))} 
              type="number" 
              placeholder="ID Ciudadano" 
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
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {loading ? 'Registrando...' : 'Crear Cuenta'}
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
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
