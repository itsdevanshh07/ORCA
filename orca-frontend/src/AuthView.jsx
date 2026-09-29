import { useState } from 'react'
import { ArrowLeft, ArrowRight, Lock, Mail, UserRound } from 'lucide-react'

const API_BASE = import.meta.env.NEXT_PUBLIC_API_URL || import.meta.env.VITE_API_URL || ''

export default function AuthView({ initialMode = 'login', onBack, onAuthenticated }) {
  const [mode, setMode] = useState(initialMode)
  const [fullName, setFullName] = useState('')
  const [identity, setIdentity] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const signup = mode === 'signup'
      const response = await fetch(`${API_BASE}/api/auth/${signup ? 'signup' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signup
          ? { fullName, email: identity, password }
          : { username: identity, password }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || typeof result.token !== 'string') {
        throw new Error(result.error || (signup ? 'Could not create the account.' : 'Invalid username/email or password.'))
      }
      localStorage.setItem('orca_token', result.token)
      onAuthenticated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect to the ORCA API.')
    } finally {
      setLoading(false)
    }
  }

  const signup = mode === 'signup'
  return (
    <main className="min-h-screen bg-navy-900 px-5 py-10 flex items-center justify-center">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/80 p-8 shadow-2xl">
        <button onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16} /> Back</button>
        <p className="text-sm font-semibold tracking-[0.25em] text-neon-blue">O.R.C.A.</p>
        <h1 className="mt-2 text-3xl font-bold text-white">{signup ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mt-2 text-sm text-slate-400">{signup ? 'Create an operations workspace and start monitoring schema health.' : 'Sign in to view your API workspaces and healing activity.'}</p>
        {error && <p role="alert" className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        <form onSubmit={submit} className="mt-6 space-y-4">
          {signup && <label className="block text-sm text-slate-300">Full name<div className="mt-2 flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3"><UserRound size={17} className="text-slate-500"/><input required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-transparent py-3 text-white outline-none" autoComplete="name"/></div></label>}
          <label className="block text-sm text-slate-300">{signup ? 'Email' : 'Email or username'}<div className="mt-2 flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3"><Mail size={17} className="text-slate-500"/><input required type={signup ? 'email' : 'text'} value={identity} onChange={e => setIdentity(e.target.value)} className="w-full bg-transparent py-3 text-white outline-none" autoComplete="username"/></div></label>
          <label className="block text-sm text-slate-300">Password<div className="mt-2 flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3"><Lock size={17} className="text-slate-500"/><input required minLength={signup ? 8 : undefined} type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-transparent py-3 text-white outline-none" autoComplete={signup ? 'new-password' : 'current-password'}/></div></label>
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 font-semibold text-navy-900 transition hover:bg-slate-200 disabled:opacity-60">{loading ? 'Please wait…' : signup ? 'Create account' : 'Sign in'} {!loading && <ArrowRight size={17}/>}</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">{signup ? 'Already have an account?' : 'New to ORCA?'} <button className="font-medium text-neon-blue hover:underline" onClick={() => { setError(''); setMode(signup ? 'login' : 'signup') }}>{signup ? 'Sign in' : 'Create account'}</button></p>
      </section>
    </main>
  )
}
