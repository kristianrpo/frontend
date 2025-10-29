"use client"
import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { getFriendlyErrorMessage, parseErrorMessage } from '../../lib/error-utils'
import { validateLoginForm } from '../../lib/validation-utils'
import { AuthLayout, SubmitButton, ErrorAlert } from '../components/FormComponents'
import { useFormState } from '../hooks/useFormState'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { state, error, loading, updateField, setFormError, setFormLoading } = useFormState({
    emailLocal: '',
    password: ''
  })

  const domainSuffix = '@ccp.com'

  function buildEmail(local: string) {
    const trimmed = (local || '').trim()
    return trimmed ? `${trimmed}${domainSuffix}` : ''
  }

  function validate() {
    setFormError(null)
    const emailFull = buildEmail(state.emailLocal as unknown as string)
    const validationError = validateLoginForm(emailFull, state.password as unknown as string)
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
      const emailFull = buildEmail(state.emailLocal as unknown as string)
      await login(emailFull, state.password as unknown as string)
      router.push('/documents')
    } catch (err: any) {
      console.error('Login error:', err)
      const errorMessage = parseErrorMessage(err, 'Error al iniciar sesión')
      const friendlyMessage = getFriendlyErrorMessage(errorMessage)
      setFormError(friendlyMessage)
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Iniciar Sesión"
      subtitle="Accede a tu Carpeta Ciudadana"
      linkText="¿No tienes cuenta?"
      linkHref="/register"
      linkLabel="Regístrate aquí"
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
              className="flex-1 px-4 py-3 border border-gray-300 rounded-l-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <span className="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-gray-50 text-gray-600 rounded-r-xl select-none">
              {domainSuffix}
            </span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <input
            required
            value={state.password as unknown as string}
            onChange={e => updateField('password' as any, e.target.value)}
            placeholder="Contraseña"
            type="password"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>
        
        <SubmitButton
          loading={loading}
          loadingText="Entrando..."
          text="Iniciar Sesión"
        />
        
        <ErrorAlert error={error} />
      </form>
    </AuthLayout>
  )
}
