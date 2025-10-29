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
    
    const validationError = validateRegistrationFields(body)
    if (validationError) {
      return createErrorResponse(validationError, 400, 'VALIDATION_ERROR')
    }
    
    const { response, data } = await makeAuthRequest('/register', 'POST', body)

    if (!response.ok) {
      const errorInfo = extractErrorInfo(data, response, '/register')
      return createErrorResponse(
        errorInfo.error,
        errorInfo.status,
        errorInfo.code,
        errorInfo.details,
        errorInfo.url
      )
    }

    return createSuccessResponse(data, 200)

  } catch (err: any) {
    return handleAuthError(err, '/register')
  }
}