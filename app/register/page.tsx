"use client"
import React, { useState } from 'react'
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
    if (!email || !password || !name) {
      setError('Email, nombre y contraseña son requeridos')
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
    if (idCitizen !== '' && Number.isNaN(Number(idCitizen))) {
      setError('id_citizen debe ser un número')
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
      const payload: any = { email, password, name }
      if (idCitizen !== '') payload.id_citizen = Number(idCitizen)
      
      await register(payload)
      // registration succeeded, user must login to obtain tokens
      router.push('/login')
    } catch (err: any) {
      setError(err.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Registro</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
  <input required value={email} onChange={e => setEmail(e.target.value)} placeholder="Correo electrónico" className="border p-2 rounded" />
  <input required value={name} onChange={e => setName(e.target.value)} placeholder="Nombre completo" className="border p-2 rounded" />
  <input value={idCitizen} onChange={e => setIdCitizen(e.target.value === '' ? '' : Number(e.target.value))} type="number" placeholder="ID Ciudadano (opcional)" className="border p-2 rounded" />
  <input required value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Contraseña" className="border p-2 rounded" />
        <button disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50">{loading ? 'Registrando...' : 'Registrarse'}</button>
        {error && <div className="text-red-600">{error}</div>}
      </form>
    </div>
  )
}
