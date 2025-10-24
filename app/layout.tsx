import './globals.css'
import React from 'react'
import type { Metadata } from 'next'
import AuthProvider from './providers/AuthProvider'
import Navbar from './components/Navbar'

export const metadata: Metadata = {
  title: 'Next Auth Starter',
  description: 'Demo app with JWT auth stored in HttpOnly cookie'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen flex items-start p-8">
            <div className="container mx-auto">
              {children}
            </div>
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
