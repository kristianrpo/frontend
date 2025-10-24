import cookie from 'cookie'
import { 
  makeAuthRequest, 
  extractErrorInfo, 
  createErrorResponse, 
  handleAuthError 
} from '@/lib/auth-utils'

export async function POST(req: Request) {
  try {
    // Extraer refresh token de las cookies
    const header = req.headers.get('cookie') || ''
    const parsed = cookie.parse(header)
    const refreshToken = parsed.refresh_token

    if (!refreshToken) {
      return createErrorResponse('No refresh token', 401, 'MISSING_REFRESH_TOKEN')
    }

    // Hacer petición al microservicio
    const { response, data } = await makeAuthRequest('/auth/refresh', 'POST', { 
      refresh_token: refreshToken 
    })

    if (!response.ok) {
      const errorInfo = extractErrorInfo(data, response, '/auth/refresh')
      return createErrorResponse(
        errorInfo.error,
        errorInfo.status,
        errorInfo.code,
        errorInfo.details,
        errorInfo.url
      )
    }

    // Procesar nuevos tokens y configurar cookies
    const { access_token, expires_in, refresh_token } = data
    const headers = new Headers({ 'Content-Type': 'application/json' })

    // Configurar cookie de access token
    if (access_token) {
      const accessMaxAge = Number.isFinite(expires_in) && expires_in > 0 
        ? expires_in 
        : 60 * 60 * 24 * 7 // 7 días por defecto

      const serializedAccess = cookie.serialize('access_token', access_token, {
        httpOnly: true,
        path: '/',
        maxAge: accessMaxAge,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      })
      headers.append('Set-Cookie', serializedAccess)
    }

    // Configurar cookie de refresh token (nuevo)
    if (refresh_token) {
      const serializedRefresh = cookie.serialize('refresh_token', refresh_token, {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 días
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      })
      headers.append('Set-Cookie', serializedRefresh)
    }

    return new Response(JSON.stringify(data), { 
      status: 200, 
      headers 
    })

  } catch (err: any) {
    return handleAuthError(err, '/auth/refresh')
  }
}