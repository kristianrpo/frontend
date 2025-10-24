import cookie from 'cookie'

const AUTH_BASE = process.env.AUTH_BASE_URL || ''

export async function POST(req: Request) {
  try {
    // Parse cookies to find access/refresh tokens
    const header = req.headers.get('cookie') || ''
    const parsed = cookie.parse(header || '')
    const accessToken = parsed.access_token || parsed.token || ''
    const refreshToken = parsed.refresh_token || ''

    let msResponse: any = { message: 'logged out' }

    // If AUTH_BASE configured, attempt to call microservice logout endpoint to revoke tokens
    if (AUTH_BASE) {
      try {
        const fetchRes = await fetch(`${AUTH_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        })
        // try to parse response
        const json = await fetchRes.json().catch(() => ({ message: fetchRes.statusText }))
        msResponse = json || { message: 'logged out' }
      } catch (e: any) {
        // ignore microservice errors but include message
        msResponse = { message: e?.message || 'microservice error' }
      }
    }

    // Clear cookies (access and refresh)
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

    return new Response(JSON.stringify(msResponse), { status: 200, headers })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Error logging out' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
