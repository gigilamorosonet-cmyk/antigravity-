import React, { useState } from 'react'
import { DndContext, DragEndEvent, DragStartEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, AlertCircle } from 'lucide-react'
import { useObjectiveStore } from '../../lib/stores/useObjectiveStore'
import { useAgentStore } from '../../lib/stores/useAgentStore'

interface ObjectiveCardProps {
  objective: {
    id: string
    content: string
    description?: string
    assignedTo?: string
    status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'delegated'
    priority: 'low' | 'medium' | 'high' | 'urgent'
  }
}

const PriorityBadge = ({ priority }: { priority: string }) => {
  const colors = {
    low: 'bg-green-500/20 text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-orange-500/20 text-orange-400',
    urgent: 'bg-red-500/20 text-red-400'
  }
  
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colors[priority as keyof typeof colors]}`}>
      {priority}
    </span>
  )
}

const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    pending: { label: 'En attente', color: 'bg-gray-500/20 text-gray-400' },
    'in-progress': { label: 'En cours', color: 'bg-blue-500/20 text-blue-400' },
    completed: { label: 'Terminé', color: 'bg-green-500/20 text-green-400' },
    failed: { label: 'Échoué', color: 'bg-red-500/20 text-red-400' },
    delegated: { label: 'Délégué', color: 'bg-purple-500/20 text-purple-400' }
  }
  
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${config[status as keyof typeof config].color}`}>
      {config[status as keyof typeof config].label}
    </span>
  )
}

export const ObjectiveCard: React.FC<ObjectiveCardProps> = ({ objective }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: objective.id
  })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="glass p-4 rounded-lg border border-white/10 hover:border-neon-blue/30 transition-all cursor-move group"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm text-neon-blue line-clamp-2">
          {objective.content}
        </h4>
        <PriorityBadge priority={objective.priority} />
      </div>
      
      {objective.description && (
        <p className="text-xs text-white/60 mt-2 line-clamp-2">
          {objective.description}
        </p>
      )}
      
      <div className="flex items-center justify-between mt-3">
        <StatusBadge status={objective.status} />
        {objective.assignedTo && (
          <span className="text-xs text-white/40">
            → {objective.assignedTo}
          </span>
        )}
      </div>
    </div>
  )
}

export const ObjectiveBoard = () => {
  const { objectives, addObjective, assignObjective } = useObjectiveStore()
  const { agents } = useAgentStore()
  const [newObjective, setNewObjective] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }
  
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      // Dropped on an agent column
      const agentId = over.id as string
      assignObjective(active.id as string, agentId)
    }
  }
  
  const pendingObjectives = objectives.filter(obj => 
    obj.status === 'pending' || obj.status === 'delegated'
  )
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display text-neon-purple">Objective Board</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="glass px-4 py-2 rounded-lg border border-neon-blue/30 hover:border-neon-blue/50 transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouvel objectif
        </button>
      </div>
      
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass p-4 rounded-lg mb-4 border border-neon-blue/20"
          >
            <input
              type="text"
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              placeholder="Quel est l'objectif ?"
              className="w-full bg-transparent border-b border-white/20 pb-2 text-lg outline-none focus:border-neon-blue/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newObjective.trim()) {
                  addObjective(newObjective.trim())
                  setNewObjective('')
                  setShowAddForm(false)
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const agentObjectives = objectives.filter(obj => obj.assignedTo === agent.id)
            
            return (
              <div
                key={agent.id}
                id={agent.id}
                className="glass rounded-xl p-4 min-h-[400px] border border-white/10"
              >
                <AgentColumnHeader agent={agent} />
                
                <SortableContext items={agentObjectives.map(o => o.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3 mt-4">
                    {agentObjectives.map((obj) => (
                      <ObjectiveCard key={obj.id} objective={obj} />
                    ))}
                  </div>
                </SortableContext>
                
                {agentObjectives.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <AlertCircle className="h-8 w-8 text-white/20 mb-2" />
                    <p className="text-sm text-white/40">Aucun objectif</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </DndContext>
    </div>
  )
}

const AgentColumnHeader = ({ agent }: { agent: any }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500'
      case 'requires_config': return 'bg-yellow-500'
      default: return 'bg-red-500'
    }
  }
  
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="text-2xl">{agent.icon || '🤖'}</div>
      <div>
        <h3 className="font-display font-semibold">{agent.name}</h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
          <span className="text-xs text-white/60 capitalize">{agent.status}</span>
        </div>
      </div>
    </div>
  )
}