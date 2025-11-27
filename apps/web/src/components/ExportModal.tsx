'use client'

import { useState, useEffect, useCallback } from 'react'
import { startExport, getExportStatus, type ExportJob } from '@/lib/api'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
}

export function ExportModal({ isOpen, onClose, projectId }: ExportModalProps) {
  const [format, setFormat] = useState<'mp4' | 'webm'>('mp4')
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('high')
  const [job, setJob] = useState<ExportJob | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Poll for export status
  useEffect(() => {
    if (!job || job.status === 'completed' || job.status === 'failed') return

    const interval = setInterval(async () => {
      try {
        const updated = await getExportStatus(job.id)
        setJob(updated)
      } catch {
        // Ignore polling errors
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [job])

  const handleExport = useCallback(async () => {
    setError(null)
    try {
      const newJob = await startExport(projectId, format, quality)
      setJob(newJob)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start export')
    }
  }, [projectId, format, quality])

  const handleClose = useCallback(() => {
    setJob(null)
    setError(null)
    onClose()
  }, [onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-tempo-surface border border-tempo-border rounded-xl p-8 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Export Video</h2>
          <button
            onClick={handleClose}
            className="p-2 text-tempo-text-muted hover:text-tempo-text transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {job ? (
          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center gap-3">
              {job.status === 'completed' ? (
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : job.status === 'failed' ? (
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-tempo-accent/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-tempo-accent animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              )}
              <div>
                <p className="font-medium capitalize">{job.status}</p>
                <p className="text-sm text-tempo-text-muted">
                  {job.status === 'completed' ? 'Your video is ready!' : 
                   job.status === 'failed' ? job.error || 'Export failed' :
                   'Processing your video...'}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            {(job.status === 'pending' || job.status === 'processing') && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-tempo-text-muted">Progress</span>
                  <span className="font-mono">{job.progress}%</span>
                </div>
                <div className="h-2 bg-tempo-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-tempo-accent transition-all duration-300"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Download button */}
            {job.status === 'completed' && job.url && (
              <a
                href={job.url}
                download
                className="block w-full py-3 bg-tempo-accent hover:bg-tempo-accent-dim text-white text-center rounded-lg transition-colors"
              >
                Download Video
              </a>
            )}

            {/* Try again */}
            {job.status === 'failed' && (
              <button
                onClick={() => setJob(null)}
                className="w-full py-3 bg-tempo-border hover:bg-tempo-border/80 text-tempo-text rounded-lg transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Format selection */}
            <div>
              <label className="block text-sm font-medium mb-3">Format</label>
              <div className="grid grid-cols-2 gap-3">
                {(['mp4', 'webm'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`py-3 rounded-lg border transition-colors uppercase text-sm font-medium ${
                      format === f
                        ? 'bg-tempo-accent/20 border-tempo-accent text-tempo-accent'
                        : 'bg-tempo-bg border-tempo-border hover:border-tempo-accent/50'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality selection */}
            <div>
              <label className="block text-sm font-medium mb-3">Quality</label>
              <div className="grid grid-cols-3 gap-3">
                {(['low', 'medium', 'high'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuality(q)}
                    className={`py-3 rounded-lg border transition-colors capitalize text-sm ${
                      quality === q
                        ? 'bg-tempo-accent/20 border-tempo-accent text-tempo-accent'
                        : 'bg-tempo-bg border-tempo-border hover:border-tempo-accent/50'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <p className="text-xs text-tempo-text-muted mt-2">
                {quality === 'low' && '720p • Smaller file size'}
                {quality === 'medium' && '1080p • Balanced'}
                {quality === 'high' && '4K • Best quality'}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Export button */}
            <button
              onClick={handleExport}
              className="w-full py-3 bg-tempo-accent hover:bg-tempo-accent-dim text-white rounded-lg transition-colors font-medium"
            >
              Start Export
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

