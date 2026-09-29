'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, User, Chrome, ArrowRight } from 'lucide-react'
import { AuthCard } from '@/components/auth-card'

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

export default function SignupPage() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)
    
    try {
        const res = await fetch(`${baseUrl}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, email, password }),
        });

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem("orca_token", data.token)
        router.push("/projects")
      } else {
        setError(data.error || 'Failed to create account')
      }
    } catch (err) {
      setError('Failed to connect to the server. Is Spring Boot running?')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    // Simulate Google OAuth flow
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    console.log('Google sign up initiated')
  }

  return (
    <AuthCard
      title="O.R.C.A."
      subtitle="Create your operations dashboard account"
      footerText={
        <>
          Already have an account?{' '}
          <Link href="/login" className="text-zinc-700 hover:text-black font-medium transition-colors">
            Sign in
          </Link>
        </>
      }
    >
      {/* Sign Up Form */}
      <form onSubmit={handleSignUp} className="space-y-4 mb-6">
        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Full Name Input */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-zinc-900 mb-2">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
            <input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Email Input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-900 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
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
          <p className="text-xs text-zinc-500 mt-1">Minimum 8 characters</p>
        </div>

        {/* Confirm Password Input */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-900 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm text-zinc-900 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Sign Up Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-black text-white font-medium py-2.5 rounded-lg hover:bg-zinc-800 active:bg-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-white text-zinc-500">or continue with</span>
        </div>
      </div>

      {/* Google Sign Up Button */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 bg-white border border-zinc-200 text-zinc-900 font-medium py-2.5 rounded-lg hover:bg-zinc-50 active:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Chrome className="w-5 h-5" />
        <span>Sign up with Google</span>
      </button>
    </AuthCard>
  )
}
