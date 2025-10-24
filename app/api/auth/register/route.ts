import cookie from 'cookie'

const AUTH_BASE = process.env.AUTH_BASE_URL || ''

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    if (!body.email || !body.password || !body.name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      })
    }
    
    const res = await fetch(`${AUTH_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const data = await res.json()
    
    if (!res.ok) {
      return new Response(JSON.stringify({ 
        error: data?.error || data?.message || 'Register failed',
        details: data?.details || `HTTP ${res.status}: ${res.statusText}`,
        status: res.status
      }), { 
        status: res.status, 
        headers: { 'Content-Type': 'application/json' } 
      })
    }

    // The register endpoint of the auth service returns the created user object
    // (created_at, email, id, id_citizen, name, role, updated_at). It does not
    // return tokens. The client should call /login to obtain tokens. Simply
    // proxy the created user response back to the frontend.
    return new Response(JSON.stringify(data), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ 
      error: err.message || 'Network or server error',
      code: 'NETWORK_ERROR'
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    })
  }
}
