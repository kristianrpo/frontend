"use client"
import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { getFriendlyErrorMessage, parseErrorMessage } from '../../lib/error-utils'
import { validateLoginForm } from '../../lib/validation-utils'
import { AuthLayout, FormInput, SubmitButton, ErrorAlert } from '../components/FormComponents'
import { useFormState } from '../hooks/useFormState'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { state, error, loading, updateField, setFormError, setFormLoading } = useFormState({
    email: '',
    password: ''
  })

  function validate() {
    setFormError(null)
    const validationError = validateLoginForm(state.email, state.password)
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
      await login(state.email, state.password)
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
        <FormInput
          value={state.email}
          onChange={(value) => updateField('email', value)}
          placeholder="Correo electrónico"
          required
        />
        
        <FormInput
          value={state.password}
          onChange={(value) => updateField('password', value)}
          placeholder="Contraseña"
          type="password"
          required
        />
        
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
