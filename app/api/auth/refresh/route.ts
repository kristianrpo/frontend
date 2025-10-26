import cookie from 'cookie'
import { 
  createErrorResponse, 
  makeAuthRequest, 
  extractErrorInfo, 
  handleAuthError 
} from '@/lib/auth-utils'

export async function POST(req: Request) {
  try {
    const header = req.headers.get('cookie') || ''
    const parsed = cookie.parse(header)
    const refreshToken = parsed.refresh_token

    if (!refreshToken) {
      return createErrorResponse('No refresh token', 401, 'MISSING_REFRESH_TOKEN')
    }

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

    const { access_token, expires_in, refresh_token: newRefreshToken, token_type } = data
    
    return handleSuccessfulRefresh({
      access_token,
      expires_in,
      refresh_token: newRefreshToken || refreshToken,
      token_type
    })

  } catch (err: any) {
    return handleAuthError(err, '/auth/refresh')
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