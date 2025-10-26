import cookie from 'cookie'
import { createErrorResponse } from '@/lib/auth-utils'
import { signToken, verifyToken } from '@/lib/jwt'

export async function POST(req: Request) {
  try {
    const header = req.headers.get('cookie') || ''
    const parsed = cookie.parse(header)
    const refreshToken = parsed.refresh_token

    if (!refreshToken) {
      return createErrorResponse('No refresh token', 401, 'MISSING_REFRESH_TOKEN')
    }

    // Validación local del refresh token y generación de nuevo access token
    try {
      const decoded = verifyToken(refreshToken)
      if (!decoded) {
        return createErrorResponse('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN')
      }

      // Generar nuevo access token con la misma información del refresh token
      const newAccessToken = signToken(decoded, '1h') // Token de acceso válido por 1 hora
      
      return handleSuccessfulRefresh({
        access_token: newAccessToken,
        expires_in: 3600, // 1 hora
        refresh_token: refreshToken // Mantener el mismo refresh token
      })
    } catch (error) {
      return createErrorResponse('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN')
    }

  } catch (err: any) {
    return createErrorResponse('Server error', 500, 'SERVER_ERROR')
  }
}

function handleSuccessfulRefresh(data: any) {
  const { access_token, expires_in, refresh_token } = data
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

  return new Response(JSON.stringify(data), { 
    status: 200, 
    headers 
  })
}