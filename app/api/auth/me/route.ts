import { cookies } from 'next/headers'
import { createErrorResponse, createSuccessResponse } from '@/lib/auth-utils'

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

    const result = await validateLocally(accessToken)
    return createSuccessResponse(result)

  } catch (error) {
    return createErrorResponse('Invalid token', 401, 'INVALID_TOKEN')
  }
}