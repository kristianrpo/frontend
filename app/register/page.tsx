"use client"
import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { getFriendlyRegisterErrorMessage, parseErrorMessage } from '../../lib/error-utils'
import { validateRegisterForm } from '../../lib/validation-utils'
import { AuthLayout, SubmitButton, ErrorAlert } from '../components/FormComponents'
import { useFormState } from '../hooks/useFormState'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const { state, error, loading, updateField, setFormError, setFormLoading } = useFormState({
    emailLocal: '',
    password: '',
    name: '',
    idCitizen: '' as number | string
  })

  const domainSuffix = '@ccp.com'

  function buildEmail(local: string) {
    const trimmed = (local || '').trim()
    return trimmed ? `${trimmed}${domainSuffix}` : ''
  }

  function validate() {
    setFormError(null)
    const emailFull = buildEmail(state.emailLocal as unknown as string)
    const validationError = validateRegisterForm(
      emailFull,
      state.password as unknown as string,
      state.name as unknown as string,
      state.idCitizen as unknown as number | string
    )
    if (validationError) {
      setFormError(validationError)
      return false
    }
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    
    setFormLoading(true)
    setFormError(null)
    
    try {
      const payload = { 
        email: buildEmail(state.emailLocal as unknown as string), 
        password: state.password as unknown as string, 
        name: state.name as unknown as string, 
        id_citizen: Number(state.idCitizen) 
      }
      
      await register(payload)
      router.push('/login')
    } catch (err: any) {
      console.error('Register error:', err)
      const errorMessage = parseErrorMessage(err, 'Error al registrarse')
      const friendlyMessage = getFriendlyRegisterErrorMessage(errorMessage)
      setFormError(friendlyMessage)
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Crear Cuenta"
      subtitle="Únete a Carpeta Ciudadana"
      linkText="¿Ya tienes cuenta?"
      linkHref="/login"
      linkLabel="Inicia sesión aquí"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
          <div className="flex">
            <input
              required
              value={state.emailLocal as unknown as string}
              onChange={e => updateField('emailLocal' as any, e.target.value)}
              type="text"
              placeholder="tu.usuario"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-l-xl focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200"
            />
            <span className="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-gray-50 text-gray-600 rounded-r-xl select-none">
              {domainSuffix}
            </span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
          <input
            required
            value={state.name as unknown as string}
            onChange={e => updateField('name' as any, e.target.value)}
            placeholder="Nombre completo"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Ciudadano</label>
          <input
            required
            value={state.idCitizen as unknown as string}
            onChange={e => updateField('idCitizen' as any, e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="ID Ciudadano"
            type="number"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <input
            required
            value={state.password as unknown as string}
            onChange={e => updateField('password' as any, e.target.value)}
            placeholder="Contraseña"
            type="password"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200"
          />
        </div>
        
        <SubmitButton
          loading={loading}
          loadingText="Registrando..."
          text="Crear Cuenta"
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
        />
        
        <ErrorAlert error={error} />
      </form>
    </AuthLayout>
  )
}
