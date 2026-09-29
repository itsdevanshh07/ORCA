"use client"

import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState, Fragment } from "react"
import { Hexagon, X } from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

type TimeframeOption = {
  label: string
  value: number
  unit: "hour" | "day" | "minute"
}

type HealingStatus = "AUTO_PATCHED" | "REJECTED_BY_DEV" | "CACHED_PATCH"

type HealingRecord = {
  id: string
  timestamp: string
  workspace: string
  endpoint: string
  driftSignature: string
  status: HealingStatus
  detectedDrift: string
  healedPayload: object
}

const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  { label: "5 minutes", value: 5, unit: "minute" },
  { label: "1 hour", value: 1, unit: "hour" },
  { label: "6 hours", value: 6, unit: "hour" },
  { label: "12 hours", value: 12, unit: "hour" },
  { label: "1 day", value: 1, unit: "day" },
  { label: "7 days", value: 7, unit: "day" },
  { label: "30 days", value: 30, unit: "day" },
]

function Header({ 
  projectName,
  selectedTimeframe, 
  onTimeframeChange,
  onLogout,
}: { 
  projectName: string
  selectedTimeframe: TimeframeOption
  onTimeframeChange: (tf: TimeframeOption) => void
  onLogout: () => void
}) {
  return (
    <header className="border-b border-zinc-200 px-6 py-4 flex items-center justify-between bg-white">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Hexagon className="h-8 w-8 text-zinc-900" strokeWidth={1.5} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 bg-zinc-900 rounded-full" />
          </div>
        </div>
        <div>
          <h1 className="text-lg font-medium tracking-tight text-zinc-900 uppercase">
            O.R.C.A. <span className="text-zinc-400">//</span> {projectName}
          </h1>
          <p className="text-xs text-zinc-500 font-mono tracking-wider">SYSTEM OPERATIONS</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        {TIMEFRAME_OPTIONS.map((option) => (
          <button
            key={option.label}
            onClick={() => onTimeframeChange(option)}
            className={`text-xs uppercase tracking-wider transition-colors ${
              selectedTimeframe.label === option.label
                ? "text-zinc-900 font-bold border-b-2 border-zinc-900 pb-1"
                : "text-zinc-400 hover:text-zinc-600 pb-1 border-b-2 border-transparent"
            }`}
          >
            {option.label}
          </button>
        ))}
        <button onClick={onLogout} className="text-xs font-medium text-zinc-600 hover:text-zinc-950">
          Log out
        </button>
      </div>
    </header>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-zinc-200 p-3 shadow-xl min-w-[150px]">
        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-3 border-b border-zinc-100 pb-2">
          {new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="font-medium text-zinc-600">{entry.name}</span>
              </div>
              <span className="font-bold text-zinc-900 font-mono">
                {entry.value}{entry.name.toLowerCase().includes("latency") ? "ms" : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null;
}

function OverallLatencyChart({ data, domain }: { data: any[], domain: any[] }) {
  return (
    <div className="border border-zinc-200 bg-white">
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest">System Latency</h3>
        <span className="text-[10px] font-medium text-zinc-400 bg-zinc-100 px-2 py-1 rounded">P99/MEDIAN</span>
      </div>
      <div className="p-4 pt-6">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#18181b" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#18181b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
            <XAxis 
              dataKey="timestamp" 
              type="number"        
              domain={domain} 
              allowDataOverflow={true}      
              tickFormatter={(unix) => new Date(unix).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tickMargin={12}
              minTickGap={60}
            />
            <YAxis 
              stroke="#a1a1aa" 
              tick={{ fill: "#a1a1aa", fontSize: 10 }} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(v) => `${v}ms`}
              tickMargin={10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e4e4e7', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area 
              type="monotone" // Smooths the jagged edges into a flowing curve
              name="Latency"
              dataKey="latency" 
              stroke="#18181b" 
              strokeWidth={2} 
              fill="url(#latencyGradient)" 
              activeDot={{ r: 4, strokeWidth: 0, fill: '#18181b' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ErrorChart({ data, domain }: { data: any[], domain: any[] }) {
  return (
    <div className="border border-zinc-200 bg-white">
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest">AI Interventions</h3>
        <span className="text-[10px] font-medium text-zinc-400 bg-zinc-100 px-2 py-1 rounded">COUNT</span>
      </div>
      <div className="p-4 pt-6">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
            <XAxis 
              dataKey="timestamp" 
              type="number"       
              domain={domain}  
              allowDataOverflow={true}     
              tickFormatter={(unix) => new Date(unix).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tickMargin={12}
              minTickGap={60}
            />
            <YAxis 
              tick={{ fill: "#a1a1aa", fontSize: 10 }} 
              tickLine={false} 
              axisLine={false} 
              tickMargin={10}
              allowDecimals={false} // Prevents Recharts from showing 0.5 interventions
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f4f4f5', opacity: 0.5 }} />
            <Legend 
              verticalAlign="top" 
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: '10px', paddingBottom: '20px', fontWeight: 600, color: '#71717a' }} 
            />
            <Bar dataKey="AI Surgery" fill="#18181b" stackId="a" maxBarSize={30} radius={[0, 0, 0, 0]} />
            <Bar dataKey="Cached Patch" fill="#a1a1aa" stackId="a" maxBarSize={30} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function HealingTable({ records, onRevert, revertingId }: { records: any[], onRevert: (id: string) => void, revertingId: string | null }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const displayRecords = useMemo(() => {
    return [...records].reverse().filter(r => 
      r.endpoint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.status?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [records, searchTerm])

  return (
    <div className="border border-zinc-200 bg-white overflow-hidden">
      <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center">
        <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-widest">Surgery Audit Log</h3>
        <input
          aria-label="Search surgery logs"
          type="text" 
          placeholder="Search logs..." 
          className="text-xs border border-zinc-200 px-3 py-2 w-64 focus:ring-1 focus:ring-zinc-900 outline-none rounded-none"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white shadow-sm z-10 border-b border-zinc-200">
            <tr>
              <th className="w-8 px-4 py-3"></th>
              <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Timestamp</th>
              <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Endpoint</th>
              <th className="px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {displayRecords.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-500">No healing records match this view.</td></tr>
            )}
            {displayRecords.map((record: any) => (
              <Fragment key={record.id}>
                <tr 
                  tabIndex={0}
                  role="button"
                  aria-expanded={expandedRow === record.id}
                  className={`cursor-pointer transition-colors ${expandedRow === record.id ? 'bg-zinc-50' : 'hover:bg-zinc-50/50'}`}
                  onClick={() => setExpandedRow(expandedRow === record.id ? null : record.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setExpandedRow(expandedRow === record.id ? null : record.id)
                    }
                  }}
                >
                  <td className="px-4 py-4 text-[10px] text-zinc-400">{expandedRow === record.id ? "▼" : "▶"}</td>
                  <td className="px-4 py-4 text-xs font-mono text-zinc-500">{new Date(record.timestamp).toLocaleTimeString()}</td>
                  <td className="px-4 py-4 text-xs font-bold text-zinc-900">{record.endpoint}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-[9px] font-bold uppercase border ${
                      record.status === 'AI_GENERATED_PATCH' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200'
                    }`}>
                      {record.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
                {expandedRow === record.id && (
                  <tr className="bg-zinc-50">
                    <td colSpan={4} className="px-8 py-6 border-t border-zinc-200">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-[9px] font-bold uppercase text-zinc-500 mb-2 tracking-widest">Detected Drift</h4>
                          <div className="p-3 bg-white border border-zinc-200 text-[11px] font-mono text-zinc-800 break-all">
                            {record.driftSignature || record.detectedDrift}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[9px] font-bold uppercase text-zinc-500 mb-2 tracking-widest">Healed Payload</h4>
                          <pre className="p-3 bg-zinc-900 border border-zinc-900 text-[11px] font-mono text-zinc-100 overflow-x-auto">
                            {JSON.stringify(record.healedPayload, null, 2)}
                          </pre>
                        </div>
                      </div>
                      <div className="mt-6 flex justify-end">
                        <button 
                          onClick={(event) => { event.stopPropagation(); onRevert(record.id) }}
                          disabled={record.status === 'REJECTED_BY_DEV' || revertingId === record.id}
                          className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 uppercase tracking-widest border border-zinc-300 px-4 py-2 hover:border-zinc-900 transition-all"
                        >
                          {record.status === 'REJECTED_BY_DEV' ? 'Reverted' : revertingId === record.id ? 'Reverting…' : 'Revert Surgery'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const params = useParams()
  const router = useRouter() 
  const projectId = String(params.projectId || '')
  const [stats, setStats] = useState<any>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>(TIMEFRAME_OPTIONS[5])
  const [healingRecords, setHealingRecords] = useState<any[]>([])
  const [liveTraffic, setLiveTraffic] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revertingId, setRevertingId] = useState<string | null>(null)
  const [healingDemoLoading, setHealingDemoLoading] = useState(false)
  const [healingDemoError, setHealingDemoError] = useState('')
  const [healingDemoResult, setHealingDemoResult] = useState('')

  const redirectToLogin = useCallback(() => {
    localStorage.removeItem('orca_token')
    router.replace('/login')
  }, [router])

  const fetchDashboardData = useCallback(async (showLoading = false) => {
    const token = localStorage.getItem('orca_token')
    if (!token) {
      redirectToLogin()
      return
    }
    if (!process.env.NEXT_PUBLIC_API_URL) {
      setError('The API URL is not configured.')
      setLoading(false)
      return
    }
    if (showLoading) setLoading(true)
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const baseUrl = process.env.NEXT_PUBLIC_API_URL
      const [metricsResponse, trafficResponse, statsResponse] = await Promise.all([
        fetch(`${baseUrl}/api/metrics?projectId=${encodeURIComponent(projectId)}`, { headers }),
        fetch(`${baseUrl}/api/orca/traffic`, { headers }),
        fetch(`${baseUrl}/api/orca/stats?projectId=${encodeURIComponent(projectId)}`, { headers }),
      ])
      if ([metricsResponse, trafficResponse, statsResponse].some((response) => response.status === 401)) {
        redirectToLogin()
        return
      }
      const [metrics, traffic, projectStats] = await Promise.all([
        metricsResponse.json().catch(() => ({})),
        trafficResponse.json().catch(() => ({})),
        statsResponse.json().catch(() => ({})),
      ])
      if (!metricsResponse.ok || !trafficResponse.ok || !statsResponse.ok) {
        throw new Error(metrics.error || traffic.error || projectStats.error || 'Could not load dashboard data.')
      }
      if (!Array.isArray(metrics) || !Array.isArray(traffic) || !projectStats.projectName) {
        throw new Error(projectStats.error || 'The project dashboard data is unavailable.')
      }
      setHealingRecords(metrics)
      setLiveTraffic(traffic)
      setStats(projectStats)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [projectId, redirectToLogin])

  useEffect(() => {
    if (!projectId) return
    void fetchDashboardData(true)
    const interval = window.setInterval(() => void fetchDashboardData(), 10_000)
    return () => window.clearInterval(interval)
  }, [projectId, fetchDashboardData])

  const handleRevert = async (id: string) => {
    const token = localStorage.getItem('orca_token')
    if (!token) return redirectToLogin()
    setRevertingId(id)
    setError('')
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!baseUrl) throw new Error('The API URL is not configured.')
      const response = await fetch(`${baseUrl}/api/surgeries/${id}/revert`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.status === 401) return redirectToLogin()
      if (response.ok) {
        setHealingRecords((records) => records.map((r) => (r.id === id ? { ...r, status: "REJECTED_BY_DEV" } : r)))
      } else {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || 'Could not revert this surgery.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not revert this surgery.')
    } finally {
      setRevertingId(null)
    }
  }

  const runHealingDemo = async () => {
    const token = localStorage.getItem('orca_token')
    if (!token) return redirectToLogin()
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    if (!baseUrl) {
      setHealingDemoError('The API URL is not configured.')
      return
    }

    setHealingDemoLoading(true)
    setHealingDemoError('')
    setHealingDemoResult('')
    try {
      const projectsResponse = await fetch(`${baseUrl}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (projectsResponse.status === 401) return redirectToLogin()
      const projectsResult = await projectsResponse.json().catch(() => ({}))
      if (!projectsResponse.ok) {
        throw new Error(projectsResult.error || 'Could not load this project’s API key.')
      }
      const project = (Array.isArray(projectsResult.data) ? projectsResult.data : [])
        .find((item: any) => String(item.id) === projectId)
      if (!project?.apiKey) throw new Error('This project has no API key. Return to Project Workspaces and create a project key.')

      const response = await fetch(`${baseUrl}/posts/1`, {
        headers: { 'x-api-key': project.apiKey },
      })
      const responseBody = await response.text()
      if (!response.ok) {
        throw new Error(`The proxy returned HTTP ${response.status}. Check the API key and Render service logs.`)
      }
      setHealingDemoResult(responseBody)
      await fetchDashboardData()
    } catch (err) {
      setHealingDemoError(err instanceof Error ? err.message : 'The healing request failed.')
    } finally {
      setHealingDemoLoading(false)
    }
  }

  const chartDomain = useMemo(() => {
    const now = new Date().getTime()
    let multiplier = 3600000
    if (selectedTimeframe.unit === 'day') multiplier = 86400000
    if (selectedTimeframe.unit === 'minute') multiplier = 60000
    
    const startTime = now - (selectedTimeframe.value * multiplier)
    return [startTime, now]
  }, [selectedTimeframe])

  const realChartData = useMemo(() => {
    if (liveTraffic.length === 0 && healingRecords.length === 0) return []
    const buckets: Record<string, any> = {}
    const bucketSizeMs = 1000 

    liveTraffic.forEach((t) => {
      const bucketId = Math.floor(t.timestamp / bucketSizeMs) * bucketSizeMs
      if (!buckets[bucketId]) {
        buckets[bucketId] = { timestamp: bucketId, latency: 0, "AI Surgery": 0, "Cached Patch": 0 }
      }
      buckets[bucketId].latency = Math.max(buckets[bucketId].latency, t.latency || 12)
    })

    healingRecords.forEach((r) => {
      const time = new Date(r.timestamp).getTime()
      const bucketId = Math.floor(time / bucketSizeMs) * bucketSizeMs
      if (!buckets[bucketId]) {
        buckets[bucketId] = { timestamp: bucketId, latency: 0, "AI Surgery": 0, "Cached Patch": 0 }
      }

      if (r.status === "AI_GENERATED_PATCH") {
        buckets[bucketId]["AI Surgery"] += 1
      } else if (r.status === "CACHED_PATCH" || r.status === "AUTO_PATCHED") {
        buckets[bucketId]["Cached Patch"] += 1
      }

      if (r.latency) {
        buckets[bucketId].latency = Math.max(buckets[bucketId].latency, r.latency)
      }
    })

    const [startTime, endTime] = chartDomain;
    return Object.values(buckets)
      .filter(b => b.timestamp >= startTime && b.timestamp <= endTime)
      .sort((a, b) => a.timestamp - b.timestamp)
  }, [liveTraffic, healingRecords, chartDomain]) 

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <Header 
        projectName={stats?.projectName || "..."}
        selectedTimeframe={selectedTimeframe} 
        onTimeframeChange={setSelectedTimeframe}
        onLogout={redirectToLogin}
      />
      <main className="p-6 max-w-[1600px] mx-auto space-y-6">
        {loading && <p role="status" className="text-sm text-zinc-600">Loading dashboard…</p>}
        {error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <section className="border border-zinc-200 bg-white p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Try schema healing</h2>
            <p className="mt-1 text-sm text-zinc-600">Send a sample request through your project key. ORCA checks the downstream response, asks Gemini to repair schema drift, and records the result here.</p>
            <p className="mt-1 text-xs text-zinc-500">GET {process.env.NEXT_PUBLIC_API_URL || 'API_URL'}/posts/1</p>
          </div>
          <button onClick={runHealingDemo} disabled={healingDemoLoading} className="shrink-0 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-wait disabled:bg-zinc-400">
            {healingDemoLoading ? 'Sending request…' : 'Run healing check'}
          </button>
          {healingDemoError && <p role="alert" className="basis-full rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{healingDemoError}</p>}
          {healingDemoResult && <pre className="basis-full max-h-48 overflow-auto rounded bg-zinc-50 p-3 text-xs text-zinc-700">{healingDemoResult}</pre>}
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ErrorChart data={realChartData} domain={chartDomain} />
          <OverallLatencyChart data={realChartData} domain={chartDomain} />
        </div>
        <HealingTable records={healingRecords} onRevert={handleRevert} revertingId={revertingId} />
      </main>
    </div>
  )
}
