import { 
  validateRegistrationFields, 
  makeAuthRequest, 
  extractErrorInfo, 
  createErrorResponse, 
  createSuccessResponse, 
  handleAuthError 
} from '@/lib/auth-utils'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Validar campos requeridos
    const validationError = validateRegistrationFields(body)
    if (validationError) {
      return createErrorResponse(validationError, 400, 'VALIDATION_ERROR')
    }
    
    // Hacer petición al microservicio
    const { response, data } = await makeAuthRequest('/auth/register', 'POST', body)

    if (!response.ok) {
      const errorInfo = extractErrorInfo(data, response, '/auth/register')
      return createErrorResponse(
        errorInfo.error,
        errorInfo.status,
        errorInfo.code,
        errorInfo.details,
        errorInfo.url
      )
    }

    // El endpoint de registro devuelve el usuario creado
    // El cliente debe llamar a /login para obtener tokens
    return createSuccessResponse(data, 200)

  } catch (err: any) {
    return handleAuthError(err, '/auth/register')
  }
}