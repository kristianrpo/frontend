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
  // Determinar el tipo de error
  let errorMessage = 'Error de conexión con el microservicio de autenticación'
  let errorCode = 'NETWORK_ERROR'
  let status = 500
  
  if (err instanceof Error) {
    if (err.message.includes('fetch')) {
      errorMessage = 'Microservicio de autenticación no disponible'
      errorCode = 'SERVICE_UNAVAILABLE'
      status = 503
    } else if (err.message.includes('JSON')) {
      errorMessage = 'Respuesta inválida del microservicio de autenticación'
      errorCode = 'INVALID_RESPONSE'
      status = 502
    } else if (err.message.includes('timeout')) {
      errorMessage = 'Timeout al conectar con el microservicio de autenticación'
      errorCode = 'TIMEOUT_ERROR'
      status = 504
    } else {
      errorMessage = err.message
    }
  }
  
  const details = `Error al conectar con ${AUTH_BASE}${endpoint}`
  
  return createErrorResponse(
    errorMessage,
    status,
    errorCode,
    details,
    `${AUTH_BASE}${endpoint}`
  )
}

/**
 * Valida campos requeridos para registro
 */
export function validateRegistrationFields(body: any): string | null {
  const requiredFields = ['email', 'password', 'name', 'id_citizen']
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

  try {
    const response = await fetch(`${AUTH_BASE}${endpoint}`, {
      method,
      headers: defaultHeaders,
      body: body ? JSON.stringify(body) : undefined
    })

    // Verificar si la respuesta es JSON
    const contentType = response.headers.get('content-type')
    let data: any = null

    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json()
      } catch (jsonError) {
        // Si falla el parsing JSON, crear un error estructurado
        data = {
          error: 'Respuesta inválida del microservicio de autenticación',
          details: 'El servidor devolvió contenido que no es JSON válido',
          status: response.status
        }
      }
    } else {
      // Si no es JSON, crear un error estructurado
      const textResponse = await response.text()
      data = {
        error: 'Microservicio de autenticación no disponible',
        details: `El servidor devolvió: ${response.status} ${response.statusText}`,
        status: response.status,
        response: textResponse.substring(0, 200) // Solo primeros 200 caracteres
      }
    }
    
    return { response, data }
  } catch (networkError) {
    // Error de red (servidor no disponible, timeout, etc.)
    throw new Error(`Error de conexión con el microservicio de autenticación: ${networkError instanceof Error ? networkError.message : 'Error desconocido'}`)
  }
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
