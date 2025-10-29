import cookie from 'cookie'
import { AUTH_BASE, createErrorResponse, extractErrorInfo, handleAuthError, makeAuthRequest } from '@/lib/auth-utils'

export async function POST(req: Request) {
  try {
    const header = req.headers.get('cookie') || ''
    const parsed = cookie.parse(header)
    const accessToken = parsed.access_token || parsed.token || ''
    const refreshToken = parsed.refresh_token || ''

    // Default response if no microservice is configured
    let microserviceResponse: any = { message: 'logged out' }

    if (AUTH_BASE) {
      try {
        const { response, data } = await makeAuthRequest('/logout', 'POST', { refresh_token: refreshToken }, {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        })

        if (!response.ok) {
          const errorInfo = extractErrorInfo(data, response, '/logout')
          return createErrorResponse(
            errorInfo.error,
            errorInfo.status,
            errorInfo.code,
            errorInfo.details,
            errorInfo.url
          )
        }

        microserviceResponse = data || { message: 'logged out' }
      } catch (e: any) {
        // Network or parse error when contacting microservice
        return handleAuthError(e, '/logout')
      }
    }

    const headers = new Headers({ 'Content-Type': 'application/json' })

    const clearAccess = cookie.serialize('access_token', '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    })

    const clearRefresh = cookie.serialize('refresh_token', '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    })

    headers.append('Set-Cookie', clearAccess)
    headers.append('Set-Cookie', clearRefresh)

    return new Response(JSON.stringify(microserviceResponse), {
      status: 200,
      headers
    })

  } catch (err: any) {
    return createErrorResponse(
      err?.message || 'Error logging out',
      500,
      'LOGOUT_ERROR'
    )
  }
}