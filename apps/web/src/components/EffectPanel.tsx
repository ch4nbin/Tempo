'use client'

import { useState } from 'react'
import { generateEffect, type GeneratedEffect } from '@/lib/api'

interface Effect {
  id: string
  name: string
  icon: string
  description: string
  available: boolean
}

const EFFECTS: Effect[] = [
  { id: 'time-smear', name: 'Time Smear', icon: '◐', description: 'Motion trails that linger and fade', available: true },
  { id: 'echo-cascade', name: 'Echo Cascade', icon: '◷', description: 'Recursive ghost copies', available: true },
  { id: 'liquid-time', name: 'Liquid Time', icon: '≋', description: 'Wavy time distortion', available: true },
  { id: 'temporal-glitch', name: 'Temporal Glitch', icon: '⚡', description: 'RGB split & slice displacement', available: true },
  { id: 'breath-sync', name: 'Breath Sync', icon: '◉', description: 'Rhythmic pulsing effect', available: true },
  { id: 'memory-fade', name: 'Memory Fade', icon: '◌', description: 'Desaturate & blur over time', available: true },
]

const COMING_SOON_EFFECTS = [
  { name: 'Datamosh', icon: '▦', description: 'Compression artifact art' },
  { name: 'Time Reverb', icon: '◀◀', description: 'Audio-reactive time loops' },
  { name: 'Fractal Echo', icon: '❋', description: 'Self-similar recursive patterns' },
]

interface EffectPanelProps {
  selectedEffect: string | null
  onSelectEffect: (effectId: string | null) => void
  onAIGenerate: (prompt: string, effects: GeneratedEffect[]) => void
}

export function EffectPanel({ selectedEffect, onSelectEffect, onAIGenerate }: EffectPanelProps) {
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiResult, setAiResult] = useState<{ effects: GeneratedEffect[]; reasoning: string } | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  const handleEffectClick = (effectId: string) => {
    if (selectedEffect === effectId) {
      onSelectEffect(null)
    } else {
      onSelectEffect(effectId)
    }
  }

  const handleAISubmit = async () => {
    if (!aiPrompt.trim() || isGenerating) return

    setIsGenerating(true)
    setAiError(null)
    setAiResult(null)

    try {
      const result = await generateEffect(aiPrompt.trim())
      setAiResult(result)
      
      if (result.effects.length > 0) {
        onAIGenerate(aiPrompt.trim(), result.effects)
        onSelectEffect(result.effects[0].type)
      }
    } catch {
      console.warn('AI API not available, using fallback')
      const fallbackEffects: GeneratedEffect[] = [
        { type: 'time-smear', params: { decay: 0.9, intensity: 0.5 } }
      ]
      setAiResult({ effects: fallbackEffects, reasoning: 'Fallback: API not available' })
      onAIGenerate(aiPrompt.trim(), fallbackEffects)
      onSelectEffect('time-smear')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApplyAIEffect = (effect: GeneratedEffect) => {
    onSelectEffect(effect.type)
    onAIGenerate(aiPrompt, [effect])
  }

  return (
    <aside className="w-64 border-r border-tempo-border bg-tempo-surface/30 p-4 flex flex-col">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-tempo-text-muted mb-4">
        Effects
      </h2>

      <div className="space-y-2 flex-1 overflow-y-auto">
        {EFFECTS.map((effect) => {
          const isSelected = selectedEffect === effect.id
          
          return (
            <button
              key={effect.id}
              onClick={() => effect.available && handleEffectClick(effect.id)}
              disabled={!effect.available}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left group
                ${isSelected 
                  ? 'bg-tempo-accent/20 border-tempo-accent text-tempo-text' 
                  : 'bg-tempo-surface border-transparent hover:bg-tempo-border/50 hover:border-tempo-border'
                }
                ${!effect.available ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
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

      {/* Coming Soon Section */}
      <div className="mt-4 pt-4 border-t border-tempo-border">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-tempo-text-muted">
            Coming Soon
          </span>
          <span className="px-1.5 py-0.5 text-[10px] bg-tempo-accent/20 text-tempo-accent rounded">
            NEW
          </span>
        </div>
        <div className="space-y-1.5">
          {COMING_SOON_EFFECTS.map((effect) => (
            <div
              key={effect.name}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-tempo-bg/50 opacity-50"
            >
              <span className="text-sm opacity-60">{effect.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="text-xs block">{effect.name}</span>
                <span className="text-[10px] text-tempo-text-muted block truncate">
                  {effect.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Generate Section */}
      <div className="mt-4 pt-4 border-t border-tempo-border">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-tempo-text-muted mb-3">
          AI Generate
        </h2>
        <div className="relative">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAISubmit()}
            placeholder="dreamy underwater..."
            disabled={isGenerating}
            className="w-full px-3 py-2 text-sm bg-tempo-bg border border-tempo-border rounded-lg placeholder:text-tempo-text-muted focus:outline-none focus:border-tempo-accent focus:ring-1 focus:ring-tempo-accent/50 transition-all pr-10 disabled:opacity-50"
          />
          <button
            onClick={handleAISubmit}
            disabled={isGenerating || !aiPrompt.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-tempo-accent hover:text-white transition-colors p-1 disabled:opacity-50"
          >
            {isGenerating ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            )}
          </button>
        </div>

        {aiResult && (
          <div className="mt-3 p-3 bg-tempo-bg rounded-lg border border-tempo-border">
            <p className="text-xs text-tempo-text-muted mb-2">{aiResult.reasoning}</p>
            <div className="space-y-1">
              {aiResult.effects.map((effect, i) => (
                <button
                  key={i}
                  onClick={() => handleApplyAIEffect(effect)}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                    selectedEffect === effect.type
                      ? 'bg-tempo-accent/20 text-tempo-accent'
                      : 'hover:bg-tempo-border/50'
                  }`}
                >
                  <span className="font-medium">{effect.type}</span>
                  <span className="text-tempo-text-muted ml-2">
                    {Object.entries(effect.params).map(([k, v]) => `${k}: ${(v as number).toFixed(2)}`).join(', ')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {aiError && (
          <p className="mt-2 text-xs text-red-400">{aiError}</p>
        )}

        <p className="text-xs text-tempo-text-muted mt-2">
          Try: &quot;nostalgic&quot;, &quot;anxious&quot;, &quot;psychedelic&quot;
        </p>
      </div>
    </aside>
  )
}
