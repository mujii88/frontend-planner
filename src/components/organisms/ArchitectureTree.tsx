'use client'

import { useState, useMemo, useEffect } from 'react'
import { LayoutTemplate, Box, Component, FileCode, Workflow, Database, ChevronDown, ChevronRight, Pencil, Trash2, Check, X } from 'lucide-react'

export type ArchitectureNode = {
  id?: string
  parent_id?: string | null
  type: 'page' | 'organism' | 'molecule' | 'atom' | 'hook' | 'context'
  name: string
  description: string
  content?: any
  children?: ArchitectureNode[]
}

const typeMap = {
  page: { icon: LayoutTemplate, color: 'text-blue-400', border: 'border-blue-400/20', bg: 'bg-blue-400/10' },
  organism: { icon: Box, color: 'text-emerald-400', border: 'border-emerald-400/20', bg: 'bg-emerald-400/10' },
  molecule: { icon: Component, color: 'text-amber-400', border: 'border-amber-400/20', bg: 'bg-amber-400/10' },
  atom: { icon: FileCode, color: 'text-rose-400', border: 'border-rose-400/20', bg: 'bg-rose-400/10' },
  hook: { icon: Workflow, color: 'text-purple-400', border: 'border-purple-400/20', bg: 'bg-purple-400/10' },
  context: { icon: Database, color: 'text-cyan-400', border: 'border-cyan-400/20', bg: 'bg-cyan-400/10' },
}

// 1. Recursive Node Component with Edit State
function TreeNode({ 
  node, 
  onUpdate, 
  onDelete 
}: { 
  node: ArchitectureNode, 
  onUpdate: (id: string, updates: Partial<ArchitectureNode>) => void,
  onDelete: (id: string) => void
}) {
  const [isOpen, setIsOpen] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(node.name)
  const [editDesc, setEditDesc] = useState(node.description)

  const style = typeMap[node.type] || typeMap.page
  const Icon = style.icon
  const hasChildren = node.children && node.children.length > 0

  const handleSave = () => {
    if (node.id) onUpdate(node.id, { name: editName, description: editDesc })
    setIsEditing(false)
  }

  return (
    <div className="w-full flex flex-col">
      <div className={`group p-3 rounded-xl border bg-zinc-900/40 hover:bg-zinc-900/80 transition-colors flex items-start gap-3 ${style.border}`}>
        
        <button onClick={() => setIsOpen(!isOpen)} disabled={!hasChildren} className={`mt-1.5 flex-shrink-0 ${hasChildren ? 'cursor-pointer hover:text-zinc-100' : 'opacity-0'} text-zinc-500`}>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <div className={`p-2 flex-shrink-0 rounded-lg ${style.bg} ${style.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        
        <div className="flex-1 space-y-1">
          {isEditing ? (
            <div className="space-y-2 pr-4">
              <input 
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
              <input 
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-400 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex gap-2">
                <button onClick={handleSave} className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"><Check className="w-4 h-4" /></button>
                <button onClick={() => setIsEditing(false)} className="p-1 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700"><X className="w-4 h-4" /></button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-zinc-100">{node.name}</h4>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.bg} ${style.color}`}>
                  {node.type}
                </span>
              </div>
              <p className="text-xs text-zinc-400">{node.description}</p>
            </>
          )}
        </div>

        {/* Action Buttons (Visible on Hover) */}
        {!isEditing && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <button onClick={() => setIsEditing(true)} className="p-1.5 text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800 rounded-md transition-colors">
              <Pencil className="w-4 h-4" />
            </button>
            <button 
              onClick={() => { if(window.confirm(`Delete ${node.name} and all its children?`)) { node.id && onDelete(node.id) } }} 
              className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Render Children Recursively */}
      {isOpen && hasChildren && (
        <div className="ml-5 pl-4 border-l border-zinc-800 mt-2 space-y-2">
          {node.children!.map((child, idx) => (
            <TreeNode key={child.id || `${child.name}-${idx}`} node={child} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

// 2. The Main Wrapper
export function ArchitectureTree({ nodes }: { nodes: ArchitectureNode[] }) {
  // Create a local copy of the nodes so we can edit/delete them instantly without refreshing the page
  const [localNodes, setLocalNodes] = useState<ArchitectureNode[]>(nodes)

  // Sync local state if the user clicks a different project in the sidebar
  useEffect(() => {
    setLocalNodes(nodes)
  }, [nodes])

  // Handle Updates
  const handleUpdate = async (id: string, updates: Partial<ArchitectureNode>) => {
    // 1. Optimistic UI Update (Instant)
    setLocalNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))
    // 2. Background Database Sync
    await fetch(`/api/nodes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
  }

  // Handle Deletions
  const handleDelete = async (id: string) => {
    // 1. Optimistic UI Update (Instant)
    setLocalNodes(prev => prev.filter(n => n.id !== id))
    // 2. Background Database Sync
    await fetch(`/api/nodes/${id}`, { method: 'DELETE' })
  }

  // Build the tree dynamically from local state
  const treeData = useMemo(() => {
    if (!localNodes || localNodes.length === 0) return []

    const buildTree = (items: ArchitectureNode[], parentId: string | null = null): ArchitectureNode[] => {
      return items
        .filter(item => (item.parent_id || null) === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id || undefined)
        }))
    }
    return buildTree(localNodes)
  }, [localNodes])

  if (treeData.length === 0) return null

  return (
    <div className="w-full mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <h3 className="text-lg font-semibold tracking-tight text-zinc-100">Generated Architecture</h3>
        <span className="text-xs font-medium text-zinc-500">{localNodes.length} Total Nodes</span>
      </div>
      
      <div className="space-y-3">
        {treeData.map((node, index) => (
          <TreeNode 
            key={node.id || index} 
            node={node} 
            onUpdate={handleUpdate} 
            onDelete={handleDelete} 
          />
        ))}
      </div>
    </div>
  )
}