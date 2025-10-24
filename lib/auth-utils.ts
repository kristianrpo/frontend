/**
 * Utilidades compartidas para los endpoints de autenticación
 */

export const AUTH_BASE = process.env.AUTH_BASE_URL || ''

export interface AuthError {
  error: string
  code?: string
  details?: string
  status: number
  url?: string
}

export interface AuthResponse<T = any> {
  data?: T
  error?: string
  code?: string
  details?: string
  status: number
}

/**
 * Crea una respuesta de error estandarizada
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  code: string = 'UNKNOWN_ERROR',
  details?: string,
  url?: string
): Response {
  const errorResponse: AuthError = {
    error,
    code,
    details: details || `HTTP ${status}`,
    status,
    url
  }

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

/**
 * Crea una respuesta exitosa estandarizada
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

/**
 * Maneja errores de red y parsing
 */
export function handleAuthError(err: any, endpoint: string): Response {
  const errorMessage = err.message || 'Error de red o servidor'
  const details = `Error al conectar con ${AUTH_BASE}${endpoint}`
  
  return createErrorResponse(
    errorMessage,
    500,
    'NETWORK_ERROR',
    details,
    `${AUTH_BASE}${endpoint}`
  )
}

/**
 * Valida campos requeridos para registro
 */
export function validateRegistrationFields(body: any): string | null {
  const requiredFields = ['email', 'password', 'name']
  const missingFields = requiredFields.filter(field => !body[field])
  
  if (missingFields.length > 0) {
    return `Campos requeridos faltantes: ${missingFields.join(', ')}`
  }
  
  return null
}

/**
 * Valida campos requeridos para login
 */
export function validateLoginFields(body: any): string | null {
  const requiredFields = ['email', 'password']
  const missingFields = requiredFields.filter(field => !body[field])
  
  if (missingFields.length > 0) {
    return `Campos requeridos faltantes: ${missingFields.join(', ')}`
  }
  
  return null
}

/**
 * Hace una petición al microservicio de autenticación
 */
export async function makeAuthRequest(
  endpoint: string,
  method: string = 'POST',
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ response: Response; data: any }> {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...headers
  }

  const response = await fetch(`${AUTH_BASE}${endpoint}`, {
    method,
    headers: defaultHeaders,
    body: body ? JSON.stringify(body) : undefined
  })

  const data = await response.json()
  
  return { response, data }
}

/**
 * Extrae información de error de la respuesta del microservicio
 */
export function extractErrorInfo(data: any, response: Response, endpoint: string): AuthError {
  return {
    error: data?.error || data?.message || 'Solicitud fallida',
    code: data?.code || 'API_ERROR',
    details: data?.details || `HTTP ${response.status}: ${response.statusText}`,
    status: response.status,
    url: `${AUTH_BASE}${endpoint}`
  }
}
