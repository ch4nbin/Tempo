'use client'

interface PropertiesPanelProps {
  selectedEffect: string | null
  effectParams: {
    decay: number
    intensity: number
  }
  onParamsChange: (params: { decay: number; intensity: number }) => void
}

export function PropertiesPanel({
  selectedEffect,
  effectParams,
  onParamsChange,
}: PropertiesPanelProps) {
  const handleDecayChange = (value: number) => {
    onParamsChange({ ...effectParams, decay: value })
  }

  const handleIntensityChange = (value: number) => {
    onParamsChange({ ...effectParams, intensity: value })
  }

  return (
    <aside className="w-72 border-l border-tempo-border bg-tempo-surface/30 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-tempo-text-muted mb-4">
        Properties
      </h2>

      {selectedEffect === 'time-smear' ? (
        <div className="space-y-6">
          {/* Decay Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-tempo-text">Decay</label>
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
              How long trails persist
            </p>
          </div>

          {/* Intensity Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-tempo-text">Intensity</label>
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
              Trail opacity strength
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="pt-4 border-t border-tempo-border">
            <p className="text-xs font-semibold uppercase tracking-wider text-tempo-text-muted mb-3">
              Presets
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onParamsChange({ decay: 0.85, intensity: 0.4 })}
                className="px-3 py-2 text-xs bg-tempo-surface border border-tempo-border rounded-lg hover:border-tempo-accent transition-colors"
              >
                Subtle
              </button>
              <button
                onClick={() => onParamsChange({ decay: 0.92, intensity: 0.6 })}
                className="px-3 py-2 text-xs bg-tempo-surface border border-tempo-border rounded-lg hover:border-tempo-accent transition-colors"
              >
                Dreamy
              </button>
              <button
                onClick={() => onParamsChange({ decay: 0.95, intensity: 0.8 })}
                className="px-3 py-2 text-xs bg-tempo-surface border border-tempo-border rounded-lg hover:border-tempo-accent transition-colors"
              >
                Heavy
              </button>
              <button
                onClick={() => onParamsChange({ decay: 0.98, intensity: 0.9 })}
                className="px-3 py-2 text-xs bg-tempo-surface border border-tempo-border rounded-lg hover:border-tempo-accent transition-colors"
              >
                Extreme
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-tempo-text-muted text-center py-8">
          Select an effect to edit properties
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-tempo-border">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-tempo-text-muted mb-4">
          Collaborators
        </h2>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-xs font-medium text-white">
            Y
          </div>
          <span className="text-sm">You</span>
          <span className="ml-auto text-xs text-green-400">● Online</span>
        </div>
      </div>
    </aside>
  )
}

