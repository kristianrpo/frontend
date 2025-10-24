import './globals.css'
import React from 'react'
import type { Metadata } from 'next'
import AuthProvider from './providers/AuthProvider'
import Navbar from './components/Navbar'

export const metadata: Metadata = {
  title: 'Carpeta Ciudadana ',
  description: 'Carpeta Ciudadana - Tu espacio digital seguro para gestionar, autenticar y compartir documentos oficiales'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <Navbar />
          <main>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
