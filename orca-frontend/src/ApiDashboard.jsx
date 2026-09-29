import { useCallback, useEffect, useState } from 'react'
import { Activity, ArrowLeft, CheckCircle2, ChevronDown, CircleAlert, KeyRound, Play, Plus, RefreshCw, RotateCcw, ShieldCheck, Zap } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const API_BASE = import.meta.env.NEXT_PUBLIC_API_URL || import.meta.env.VITE_API_URL || ''

async function api(path, token, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  })
  const data = await response.json().catch(() => ({}))
  if (response.status === 401) throw Object.assign(new Error('Your session expired. Please sign in again.'), { unauthorized: true })
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`)
  return data
}

export default function ApiDashboard({ onExit, onSignOut }) {
  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState('')
  const [metrics, setMetrics] = useState([])
  const [traffic, setTraffic] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [newName, setNewName] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [responseBody, setResponseBody] = useState('')

  const token = localStorage.getItem('orca_token')

  const loadProjects = useCallback(async () => {
    try {
      const result = await api('/api/projects', token)
      const list = Array.isArray(result.data) ? result.data : []
      setProjects(list)
      setProjectId(current => list.some(project => String(project.id) === current) ? current : String(list[0]?.id || ''))
      setError('')
    } catch (err) {
      if (err.unauthorized) return onSignOut()
      setError(err.message || 'Could not load projects.')
    } finally {
      setLoading(false)
    }
  }, [token, onSignOut])

  const loadProjectData = useCallback(async () => {
    if (!projectId) {
      setMetrics([])
      setStats(null)
      setTraffic([])
      return
    }
    try {
      const [records, projectStats, requests] = await Promise.all([
        api(`/api/metrics?projectId=${encodeURIComponent(projectId)}`, token),
        api(`/api/orca/stats?projectId=${encodeURIComponent(projectId)}`, token),
        api('/api/orca/traffic', token),
      ])
      setMetrics(Array.isArray(records) ? records : [])
      setStats(projectStats)
      setTraffic(Array.isArray(requests) ? requests : [])
      setError('')
    } catch (err) {
      if (err.unauthorized) return onSignOut()
      setError(err.message || 'Could not load the dashboard data.')
    }
  }, [projectId, token, onSignOut])

  useEffect(() => { void loadProjects() }, [loadProjects])
  useEffect(() => {
    void loadProjectData()
    if (!projectId) return undefined
    const timer = window.setInterval(() => void loadProjectData(), 10000)
    return () => window.clearInterval(timer)
  }, [projectId, loadProjectData])

  const createProject = async (event) => {
    event.preventDefault()
    if (!newName.trim()) return
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await api('/api/projects', token, { method: 'POST', body: JSON.stringify({ name: newName.trim() }) })
      const project = result.data
      setProjects(current => [...current, project])
      setProjectId(String(project.id))
      setNewName('')
      setNotice('Project created. Copy its API key below; requests to the ORCA proxy must include it.')
    } catch (err) {
      if (err.unauthorized) return onSignOut()
      setError(err.message || 'Could not create the project.')
    } finally { setBusy(false) }
  }

  const runHealing = async () => {
    const project = projects.find(item => String(item.id) === projectId)
    if (!project?.apiKey) return setError('Select or create a project first.')
    setBusy(true); setError(''); setNotice(''); setResponseBody('')
    try {
      const response = await fetch(`${API_BASE}/posts/1`, { headers: { 'x-api-key': project.apiKey } })
      const body = await response.text()
      if (!response.ok) throw new Error(`Proxy request failed (${response.status}). Check the API key and backend availability.`)
      setResponseBody(body)
      let parsed
      try { parsed = JSON.parse(body) } catch { parsed = null }
      setNotice(parsed?.heading ? 'Schema repair returned a response containing the expected heading field. Check the healing log below for AI or cache status.' : 'ORCA safely returned the downstream payload. If drift was detected but not repaired, check Gemini configuration and backend logs.')
      await loadProjectData()
    } catch (err) {
      setError(err.message || 'Could not reach the ORCA proxy. Check the API URL and CORS settings.')
    } finally { setBusy(false) }
  }

  const revert = async (record) => {
    setBusy(true); setError('')
    try {
      await api(`/api/surgeries/${record.id}/revert`, token, { method: 'POST' })
      setNotice('Repair reverted and its cached patch invalidated.')
      await loadProjectData()
    } catch (err) {
      if (err.unauthorized) return onSignOut()
      setError(err.message || 'Could not revert this repair.')
    } finally { setBusy(false) }
  }

  const selectedProject = projects.find(project => String(project.id) === projectId)
  const chartData = traffic.slice(0, 30).reverse().map(item => ({ time: new Date(item.timestamp).toLocaleTimeString(), latency: item.latency || 0 }))
  const healedCount = metrics.filter(record => record.status !== 'REJECTED_BY_DEV').length

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3"><div className="rounded-xl bg-slate-950 p-2 text-neon-blue"><ShieldCheck size={22}/></div><div><p className="font-bold">O.R.C.A. <span className="font-normal text-slate-400">/</span> Operations</p><p className="text-xs text-slate-500">Backend schema healing and API health</p></div></div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={onExit} className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"><ArrowLeft className="mr-1 inline" size={15}/>Home</button>
          <button onClick={onSignOut} className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Sign out</button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-4 p-3 sm:space-y-5 sm:p-5 md:p-8">
        {error && <div role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><CircleAlert size={18}/>{error}</div>}
        {notice && <div role="status" className="flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 size={18}/>{notice}</div>}
        <section className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="w-full min-w-0 sm:w-56"><label htmlFor="project-picker" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">Project workspace</label><div className="relative"><select id="project-picker" value={projectId} onChange={event => { setProjectId(event.target.value); setResponseBody('') }} className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-9 text-sm"><option value="">Choose a project</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-2.5 text-slate-500"/></div></div>
          <form onSubmit={createProject} className="flex w-full flex-1 flex-wrap gap-2 sm:w-auto sm:justify-end"><input value={newName} onChange={event => setNewName(event.target.value)} placeholder="New project name" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm sm:min-w-[180px] sm:flex-none"/><button disabled={busy || !newName.trim()} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"><Plus className="mr-1 inline" size={16}/>Create project</button></form>
        </section>
        {loading && <p role="status" className="text-sm text-slate-500">Loading your ORCA data…</p>}
        {!loading && projects.length === 0 && <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><KeyRound className="mx-auto mb-3 text-slate-400"/><h2 className="font-semibold">Create a project to get started</h2><p className="mt-1 text-sm text-slate-500">A project creates the API key required to call the healing proxy.</p></section>}
        {selectedProject && <>
          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"><Activity size={16}/>Healing events</div><p className="mt-3 text-3xl font-bold">{healedCount}</p><p className="mt-1 text-xs text-slate-500">Recorded for {selectedProject.name}</p></article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"><Zap size={16}/>Gateway</div><p className="mt-3 text-3xl font-bold">{stats?.status || '…'}</p><p className="mt-1 text-xs text-slate-500">Backend project status</p></article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"><RefreshCw size={16}/>Proxy requests</div><p className="mt-3 text-3xl font-bold">{traffic.length}</p><p className="mt-1 text-xs text-slate-500">Recent backend traffic samples</p></article>
          </section>
          <section className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><h2 className="font-semibold">Run a schema healing request</h2><p className="mt-1 max-w-2xl text-sm text-slate-500">The backend fetches JSONPlaceholder, detects that its <code>title</code> field does not match ORCA’s required <code>heading</code> schema, asks Gemini to repair it, validates the result, then returns it. The browser only calls the proxy.</p></div><button onClick={runHealing} disabled={busy} className="w-full shrink-0 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"><Play className="mr-2 inline" size={15}/>{busy ? 'Request running…' : 'Run healing test'}</button></div>
              <div className="mt-4 break-all rounded-lg bg-slate-950 p-3 text-xs text-slate-200"><span className="text-neon-blue">GET</span> {API_BASE || window.location.origin}/posts/1 <span className="ml-2 text-slate-500">x-api-key: project key sent securely in request header</span></div>
              {responseBody && <pre className="mt-4 max-h-64 overflow-auto rounded-lg bg-slate-100 p-4 text-xs text-slate-800">{responseBody}</pre>}
              {selectedProject.apiKey && <div className="mt-4 flex flex-wrap items-center gap-2"><code className="max-w-full break-all rounded bg-slate-100 px-3 py-2 text-xs">{showKey ? selectedProject.apiKey : `${selectedProject.apiKey.slice(0, 9)}••••••••••••`}</code><button onClick={() => setShowKey(value => !value)} className="rounded border border-slate-300 px-3 py-2 text-xs">{showKey ? 'Hide key' : 'Show API key'}</button><button onClick={() => navigator.clipboard.writeText(selectedProject.apiKey).then(() => setNotice('API key copied.')).catch(() => setError('Clipboard access was denied.'))} className="rounded border border-slate-300 px-3 py-2 text-xs">Copy key</button></div>}
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Backend request latency</h2><p className="mt-1 text-sm text-slate-500">Recent samples recorded by ORCA’s gateway.</p><div className="mt-4 h-52">{chartData.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="latencyFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00d9ff" stopOpacity={0.45}/><stop offset="100%" stopColor="#00d9ff" stopOpacity={0.02}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="time" hide/><YAxis width={40}/><Tooltip/><Area type="monotone" dataKey="latency" stroke="#0891b2" fill="url(#latencyFill)" name="Latency (ms)"/></AreaChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-slate-400">Run a proxy request to populate the chart.</div>}</div></article>
          </section>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4"><h2 className="font-semibold">Schema drift and healing history</h2><p className="mt-1 text-sm text-slate-500">Records written by the backend after a valid repair is applied.</p></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Time</th><th className="px-5 py-3">Endpoint</th><th className="px-5 py-3">Detected drift</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{metrics.length ? metrics.map(record => <tr key={record.id}><td className="whitespace-nowrap px-5 py-3">{record.timestamp ? new Date(record.timestamp).toLocaleString() : '—'}</td><td className="px-5 py-3 font-mono text-xs">{record.endpoint}</td><td className="max-w-md px-5 py-3 text-xs text-slate-600">{record.detectedDrift}</td><td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs ${record.status === 'REJECTED_BY_DEV' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{record.status}</span></td><td className="px-5 py-3"><button disabled={busy || record.status === 'REJECTED_BY_DEV'} onClick={() => revert(record)} className="rounded border border-slate-300 px-2.5 py-1.5 text-xs disabled:opacity-40"><RotateCcw className="mr-1 inline" size={13}/>Revert</button></td></tr>) : <tr><td colSpan="5" className="px-5 py-10 text-center text-slate-400">No healing records yet. Run the healing test above to exercise the backend.</td></tr>}</tbody></table></div>
          </section>
        </>}
      </main>
    </div>
  )
}
