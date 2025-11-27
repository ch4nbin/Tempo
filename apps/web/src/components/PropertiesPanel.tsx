'use client'

import { CollaboratorAvatars } from './CollaboratorAvatars'

interface User {
  id: string
  name: string
  color: string
}

interface PropertiesPanelProps {
  selectedEffect: string | null
  effectParams: {
    decay: number
    intensity: number
  }
  onParamsChange: (params: { decay: number; intensity: number }) => void
  currentUser: User
  collaborators: Array<{
    user: User
    cursor: number | null
  }>
  isConnected: boolean
}

// Effect-specific configurations
const EFFECT_CONFIG: Record<string, {
  param1: { label: string; description: string }
  param2: { label: string; description: string }
  presets: Array<{ name: string; decay: number; intensity: number }>
}> = {
  'time-smear': {
    param1: { label: 'Decay', description: 'How long trails persist' },
    param2: { label: 'Intensity', description: 'Trail opacity strength' },
    presets: [
      { name: 'Subtle', decay: 0.85, intensity: 0.4 },
      { name: 'Dreamy', decay: 0.92, intensity: 0.6 },
      { name: 'Heavy', decay: 0.95, intensity: 0.8 },
      { name: 'Extreme', decay: 0.98, intensity: 0.9 },
    ],
  },
  'echo-cascade': {
    param1: { label: 'Fade', description: 'Echo opacity falloff' },
    param2: { label: 'Echoes', description: 'Number and offset of copies' },
    presets: [
      { name: 'Subtle', decay: 0.7, intensity: 0.3 },
      { name: 'Ghost', decay: 0.8, intensity: 0.5 },
      { name: 'Trail', decay: 0.85, intensity: 0.7 },
      { name: 'Cascade', decay: 0.9, intensity: 0.9 },
    ],
  },
  'liquid-time': {
    param1: { label: 'Wave Size', description: 'Amplitude of distortion' },
    param2: { label: 'Speed', description: 'Wave animation speed' },
    presets: [
      { name: 'Ripple', decay: 0.3, intensity: 0.3 },
      { name: 'Wavy', decay: 0.5, intensity: 0.5 },
      { name: 'Turbulent', decay: 0.7, intensity: 0.7 },
      { name: 'Chaos', decay: 0.9, intensity: 0.9 },
    ],
  },
  'temporal-glitch': {
    param1: { label: 'Frequency', description: 'How often glitches occur' },
    param2: { label: 'Intensity', description: 'Glitch strength' },
    presets: [
      { name: 'Subtle', decay: 0.3, intensity: 0.3 },
      { name: 'VHS', decay: 0.5, intensity: 0.5 },
      { name: 'Corrupt', decay: 0.7, intensity: 0.7 },
      { name: 'Broken', decay: 0.9, intensity: 0.9 },
    ],
  },
  'breath-sync': {
    param1: { label: 'Speed', description: 'Breathing rate' },
    param2: { label: 'Depth', description: 'Scale intensity' },
    presets: [
      { name: 'Calm', decay: 0.3, intensity: 0.3 },
      { name: 'Relaxed', decay: 0.5, intensity: 0.5 },
      { name: 'Anxious', decay: 0.7, intensity: 0.7 },
      { name: 'Panic', decay: 0.9, intensity: 0.9 },
    ],
  },
  'memory-fade': {
    param1: { label: 'Blend', description: 'Past/present mix' },
    param2: { label: 'Desaturate', description: 'Color fade amount' },
    presets: [
      { name: 'Fresh', decay: 0.3, intensity: 0.3 },
      { name: 'Fading', decay: 0.5, intensity: 0.5 },
      { name: 'Distant', decay: 0.7, intensity: 0.7 },
      { name: 'Forgotten', decay: 0.9, intensity: 0.9 },
    ],
  },
}

export function PropertiesPanel({
  selectedEffect,
  effectParams,
  onParamsChange,
  currentUser,
  collaborators,
  isConnected,
}: PropertiesPanelProps) {
  const config = selectedEffect ? EFFECT_CONFIG[selectedEffect] : null

  const handleDecayChange = (value: number) => {
    onParamsChange({ ...effectParams, decay: value })
  }

  const handleIntensityChange = (value: number) => {
    onParamsChange({ ...effectParams, intensity: value })
  }

  return (
    <aside className="w-72 border-l border-tempo-border bg-tempo-surface/30 p-4 flex flex-col">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-tempo-text-muted mb-4">
        Properties
      </h2>

      {selectedEffect && config ? (
        <div className="space-y-6 flex-1">
          {/* Parameter 1 (Decay) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-tempo-text">{config.param1.label}</label>
              <span className="text-xs font-mono text-tempo-text-muted">
                {effectParams.decay.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={effectParams.decay}
              onChange={(e) => handleDecayChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-tempo-bg rounded-lg appearance-none cursor-pointer slider"
            />
            <p className="text-xs text-tempo-text-muted mt-1">
              {config.param1.description}
            </p>
          </div>

          {/* Parameter 2 (Intensity) */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-tempo-text">{config.param2.label}</label>
              <span className="text-xs font-mono text-tempo-text-muted">
                {effectParams.intensity.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={effectParams.intensity}
              onChange={(e) => handleIntensityChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-tempo-bg rounded-lg appearance-none cursor-pointer slider"
            />
            <p className="text-xs text-tempo-text-muted mt-1">
              {config.param2.description}
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="pt-4 border-t border-tempo-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-tempo-text-muted mb-3">
              Presets
            </p>
            <div className="grid grid-cols-2 gap-2">
              {config.presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => onParamsChange({ decay: preset.decay, intensity: preset.intensity })}
                  className="px-3 py-2 text-xs bg-tempo-surface border border-tempo-border rounded-lg hover:border-tempo-accent transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Effect Info */}
          <div className="pt-4 border-t border-tempo-border">
            <p className="text-xs text-tempo-text-muted">
              <span className="font-medium text-tempo-text">Tip:</span> Combine effects by layering them in future updates!
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-tempo-bg flex items-center justify-center">
              <svg className="w-6 h-6 text-tempo-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <p className="text-sm text-tempo-text-muted">Select an effect to<br />edit properties</p>
          </div>
        </div>
      )}

      {/* Collaborators Section */}
      <div className="mt-auto pt-6 border-t border-tempo-border">
        <CollaboratorAvatars
          currentUser={currentUser}
          collaborators={collaborators}
          isConnected={isConnected}
        />
      </div>
    </aside>
  )
}
