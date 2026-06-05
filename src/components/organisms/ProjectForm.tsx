'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Clock, ChevronRight, Database, LayoutDashboard, Plus, Send, Trash2 } from 'lucide-react'
import { ArchitectureTree, type ArchitectureNode } from './ArchitectureTree'

export function ProjectForm() {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedNodes, setGeneratedNodes] = useState<ArchitectureNode[]>([])
  
  const [history, setHistory] = useState<any[]>([])
  const [isFetchingHistory, setIsFetchingHistory] = useState(true)
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null) // Track currently viewed project

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history')
      const data = await res.json()
      if (Array.isArray(data)) setHistory(data)
    } catch (err) {
      console.error("Failed to fetch history")
    } finally {
      setIsFetchingHistory(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const loadPastProject = async (projectId: string) => {
    setLoadingProjectId(projectId)
    setActiveProjectId(projectId)
    setError(null)
    setGeneratedNodes([]) 

    try {
      const res = await fetch(`/api/history/${projectId}`)
      if (!res.ok) throw new Error('Failed to load project')
      const nodes = await res.json()
      setGeneratedNodes(nodes) 
    } catch (err) {
      setError("Could not load past architecture.")
    } finally {
      setLoadingProjectId(null)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault() 
    if (!prompt.trim()) return

    setIsLoading(true)
    setError(null)
    setGeneratedNodes([])

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) throw new Error('Failed to generate architecture plan')

      const object = await response.json()
      setGeneratedNodes(object) 
      setPrompt('') 
      fetchHistory() 
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const startNewProject = () => {
    setGeneratedNodes([])
    setPrompt('')
    setLoadingProjectId(null)
    setActiveProjectId(null)
    setError(null)
  }

  // NEW: Project Deletion Logic
  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation() // Prevent loading the project when clicking the trash can
    if (!window.confirm("Delete this entire project and all its nodes?")) return

    // 1. Optimistic UI update (instantly remove from sidebar)
    setHistory(prev => prev.filter(p => p.id !== id))
    
    // If we are currently viewing the project we just deleted, clear the screen!
    if (activeProjectId === id) {
      startNewProject()
    }

    // 2. Background Database Sync
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' })
    } catch (err) {
      console.error("Failed to delete project")
      fetchHistory() // Revert if it fails
    }
  }

  return (
    <div className="flex w-full h-full overflow-hidden bg-zinc-950 border-t border-zinc-900">
      
      {/* LEFT SIDEBAR */}
      <div className="w-64 md:w-72 flex-shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full">
        <div className="p-3 border-b border-zinc-800">
          <Button 
            onClick={startNewProject}
            className="w-full justify-start gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Architecture
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isFetchingHistory ? (
            <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 text-zinc-600 animate-spin" /></div>
          ) : history.length === 0 ? (
             <div className="p-8 text-center text-xs text-zinc-600 font-medium">
               No past architectures
             </div>
          ) : (
            history.map(project => (
              // Changed from <button> to <div> so we can nest a delete button inside safely
              <div
                key={project.id}
                className={`w-full flex items-center justify-between p-2 rounded-lg transition-all group ${
                  activeProjectId === project.id ? 'bg-zinc-800/80' : 'hover:bg-zinc-900'
                }`}
              >
                <button 
                  onClick={() => loadPastProject(project.id)}
                  disabled={loadingProjectId === project.id}
                  className="flex-1 text-left truncate pr-2"
                >
                  <span className="text-sm font-medium text-zinc-300 block truncate capitalize">
                    {project.title}
                  </span>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-500 uppercase tracking-wider">
                    <Clock className="w-3 h-3" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>
                </button>
                
                {loadingProjectId === project.id ? (
                  <Loader2 className="w-4 h-4 text-emerald-500 animate-spin flex-shrink-0 mr-2" />
                ) : (
                  <button 
                    onClick={(e) => handleDeleteProject(e, project.id)}
                    className="p-1.5 text-zinc-600 hover:text-rose-400 hover:bg-zinc-800 rounded-md transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT WORKSPACE */}
      <div className="flex-1 flex flex-col h-full relative bg-[#0a0a0a]">
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-40">
          {generatedNodes.length === 0 && !isLoading && !loadingProjectId ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-lg mx-auto opacity-80 animate-in fade-in duration-700">
              <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl">
                <LayoutDashboard className="w-10 h-10 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-semibold text-zinc-200 tracking-tight">What are we building today?</h1>
              <p className="text-zinc-500 text-sm">Describe a frontend feature or full application, and I will scaffold a complete atomic React architecture.</p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <ArchitectureTree nodes={generatedNodes} />
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent pt-10 pb-6 px-4 md:px-8">
          <div className="max-w-3xl mx-auto space-y-2">
            {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}
            
            <form 
              onSubmit={handleGenerate} 
              className="relative flex items-end gap-2 bg-zinc-900/80 backdrop-blur-md border border-zinc-700 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50 rounded-2xl shadow-2xl p-2 transition-all"
            >
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (prompt.trim() && !isLoading) handleGenerate(e);
                  }
                }}
                disabled={isLoading}
                className="w-full max-h-48 min-h-[52px] p-3 bg-transparent text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none resize-none disabled:opacity-50"
                placeholder="e.g., Build a micro-frontend cloud console dashboard..."
              />
              
              <Button 
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="rounded-xl h-[42px] w-[42px] p-0 flex-shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
              </Button>
            </form>
            <p className="text-center text-[10px] text-zinc-600">
              AI-generated architectures can make mistakes. Always verify the hierarchy.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}