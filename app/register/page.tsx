"use client"
import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { getFriendlyRegisterErrorMessage, parseErrorMessage } from '../../lib/error-utils'
import { validateRegisterForm } from '../../lib/validation-utils'
import { AuthLayout, FormInput, SubmitButton, ErrorAlert } from '../components/FormComponents'
import { useFormState } from '../hooks/useFormState'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const { state, error, loading, updateField, setFormError, setFormLoading } = useFormState({
    email: '',
    password: '',
    name: '',
    idCitizen: '' as number | string
  })

  function validate() {
    setFormError(null)
    const validationError = validateRegisterForm(state.email, state.password, state.name, state.idCitizen)
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
        email: state.email, 
        password: state.password, 
        name: state.name, 
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
        <FormInput
          value={state.email}
          onChange={(value) => updateField('email', value)}
          placeholder="Correo electrónico"
          required
        />
        
        <FormInput
          value={state.name}
          onChange={(value) => updateField('name', value)}
          placeholder="Nombre completo"
          required
        />
        
        <FormInput
          value={state.idCitizen}
          onChange={(value) => updateField('idCitizen', value === '' ? '' : Number(value))}
          placeholder="ID Ciudadano"
          type="number"
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
          loadingText="Registrando..."
          text="Crear Cuenta"
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
        />
        
        <ErrorAlert error={error} />
      </form>
    </AuthLayout>
  )
}
