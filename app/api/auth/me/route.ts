import { cookies } from 'next/headers'

const AUTH_BASE = process.env.AUTH_BASE_URL || ''

export async function GET() {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('access_token')?.value || cookieStore.get('token')?.value

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'No access token' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      })
    }

    // Si tenemos AUTH_BASE configurado, validamos el token con el microservicio
    if (AUTH_BASE) {
      try {
        const res = await fetch(`${AUTH_BASE}/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!res.ok) {
          return new Response(JSON.stringify({ error: 'Invalid token' }), { 
            status: 401, 
            headers: { 'Content-Type': 'application/json' } 
          })
        }

        const userData = await res.json()
        
        // Decodificar el token para obtener la expiración
        let tokenExp = null
        try {
          const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]))
          tokenExp = tokenPayload.exp ? tokenPayload.exp * 1000 : null
        } catch (e) {
          // Token no se puede decodificar
        }
        
        // Incluir la información de expiración en la respuesta
        const responseData = {
          user: userData,
          exp: tokenExp
        }
        
        return new Response(JSON.stringify(responseData), { 
          status: 200, 
          headers: { 'Content-Type': 'application/json' } 
        })
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Auth service error' }), { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        })
      }
    }

    // Si no hay AUTH_BASE, intentamos decodificar el token localmente
    // Esto es para desarrollo local sin microservicio
    try {
      const jwt = require('jsonwebtoken')
      const secret = process.env.JWT_SECRET || 'dev-secret'
      const decoded = jwt.verify(accessToken, secret)
      
      // Incluir la información de expiración
      const responseData = {
        user: decoded,
        exp: decoded.exp ? decoded.exp * 1000 : null
      }
      
      return new Response(JSON.stringify(responseData), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      })
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    })
  }
}
