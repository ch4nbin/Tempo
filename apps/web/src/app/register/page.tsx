'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading: authLoading } = useAuth()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)

    try {
      await register(email, password, name)
      router.push('/') // Redirect to editor after registration
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-tempo-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-tempo-accent border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-tempo-bg flex items-center justify-center p-4">
      {/* Background gradient effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-tempo-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Tempo
          </h1>
          <p className="text-tempo-text-muted mt-2">
            Create your account
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-tempo-surface border border-tempo-border rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">
            Get started free
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-tempo-text-muted mb-2"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-tempo-bg border border-tempo-border rounded-lg px-4 py-3 text-white placeholder-tempo-text-muted/50 focus:outline-none focus:border-tempo-accent focus:ring-1 focus:ring-tempo-accent transition-colors"
                placeholder="Your name"
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-tempo-text-muted mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-tempo-bg border border-tempo-border rounded-lg px-4 py-3 text-white placeholder-tempo-text-muted/50 focus:outline-none focus:border-tempo-accent focus:ring-1 focus:ring-tempo-accent transition-colors"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-tempo-text-muted mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-tempo-bg border border-tempo-border rounded-lg px-4 py-3 text-white placeholder-tempo-text-muted/50 focus:outline-none focus:border-tempo-accent focus:ring-1 focus:ring-tempo-accent transition-colors"
                placeholder="••••••••"
                required
                autoComplete="new-password"
                minLength={8}
              />
              <p className="text-xs text-tempo-text-muted/50 mt-1">
                At least 8 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-tempo-text-muted mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-tempo-bg border border-tempo-border rounded-lg px-4 py-3 text-white placeholder-tempo-text-muted/50 focus:outline-none focus:border-tempo-accent focus:ring-1 focus:ring-tempo-accent transition-colors"
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-tempo-accent hover:bg-tempo-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-tempo-text-muted text-sm">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-tempo-accent hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Features list */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="text-tempo-text-muted/70">
            <div className="text-2xl mb-1">🎬</div>
            <div className="text-xs">GPU Effects</div>
          </div>
          <div className="text-tempo-text-muted/70">
            <div className="text-2xl mb-1">👥</div>
            <div className="text-xs">Collaborate</div>
          </div>
          <div className="text-tempo-text-muted/70">
            <div className="text-2xl mb-1">✨</div>
            <div className="text-xs">AI-Powered</div>
          </div>
        </div>
      </div>
    </div>
  )
}

