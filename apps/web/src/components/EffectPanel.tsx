'use client'

import { useState } from 'react'

interface Effect {
  id: string
  name: string
  icon: string
  description: string
}

const EFFECTS: Effect[] = [
  { id: 'time-smear', name: 'Time Smear', icon: '◐', description: 'Motion trails that linger and fade' },
  { id: 'echo-cascade', name: 'Echo Cascade', icon: '◷', description: 'Recursive ghost copies' },
  { id: 'liquid-time', name: 'Liquid Time', icon: '≋', description: 'Regions move at different speeds' },
  { id: 'temporal-glitch', name: 'Temporal Glitch', icon: '⚡', description: 'Frames bleed through time' },
  { id: 'breath-sync', name: 'Breath Sync', icon: '◉', description: 'Video pulses rhythmically' },
  { id: 'memory-fade', name: 'Memory Fade', icon: '◌', description: 'Older frames desaturate' },
]

interface EffectPanelProps {
  selectedEffect: string | null
  onSelectEffect: (effectId: string | null) => void
  onAIGenerate: (prompt: string) => void
}

export function EffectPanel({ selectedEffect, onSelectEffect, onAIGenerate }: EffectPanelProps) {
  const [aiPrompt, setAiPrompt] = useState('')

  const handleEffectClick = (effectId: string) => {
    if (selectedEffect === effectId) {
      onSelectEffect(null) // Deselect if already selected
    } else {
      onSelectEffect(effectId)
    }
  }

  const handleAISubmit = () => {
    if (aiPrompt.trim()) {
      onAIGenerate(aiPrompt.trim())
      setAiPrompt('')
    }
  }

  return (
    <aside className="w-64 border-r border-tempo-border bg-tempo-surface/30 p-4 flex flex-col">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-tempo-text-muted mb-4">
        Effects
      </h2>

      <div className="space-y-2 flex-1">
        {EFFECTS.map((effect) => {
          const isSelected = selectedEffect === effect.id
          const isAvailable = effect.id === 'time-smear' // Only Time Smear works for now
          
          return (
            <button
              key={effect.id}
              onClick={() => isAvailable && handleEffectClick(effect.id)}
              disabled={!isAvailable}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left group
                ${isSelected 
                  ? 'bg-tempo-accent/20 border-tempo-accent text-tempo-text' 
                  : 'bg-tempo-surface border-transparent hover:bg-tempo-border/50 hover:border-tempo-border'
                }
                ${!isAvailable ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className={`text-lg transition-opacity ${isSelected ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                {effect.icon}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-sm block">{effect.name}</span>
                {isSelected && (
                  <span className="text-xs text-tempo-text-muted block truncate">
                    {effect.description}
                  </span>
                )}
              </div>
              {isSelected && (
                <span className="w-2 h-2 rounded-full bg-tempo-accent animate-pulse" />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-tempo-border">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-tempo-text-muted mb-3">
          AI Generate
        </h2>
        <div className="relative">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAISubmit()}
            placeholder="Describe a mood..."
            className="w-full px-3 py-2 text-sm bg-tempo-bg border border-tempo-border rounded-lg placeholder:text-tempo-text-muted focus:outline-none focus:border-tempo-accent focus:ring-1 focus:ring-tempo-accent/50 transition-all pr-10"
          />
          <button
            onClick={handleAISubmit}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-tempo-accent hover:text-white transition-colors p-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-tempo-text-muted mt-2 opacity-60">
          Coming soon: AI-powered effect generation
        </p>
      </div>
    </aside>
  )
}

