import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tempo',
  description: 'Real-time collaborative video editor with temporal distortion effects',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-tempo-bg text-tempo-text min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

