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
  if (payload.exp) {
    // El exp ya viene en milisegundos desde el microservicio
    const expValue = Number(payload.exp)
    return expValue
  }
  return null
}

function getTokenExpiration(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    // Los JWTs estándar tienen exp en segundos, convertir a milisegundos
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
  const isRefreshing = useRef<boolean>(false)

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
    
    const expMs = decodeExpFromPayload(userPayload)
    
    if (!expMs) {
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
      }, 60 * 60 * 1000)
      return
    }
    
    const now = Date.now()
    const msUntilExpiry = expMs - now
    
    const maxValidExpiry = now + (365 * 24 * 60 * 60 * 1000)
    if (expMs > maxValidExpiry) {
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
    
    if (msUntilExpiry <= 0) {
      setUser(null)
      return
    }
    
    // Refresh 1 minuto antes de expirar
    const refreshBefore = 1 * 60 * 1000 // 1 minuto antes
    let timeout = msUntilExpiry - refreshBefore
    
    // Si el token expira en menos de 1 minuto, refrescar inmediatamente
    if (timeout <= 0) {
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
    
    // Mínimo 10 segundos para evitar timeouts muy cortos
    const minTimeout = 10 * 1000
    if (timeout < minTimeout) {
      timeout = minTimeout
    }
    
    if (refreshTimeout.current) {
      clearTimeout(refreshTimeout.current)
    }
    
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
    }, timeout)
  }

  async function doRefresh(): Promise<boolean> {
    try {
      if (isRefreshing.current) {
        return true
      }
      
      const now = Date.now()
      const timeSinceLastRefresh = now - lastRefreshTime.current
      const minRefreshInterval = 10 * 1000 // Reducido a 10 segundos
      
      if (timeSinceLastRefresh < minRefreshInterval) {
        return true
      }
      
      isRefreshing.current = true
      lastRefreshTime.current = now
      
      const res = await fetch('/api/auth/refresh', { method: 'POST' })
      
      isRefreshing.current = false
      return res.ok
    } catch (e) {
      isRefreshing.current = false
      return false
    }
  }

  async function login(email: string, password: string) {
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Login failed' }))
      throw new Error(JSON.stringify(errorData))
    }
    
    const me = await fetch('/api/auth/me')
    
    if (me.ok) {
      const data = await me.json()
      setUser(data.user || null)
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
