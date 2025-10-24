import cookie from 'cookie'

const AUTH_BASE = process.env.AUTH_BASE_URL || ''

export async function POST(req: Request) {
  try {
    const header = req.headers.get('cookie') || ''
    const parsed = cookie.parse(header || '')
    const refreshToken = parsed.refresh_token
    if (!refreshToken) {
      return new Response(JSON.stringify({ error: 'No refresh token' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }

    const res = await fetch(`${AUTH_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    })

    const data = await res.json()
    if (!res.ok) {
      console.error('Refresh token failed:', data)
      return new Response(JSON.stringify({ error: data?.error || data?.message || 'Refresh failed' }), { 
        status: res.status, 
        headers: { 'Content-Type': 'application/json' } 
      })
    }

    // Expect data: { access_token, expires_in, refresh_token }
    const accessToken = (data as any).access_token
    const expiresIn = Number((data as any).expires_in)
    const newRefresh = (data as any).refresh_token

    const headers = new Headers({ 'Content-Type': 'application/json' })
    
    // Calcular maxAge para access token (en segundos)
    let accessMaxAge = 60 * 60 * 24 * 7 // 7 días por defecto
    if (Number.isFinite(expiresIn) && expiresIn > 0) {
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

    if (newRefresh) {
      const serializedRefresh = cookie.serialize('refresh_token', newRefresh, {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      })
      headers.append('Set-Cookie', serializedRefresh)
    }

    return new Response(JSON.stringify(data), { status: 200, headers })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Error' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
