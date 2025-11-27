'use client'

// =============================================================================
// Providers - Client-side context providers
// =============================================================================
// Next.js 13+ App Router uses Server Components by default.
// Context providers need to be Client Components ('use client').
// This wrapper keeps the layout.tsx as a Server Component while
// providing all necessary React context.
// =============================================================================

import { ReactNode } from 'react'
import { AuthProvider } from '@/context/AuthContext'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

