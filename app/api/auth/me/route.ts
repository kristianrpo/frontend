import { cookies } from 'next/headers'
import { AUTH_BASE, createErrorResponse, createSuccessResponse } from '@/lib/auth-utils'

function decodeTokenExpiration(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

async function validateWithMicroservice(accessToken: string) {
  const response = await fetch(`${AUTH_BASE}/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error('Invalid token')
  }

  const userData = await response.json()
  const tokenExp = decodeTokenExpiration(accessToken)
  
  return {
    user: userData,
    exp: tokenExp
  }
}

async function validateLocally(accessToken: string) {
  try {
    const jwt = require('jsonwebtoken')
    const secret = process.env.JWT_SECRET || 'dev-secret'
    const decoded = jwt.verify(accessToken, secret)
    
    return {
      user: decoded,
      exp: decoded.exp ? decoded.exp * 1000 : null
    }
  } catch (error) {
    throw new Error('Invalid token')
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value || cookieStore.get('token')?.value

    if (!accessToken) {
      return createErrorResponse('No access token', 401, 'MISSING_TOKEN')
    }

    if (AUTH_BASE) {
      try {
        const result = await validateWithMicroservice(accessToken)
        return createSuccessResponse(result)
      } catch (error) {
        return createErrorResponse('Invalid token', 401, 'INVALID_TOKEN')
      }
    }

    try {
      const result = await validateLocally(accessToken)
      return createSuccessResponse(result)
    } catch (error) {
      return createErrorResponse('Invalid token', 401, 'INVALID_TOKEN')
    }

  } catch (error) {
    return createErrorResponse('Server error', 500, 'SERVER_ERROR')
  }
}