'use client'

// =============================================================================
// Auth Context - Global Authentication State
// =============================================================================
// React Context is how you share state across many components without
// passing props through every level (called "prop drilling").
//
// This provides:
// - Current user information
// - Login/logout functions
// - Loading state while checking auth
// =============================================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import {
  User,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getMe,
  getAccessToken,
} from '@/lib/api-client'

// Define the shape of our auth context
interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

// Create the context with undefined default
// We'll throw an error if used outside provider
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component that wraps the app
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    async function checkAuth() {
      const token = getAccessToken()
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const userData = await getMe()
        setUser(userData)
      } catch (error) {
        // Token is invalid or expired
        console.error('Auth check failed:', error)
        apiLogout()
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiLogin(email, password)
    setUser(response.user)
  }, [])

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const response = await apiRegister(email, password, name)
      setUser(response.user)
    },
    []
  )

  const logout = useCallback(() => {
    apiLogout()
    setUser(null)
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook to use auth context
// Throws helpful error if used outside provider
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

