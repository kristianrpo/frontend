import cookie from 'cookie'
import { AUTH_BASE, createErrorResponse, createSuccessResponse } from '@/lib/auth-utils'

export async function POST(req: Request) {
  try {
    const header = req.headers.get('cookie') || ''
    const parsed = cookie.parse(header)
    const accessToken = parsed.access_token || parsed.token || ''
    const refreshToken = parsed.refresh_token || ''

    let microserviceResponse = { message: 'logged out' }

    if (AUTH_BASE) {
      try {
        const response = await fetch(`${AUTH_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        })
        
        const json = await response.json().catch(() => ({ message: response.statusText }))
        microserviceResponse = json || { message: 'logged out' }
      } catch (e: any) {
        microserviceResponse = { message: e?.message || 'microservice error' }
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