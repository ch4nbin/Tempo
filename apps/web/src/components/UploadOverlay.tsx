'use client'

import { useState, useCallback } from 'react'
import { uploadVideo, type UploadProgress } from '@/lib/api'

interface UploadOverlayProps {
  isOpen: boolean
  onClose: () => void
  onUploadComplete: (videoUrl: string, filename: string) => void
}

export function UploadOverlay({ isOpen, onClose, onUploadComplete }: UploadOverlayProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file')
      return
    }

    if (file.size > 500 * 1024 * 1024) {
      setError('File too large (max 500MB)')
      return
    }

    setIsUploading(true)
    setError(null)
    setProgress({ loaded: 0, total: file.size, percentage: 0 })

    try {
      const video = await uploadVideo(file, setProgress)
      onUploadComplete(video.url, video.filename)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      setProgress(null)
    }
  }, [onClose, onUploadComplete])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }, [handleUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }, [handleUpload])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-tempo-surface border border-tempo-border rounded-xl p-8 max-w-lg w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Upload Video</h2>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-2 text-tempo-text-muted hover:text-tempo-text transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isUploading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-tempo-accent/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-tempo-accent animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Uploading...</p>
                <p className="text-xs text-tempo-text-muted">
                  {progress ? `${(progress.loaded / 1024 / 1024).toFixed(1)} MB / ${(progress.total / 1024 / 1024).toFixed(1)} MB` : 'Preparing...'}
                </p>
              </div>
              <span className="text-sm font-mono text-tempo-accent">
                {progress?.percentage || 0}%
              </span>
            </div>
            
            <div className="h-2 bg-tempo-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-tempo-accent transition-all duration-300"
                style={{ width: `${progress?.percentage || 0}%` }}
              />
            </div>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
              isDragging
                ? 'border-tempo-accent bg-tempo-accent/5'
                : 'border-tempo-border hover:border-tempo-accent/50'
            }`}
          >
            <input
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
              id="video-upload"
            />
            <label htmlFor="video-upload" className="cursor-pointer">
              <svg className="w-12 h-12 mx-auto mb-4 text-tempo-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-tempo-text mb-1">Drop a video file or click to browse</p>
              <p className="text-sm text-tempo-text-muted">MP4, WebM, MOV up to 500MB</p>
            </label>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <p className="mt-4 text-xs text-tempo-text-muted text-center">
          Videos are processed on our servers for optimal playback
        </p>
      </div>
    </div>
  )
}

