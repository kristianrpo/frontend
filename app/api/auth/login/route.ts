import cookie from 'cookie'
import { 
  validateLoginFields, 
  makeAuthRequest, 
  extractErrorInfo, 
  createErrorResponse, 
  handleAuthError 
} from '@/lib/auth-utils'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    const validationError = validateLoginFields(body)
    if (validationError) {
      return createErrorResponse(validationError, 400, 'VALIDATION_ERROR')
    }

    const { response, data } = await makeAuthRequest('/login', 'POST', body)

    if (!response.ok) {
      const errorInfo = extractErrorInfo(data, response, '/login')
      return createErrorResponse(
        errorInfo.error,
        errorInfo.status,
        errorInfo.code,
        errorInfo.details,
        errorInfo.url
      )
    }

    const { access_token, expires_in, refresh_token, token_type } = data
    const headers = new Headers({ 'Content-Type': 'application/json' })

    if (access_token) {
      const accessMaxAge = Number.isFinite(expires_in) && expires_in > 0 
        ? expires_in 
        : 60 * 60 * 24 * 7

      const serializedAccess = cookie.serialize('access_token', access_token, {
        httpOnly: true,
        path: '/',
        maxAge: accessMaxAge,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      })
      headers.append('Set-Cookie', serializedAccess)
    }

    if (refresh_token) {
      const serializedRefresh = cookie.serialize('refresh_token', refresh_token, {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      })
      headers.append('Set-Cookie', serializedRefresh)
    }

    return new Response(JSON.stringify({ 
      ...data, 
      token_type: token_type || 'Bearer' 
    }), { 
      status: response.status, 
      headers 
    })

  } catch (err: any) {
    return handleAuthError(err, '/login')
  }
}