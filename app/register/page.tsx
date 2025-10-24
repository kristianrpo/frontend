"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'

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
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
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
      setError(err.message || 'Error al registrarse')
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
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
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
