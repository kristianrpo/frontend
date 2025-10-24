"use client"
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

type User = Record<string, any> | null

type AuthContextValue = {
  user: User
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (payload: { email: string; password: string; name: string; id_citizen?: number }) => Promise<void>
  fetchWithRefresh: (input: RequestInfo, init?: RequestInit) => Promise<Response>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

function decodeExpFromPayload(payload: any): number | null {
  if (!payload) return null
  // payload may have exp in seconds
  if (payload.exp) return Number(payload.exp) * 1000
  return null
}

// Función para decodificar JWT y obtener exp
function getTokenExpiration(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [loading, setLoading] = useState(true)
  const refreshTimeout = useRef<number | null>(null)
  const lastRefreshTime = useRef<number>(0)

  useEffect(() => {
    let mounted = true
    async function init() {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) {
          setUser(null)
          return
        }
        const data = await res.json()
        if (!mounted) return
        setUser(data.user || null)
        // Pasar tanto el usuario como la información de expiración
        scheduleRefresh({ ...data.user, exp: data.exp })
      } catch (e) {
        setUser(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    init()
    return () => { mounted = false; if (refreshTimeout.current) clearTimeout(refreshTimeout.current) }
  }, [])

  function scheduleRefresh(userPayload: any) {
    if (!userPayload) return
    
    // Try to decode exp from payload (server returns token payload in /me)
    const expMs = decodeExpFromPayload(userPayload)
    if (!expMs) {
      // Si no hay exp, programamos un refresh en 1 hora como fallback
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current)
      refreshTimeout.current = window.setTimeout(async () => {
        const ok = await doRefresh()
        if (ok) {
          const res = await fetch('/api/auth/me')
          if (res.ok) {
            const data = await res.json()
            setUser(data.user || null)
            scheduleRefresh({ ...data.user, exp: data.exp })
          } else {
            setUser(null)
          }
        } else {
          setUser(null)
        }
      }, 60 * 60 * 1000) // 1 hora
      return
    }
    
    const now = Date.now()
    const msUntilExpiry = expMs - now
    
    // Verificar si la fecha de expiración es válida (no más de 1 año en el futuro)
    const maxValidExpiry = now + (365 * 24 * 60 * 60 * 1000) // 1 año
    if (expMs > maxValidExpiry) {
      // Usar fallback de 1 hora si la fecha es inválida
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current)
      refreshTimeout.current = window.setTimeout(async () => {
        const ok = await doRefresh()
        if (ok) {
          const res = await fetch('/api/auth/me')
          if (res.ok) {
            const data = await res.json()
            setUser(data.user || null)
            scheduleRefresh({ ...data.user, exp: data.exp })
          } else {
            setUser(null)
          }
        } else {
          setUser(null)
        }
      }, 60 * 60 * 1000) // 1 hora
      return
    }
    
    // Verificar si el token ya expiró o está muy cerca de expirar
    if (msUntilExpiry <= 0) {
      setUser(null)
      return
    }
    
    // refresh 5 minutos antes del expiry o la mitad del tiempo restante si es muy corto
    const refreshBefore = 5 * 60 * 1000 // 5 minutos
    let timeout = msUntilExpiry - refreshBefore
    
    // Asegurar que no programemos refreshes muy frecuentes (mínimo 2 minutos)
    const minTimeout = 2 * 60 * 1000 // 2 minutos
    if (timeout < minTimeout) {
      timeout = minTimeout
    }
    
    if (timeout <= 0) {
      // Si el token expira muy pronto, intentamos refresh inmediatamente
      doRefresh().then(ok => {
        if (ok) {
          fetch('/api/auth/me').then(res => {
            if (res.ok) {
              res.json().then(data => {
                setUser(data.user || null)
                scheduleRefresh({ ...data.user, exp: data.exp })
              })
            } else {
              setUser(null)
            }
          })
        } else {
          setUser(null)
        }
      })
      return
    }
    
    if (refreshTimeout.current) clearTimeout(refreshTimeout.current)
    refreshTimeout.current = window.setTimeout(async () => {
      const ok = await doRefresh()
      if (ok) {
        // update user and reschedule
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUser(data.user || null)
          // Pasar tanto el usuario como la información de expiración
          scheduleRefresh({ ...data.user, exp: data.exp })
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    }, timeout)
  }

  async function doRefresh(): Promise<boolean> {
    try {
      // Verificar si ya hicimos un refresh muy recientemente (evitar loops)
      const now = Date.now()
      const timeSinceLastRefresh = now - lastRefreshTime.current
      const minRefreshInterval = 30 * 1000 // 30 segundos mínimo entre refreshes
      
      if (timeSinceLastRefresh < minRefreshInterval) {
        return true // Retornar true para evitar logout
      }
      
      lastRefreshTime.current = now
      const res = await fetch('/api/auth/refresh', { method: 'POST' })
      return res.ok
    } catch (e) {
      return false
    }
  }

  async function login(email: string, password: string) {
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Login failed' }))
      throw new Error(JSON.stringify(errorData))
    }
    
    // cookies set by server; get user
    const me = await fetch('/api/auth/me')
    
    if (me.ok) {
      const data = await me.json()
      setUser(data.user || null)
      // Pasar tanto el usuario como la información de expiración
      scheduleRefresh({ ...data.user, exp: data.exp })
    } else {
      const errorData = await me.json().catch(() => ({ error: 'Failed to get user' }))
      throw new Error(JSON.stringify(errorData))
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    if (refreshTimeout.current) { clearTimeout(refreshTimeout.current); refreshTimeout.current = null }
  }

  async function register(payload: { email: string; password: string; name: string; id_citizen?: number }) {
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      throw new Error(data?.error || 'Register failed')
    }
  }

  // fetch wrapper that attempts refresh once on 401
  async function fetchWithRefresh(input: RequestInfo, init?: RequestInit): Promise<Response> {
    let res = await fetch(input, init)
    if (res.status === 401) {
      const refreshSuccess = await doRefresh()
      if (refreshSuccess) {
        res = await fetch(input, init)
      } else {
        setUser(null)
      }
    }
    return res
  }

  const value: AuthContextValue = { user, loading, login, logout, register, fetchWithRefresh }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
