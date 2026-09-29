'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { AuthCard } from '@/components/auth-card'

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('') 

    try {
      if (!baseUrl) throw new Error('The API URL is not configured.')
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password: password }),
      });

      const data = await res.json().catch(() => ({}))
      if (res.ok && typeof data.token === 'string' && data.token.length > 0) {
        localStorage.setItem("orca_token", data.token);
        router.replace("/projects");
      } else {
        setError(data.error || "Invalid credentials. Please check your username and password.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot connect to the O.R.C.A. backend.");
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthCard
      title="O.R.C.A."
      subtitle="Sign in to your operations dashboard"
      footerText={
        <>
          Don't have an account?{' '}
          <Link href="/signup" className="text-zinc-700 hover:text-black font-medium transition-colors">
            Create one
          </Link>
        </>
      }
    >
      {/* Error Message Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-lg">
          {error}
        </div>
      )}

      {/* Sign In Form */}
      <form onSubmit={handleSignIn} className="space-y-4 mb-6">
        {/* Email/Username Input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-900 mb-2">
            Email or Username
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
            <input
              id="email"
              type="text" 
              placeholder="John Doe"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-900 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Sign In Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-black text-white font-medium py-2.5 rounded-lg hover:bg-zinc-800 active:bg-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

    </AuthCard>
  )
}
