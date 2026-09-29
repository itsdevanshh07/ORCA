import Link from 'next/link'
import { ArrowRight, Brain, Hexagon, Server, Shield } from 'lucide-react'

const capabilities = [
  {
    icon: Shield,
    title: 'Schema validation',
    description: 'Validate downstream JSON responses and detect schema drift.',
  },
  {
    icon: Brain,
    title: 'Healing with fallback',
    description: 'Try Gemini to map changed fields and preserve the source response if healing fails.',
  },
  {
    icon: Server,
    title: 'Project API keys',
    description: 'Create workspaces and use scoped keys to access the proxy route.',
  },
]

export default function OrcaLandingPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <nav className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold" aria-label="O.R.C.A. home">
          <Hexagon className="h-7 w-7" strokeWidth={1.5} />
          <span>O.R.C.A.</span>
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/login" className="text-sm hover:text-zinc-500">Sign in</Link>
          <Link href="/signup" className="inline-flex items-center rounded-full bg-zinc-900 px-5 py-2.5 text-sm text-white hover:bg-zinc-700">
            Create account <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-5xl px-6 py-24 text-center md:py-32">
        <p className="mb-5 text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">Operational Resilience &amp; Cloud Adaptation</p>
        <h1 className="text-balance text-5xl font-bold tracking-tight md:text-7xl">
          Resilient APIs. Autonomous healing.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">
          O.R.C.A. validates proxied JSON responses, detects schema drift, and can propose repairs while preserving the original response when a repair is unavailable.
        </p>
        <Link href="/signup" className="mt-9 inline-flex items-center rounded-full bg-zinc-900 px-7 py-3 text-white hover:bg-zinc-700">
          Get started <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-24 md:grid-cols-3">
        {capabilities.map(({ icon: Icon, title, description }) => (
          <article key={title} className="rounded-xl border border-zinc-200 p-6">
            <Icon className="mb-5 h-7 w-7" />
            <h2 className="mb-2 font-semibold">{title}</h2>
            <p className="text-sm leading-relaxed text-zinc-600">{description}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
