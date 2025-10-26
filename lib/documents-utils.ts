/**
 * Utilidades compartidas para los endpoints de documentos
 */

export const DOCUMENTS_BASE = process.env.DOCUMENTS_BASE_URL || ''

export interface DocumentsError {
  error: string
  code?: string
  details?: string
  status: number
  url?: string
}

export interface DocumentsResponse<T = any> {
  data?: T
  error?: string
  code?: string
  details?: string
  status: number
}

export interface Document {
  id: string
  filename: string
  mime_type: string
  size_bytes: number
  hash_sha256: string
  owner_id: number
  authentication_status: string
  url: string
  // Campos adicionales para compatibilidad
  name?: string
  type?: string
  size?: number
  uploadedAt?: string
  metadata?: Record<string, any>
}

export interface DocumentsListResponse {
  documents: Document[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface DocumentsParams {
  page?: number
  limit?: number
}

/**
 * Crea una respuesta de error estandarizada para documentos
 */
export function createDocumentsErrorResponse(
  error: string,
  status: number = 500,
  code: string = 'UNKNOWN_ERROR',
  details?: string,
  url?: string
): Response {
  const errorResponse: DocumentsError = {
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
 * Crea una respuesta exitosa estandarizada para documentos
 */
export function createDocumentsSuccessResponse<T>(
  data: T,
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

/**
 * Construye la URL correcta evitando duplicación de /api/v1/
 */
function buildDocumentsUrl(endpoint: string): string {
  let url = `${DOCUMENTS_BASE}${endpoint}`
  
  // Si DOCUMENTS_BASE termina con /api/v1/ y endpoint empieza con /api/v1/, 
  // remover la duplicación
  if (DOCUMENTS_BASE.endsWith('/api/v1/') && endpoint.startsWith('/api/v1/')) {
    url = `${DOCUMENTS_BASE}${endpoint.substring('/api/v1/'.length)}`
  }
  
  return url
}

/**
 * Maneja errores de red y parsing para documentos
 */
export function handleDocumentsError(err: any, endpoint: string): Response {
  const url = buildDocumentsUrl(endpoint)
  
  // Determinar el tipo de error
  let errorMessage = 'Error de conexión con el microservicio'
  let errorCode = 'NETWORK_ERROR'
  let status = 500
  
  if (err instanceof Error) {
    if (err.message.includes('fetch')) {
      errorMessage = 'Microservicio no disponible'
      errorCode = 'SERVICE_UNAVAILABLE'
      status = 503
    } else if (err.message.includes('JSON')) {
      errorMessage = 'Respuesta inválida del microservicio'
      errorCode = 'INVALID_RESPONSE'
      status = 502
    } else if (err.message.includes('timeout')) {
      errorMessage = 'Timeout al conectar con el microservicio'
      errorCode = 'TIMEOUT_ERROR'
      status = 504
    } else {
      errorMessage = err.message
    }
  }
  
  const details = `Error al conectar con ${url}`
  
  return createDocumentsErrorResponse(
    errorMessage,
    status,
    errorCode,
    details,
    url
  )
}

/**
 * Valida parámetros de paginación
 */
export function validatePaginationParams(params: DocumentsParams): string | null {
  const { page = 1, limit = 5 } = params
  
  if (page < 1) {
    return 'La página debe ser mayor a 0'
  }
  
  if (limit < 1 || limit > 50) {
    return 'El límite debe estar entre 1 y 50'
  }
  
  return null
}

/**
 * Hace una petición al microservicio de documentos
 */
export async function makeDocumentsRequest(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ response: Response; data: any }> {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...headers
  }

  const url = buildDocumentsUrl(endpoint)

  try {
    const response = await fetch(url, {
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
          error: 'Respuesta inválida del microservicio',
          details: 'El servidor devolvió contenido que no es JSON válido',
          status: response.status
        }
      }
    } else {
      // Si no es JSON, crear un error estructurado
      const textResponse = await response.text()
      data = {
        error: 'Microservicio no disponible',
        details: `El servidor devolvió: ${response.status} ${response.statusText}`,
        status: response.status,
        response: textResponse.substring(0, 200) // Solo primeros 200 caracteres
      }
    }
    
    return { response, data }
  } catch (networkError) {
    // Error de red (servidor no disponible, timeout, etc.)
    throw new Error(`Error de conexión con el microservicio: ${networkError instanceof Error ? networkError.message : 'Error desconocido'}`)
  }
}

/**
 * Extrae información de error de la respuesta del microservicio de documentos
 */
export function extractDocumentsErrorInfo(data: any, response: Response, endpoint: string): DocumentsError {
  const url = buildDocumentsUrl(endpoint)

  return {
    error: data?.error || data?.message || 'Solicitud fallida',
    code: data?.code || 'API_ERROR',
    details: data?.details || `HTTP ${response.status}: ${response.statusText}`,
    status: response.status,
    url
  }
}

/**
 * Valida que el usuario esté autenticado
 */
export function validateAuth(cookieStore: any): string | null {
  const accessToken = cookieStore.get('access_token')?.value || cookieStore.get('token')?.value
  
  if (!accessToken) {
    return 'Token de acceso requerido'
  }
  
  return null
}

/**
 * Obtiene el token de acceso de las cookies
 */
export function getAccessToken(cookieStore: any): string | null {
  return cookieStore.get('access_token')?.value || cookieStore.get('token')?.value
}

// ============================================================================
// FUNCIONES PARA EL FRONTEND (CLIENT-SIDE)
// ============================================================================

/**
 * Obtiene documentos paginados del usuario autenticado
 * Utiliza el endpoint local que maneja la comunicación con el microservicio
 */
export async function getDocuments(
  fetchWithRefresh: (input: RequestInfo, init?: RequestInit) => Promise<Response>,
  params: DocumentsParams = {}
): Promise<DocumentsListResponse> {
  const { page = 1, limit = 5 } = params
  
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  })
  
  const response = await fetchWithRefresh(`/api/documents?${queryParams}`)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Error al obtener documentos' }))
    throw new Error(errorData.error || 'Error al obtener documentos')
  }
  
  const result = await response.json()
  
  // El microservicio devuelve {success: true, data: {documents: [...], pagination: {...}}}
  // Necesitamos extraer los datos de la estructura correcta
  if (result.success && result.data) {
    return {
      documents: result.data.documents || [],
      total: result.data.pagination?.total_items || 0,
      page: result.data.pagination?.page || page,
      limit: result.data.pagination?.limit || limit,
      totalPages: result.data.pagination?.total_pages || 1
    }
  }
  
  // Fallback para estructura directa
  return result
}

/**
 * Elimina un documento específico
 * Utiliza el endpoint local que maneja la comunicación con el microservicio
 */
export async function deleteDocument(
  fetchWithRefresh: (input: RequestInfo, init?: RequestInit) => Promise<Response>,
  documentId: string
): Promise<void> {
  const response = await fetchWithRefresh(`/api/documents/${documentId}`, {
    method: 'DELETE'
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Error al eliminar documento' }))
    throw new Error(errorData.error || 'Error al eliminar documento')
  }
}

/**
 * Elimina todos los documentos del usuario autenticado
 * Utiliza el endpoint local que maneja la comunicación con el microservicio
 */
export async function deleteAllDocuments(
  fetchWithRefresh: (input: RequestInfo, init?: RequestInit) => Promise<Response>
): Promise<void> {
  const response = await fetchWithRefresh('/api/documents', {
    method: 'DELETE'
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Error al eliminar todos los documentos' }))
    throw new Error(errorData.error || 'Error al eliminar todos los documentos')
  }
}

/**
 * Sube un documento al servidor
 * Utiliza el endpoint local que maneja la comunicación con el microservicio
 */
export async function uploadDocument(
  fetchWithRefresh: (input: RequestInfo, init?: RequestInit) => Promise<Response>,
  file: File
): Promise<Document> {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetchWithRefresh('/api/documents', {
    method: 'POST',
    body: formData
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Error al subir documento' }))
    throw new Error(errorData.error || 'Error al subir documento')
  }
  
  const result = await response.json()
  
  // El microservicio devuelve {success: true, data: {document: {...}}}
  // Necesitamos extraer el documento de la estructura correcta
  if (result.success && result.data) {
    return result.data.document || result.data
  }
  
  return result.document || result
}
