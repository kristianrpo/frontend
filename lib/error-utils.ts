export function getFriendlyErrorMessage(error: string, code?: string): string {
  const errorLower = error.toLowerCase()
  
  if (errorLower.includes('invalid credentials') || errorLower.includes('unauthorized') || code === 'INVALID_CREDENTIALS') {
    return 'Email o contraseña incorrectos. Verifica tus credenciales e intenta nuevamente.'
  }
  
  if (errorLower.includes('user not found') || errorLower.includes('usuario no encontrado')) {
    return 'No existe una cuenta con este email. Verifica tu email o regístrate.'
  }
  
  if (errorLower.includes('password') && errorLower.includes('incorrect')) {
    return 'La contraseña es incorrecta. Intenta nuevamente o recupera tu contraseña.'
  }
  
  if (errorLower.includes('account locked') || errorLower.includes('cuenta bloqueada')) {
    return 'Tu cuenta está temporalmente bloqueada. Contacta al soporte técnico.'
  }
  
  if (errorLower.includes('service unavailable') || errorLower.includes('microservicio no disponible')) {
    return 'El servicio está temporalmente no disponible. Intenta nuevamente en unos minutos.'
  }
  
  if (errorLower.includes('network') || errorLower.includes('connection') || errorLower.includes('timeout')) {
    return 'Problema de conexión. Verifica tu internet e intenta nuevamente.'
  }
  
  if (errorLower.includes('validation') || errorLower.includes('campos requeridos')) {
    return 'Por favor completa todos los campos requeridos correctamente.'
  }
  
  return 'No se pudo iniciar sesión. Verifica tus credenciales e intenta nuevamente.'
}

export function getFriendlyRegisterErrorMessage(error: string, code?: string): string {
  const errorLower = error.toLowerCase()
  
  if (errorLower.includes('email already exists') || errorLower.includes('email ya existe') || errorLower.includes('duplicate')) {
    return 'Ya existe una cuenta con este email. Intenta con otro email o inicia sesión.'
  }
  
  if (errorLower.includes('id_citizen') && errorLower.includes('duplicate')) {
    return 'Este número de cédula ya está registrado. Verifica tu número de identificación.'
  }
  
  if (errorLower.includes('validation') || errorLower.includes('campos requeridos')) {
    return 'Por favor completa todos los campos correctamente.'
  }
  
  if (errorLower.includes('password') && (errorLower.includes('weak') || errorLower.includes('débil'))) {
    return 'La contraseña debe tener al menos 8 caracteres y ser más segura.'
  }
  
  if (errorLower.includes('service unavailable') || errorLower.includes('microservicio no disponible')) {
    return 'El servicio está temporalmente no disponible. Intenta nuevamente en unos minutos.'
  }
  
  if (errorLower.includes('network') || errorLower.includes('connection') || errorLower.includes('timeout')) {
    return 'Problema de conexión. Verifica tu internet e intenta nuevamente.'
  }
  
  return 'No se pudo crear la cuenta. Verifica los datos e intenta nuevamente.'
}

export function parseErrorMessage(err: any, fallbackMessage: string): string {
  try {
    const errorData = JSON.parse(err.message)
    return errorData.error ? errorData.error : fallbackMessage
  } catch {
    return fallbackMessage
  }
}
