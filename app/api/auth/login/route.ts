import cookie from 'cookie'

const AUTH_BASE = process.env.AUTH_BASE_URL || ''

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return new Response(JSON.stringify({ error: 'Missing' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

    const res = await fetch(`${AUTH_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()

    if (!res.ok) {
      // Manejar diferentes tipos de errores de la API
      const errorResponse = {
        error: data?.error || 'Login failed',
        code: data?.code || 'UNKNOWN_ERROR',
        details: data?.details || `HTTP ${res.status}: ${res.statusText}`,
        status: res.status,
        url: `${AUTH_BASE}/auth/login`
      }
      
      return new Response(JSON.stringify(errorResponse), { 
        status: res.status, 
        headers: { 'Content-Type': 'application/json' } 
      })
    }

    // Expect data: { access_token, expires_in, refresh_token, token_type }
    const accessToken = (data as any).access_token || (data as any).token
    const expiresIn = Number((data as any).expires_in)
    const refreshToken = (data as any).refresh_token
    const tokenType = (data as any).token_type || 'Bearer'

    const headers = new Headers({ 'Content-Type': 'application/json' })
    
    // Calcular maxAge para access token (en segundos)
    let accessMaxAge = 60 * 60 * 24 * 7 // 7 días por defecto
    if (Number.isFinite(expiresIn) && expiresIn > 0) {
      // Si expires_in viene en segundos, usarlo directamente
      accessMaxAge = expiresIn
    }

    if (accessToken) {
      const serializedAccess = cookie.serialize('access_token', accessToken, {
        httpOnly: true,
        path: '/',
        maxAge: accessMaxAge,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      })
      headers.append('Set-Cookie', serializedAccess)
    }

    if (refreshToken) {
      const serializedRefresh = cookie.serialize('refresh_token', refreshToken, {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 días
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      })
      headers.append('Set-Cookie', serializedRefresh)
    }

    return new Response(JSON.stringify({ ...data, token_type: tokenType }), { status: res.status, headers })
  } catch (err: any) {
    const errorResponse = {
      error: err.message || 'Network or server error',
      code: 'NETWORK_ERROR',
      details: `Failed to connect to ${AUTH_BASE}/auth/login`,
      status: 500,
      url: `${AUTH_BASE}/auth/login`,
      originalError: err.message
    }
    
    return new Response(JSON.stringify(errorResponse), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    })
  }
}
