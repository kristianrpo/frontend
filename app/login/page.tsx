"use client"
import React, { useState } from 'react'
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
      router.push('/dashboard')
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
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Iniciar Sesión</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
  <input required value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo electrónico" className="border p-2 rounded" />
  <input required value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Contraseña" className="border p-2 rounded" />
        <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">{loading ? 'Entrando...' : 'Iniciar Sesión'}</button>
        {error && <div className="text-red-600">{error}</div>}
      </form>
    </div>
  )
}
