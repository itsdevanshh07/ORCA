'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Project {
  id: string
  name: string
  status: 'Active' | 'Paused' | 'Archived'
  dateCreated: string
  apiKey: string
}

function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return apiKey
  return apiKey.slice(0, 8) + '•'.repeat(Math.min(10, apiKey.length - 8))
}

export function ProjectWorkspacesDashboard() {
  const router = useRouter() 
  
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [actionError, setActionError] = useState('')

  const redirectToLogin = () => {
    localStorage.removeItem('orca_token')
    router.replace('/login')
  }

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("orca_token")
        if (!token) {
          redirectToLogin()
          return
        }
        const baseUrl = process.env.NEXT_PUBLIC_API_URL
        if (!baseUrl) throw new Error('The API URL is not configured.')

        const response = await fetch(`${baseUrl}/api/projects`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.status === 401) {
          redirectToLogin()
          return
        }
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.error || 'Could not load projects.')
        setProjects(Array.isArray(result.data) ? result.data : [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch projects')
        setProjects([])
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const handleCopyApiKey = async (e: React.MouseEvent, projectId: string, apiKey: string) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopiedId(projectId)
      setTimeout(() => setCopiedId(null), 2000)
      setActionError('')
    } catch {
      setActionError('Could not copy the API key. Check browser clipboard permissions.')
    }
  }

  const handleRowClick = (projectId: string) => {
    setSelectedProject(projectId)
    router.push(`/dashboard/${projectId}`)
  }

  const handleCreateProject = async () => {
    if (!projectName.trim()) return

    try {
      setIsCreating(true)
      const token = localStorage.getItem("orca_token")
      if (!token) {
        redirectToLogin()
        return
      }
      const baseUrl = process.env.NEXT_PUBLIC_API_URL
      if (!baseUrl) throw new Error('The API URL is not configured.')

      const response = await fetch(`${baseUrl}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: projectName }),
      });

      if (response.status === 401) {
        redirectToLogin()
        return
      }
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Could not create project.')
      if (!result.data?.id || !result.data?.apiKey) throw new Error('The API returned an incomplete project.')

      setProjects((current) => [...current, result.data])
      setActionError('')
      setProjectName('')
      setIsModalOpen(false)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not create project.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateProject()
    } else if (e.key === 'Escape') {
      setIsModalOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-950 text-balance">
                Project Workspaces
              </h1>
              <p className="text-zinc-500 mt-1 text-sm">
                Manage your projects and API integrations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 bg-black hover:bg-zinc-900 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Project
              </button>
              <button
                onClick={redirectToLogin}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {actionError && <p role="alert" className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
        {/* Projects Card */}
        <div className="bg-white rounded-lg border border-zinc-200 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-8 bg-zinc-50 border-b border-zinc-200 px-6 py-3">
            <div>
              <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                Project
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                Status
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                Created
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                API Key
              </p>
            </div>
          </div>

          {/* Project Rows */}
          <div className="divide-y divide-zinc-100">
            {projects.map((project) => (
              <div
                key={project.id}
                role="link"
                tabIndex={0}
                aria-label={`Open ${project.name} dashboard`}
                onClick={() => handleRowClick(project.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    handleRowClick(project.id)
                  }
                }}
                className={`group cursor-pointer transition-colors duration-150 ${
                  selectedProject === project.id
                    ? 'bg-zinc-100'
                    : 'hover:bg-zinc-50'
                }`}
              >
                <div className="grid grid-cols-4 gap-8 items-center px-6 py-3">
                  {/* Project Name */}
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-950 truncate text-sm">
                      {project.name}
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50">
                      <div className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span className="text-xs font-medium text-emerald-700">
                        {project.status}
                      </span>
                    </div>
                  </div>

                  {/* Date Created */}
                  <div>
                    <p className="text-sm text-zinc-600">
                      {project.dateCreated}
                    </p>
                  </div>

                  {/* API Key */}
                  <div className="flex items-center gap-2 justify-end">
                    <code className="text-xs font-mono text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded font-medium">
                      {maskApiKey(project.apiKey)}
                    </code>
                    <button
                      onClick={(e) =>
                        handleCopyApiKey(e, project.id, project.apiKey)
                      }
                      className="p-1.5 hover:bg-zinc-200 rounded transition-colors opacity-0 group-hover:opacity-100"
                      aria-label="Copy API key"
                      title="Copy full API key"
                    >
                      {copiedId === project.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-zinc-500" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-16">
              <p className="text-zinc-500 text-sm">Loading projects...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-16">
              <p className="text-red-600 mb-4 text-sm">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 bg-black hover:bg-zinc-900 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && projects.length === 0 && (
            <div className="text-center py-16">
              <p className="text-zinc-500 mb-4 text-sm">No projects yet</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 bg-black hover:bg-zinc-900 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Create your first project
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Backdrop */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsModalOpen(false)}
        />
      )}

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-zinc-950">
                Create Project
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-zinc-100 rounded transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6">
              <div>
                <label
                  htmlFor="project-name"
                  className="block text-sm font-medium text-zinc-950 mb-2"
                >
                  Project Name
                </label>
                <input
                  id="project-name"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., Mobile App Backend"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center gap-3 border-t border-zinc-200 px-6 py-4 justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!projectName.trim() || isCreating}
                className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-zinc-900 disabled:bg-zinc-400 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isCreating ? 'Creating...' : 'Generate Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
