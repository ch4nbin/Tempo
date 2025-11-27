'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { VideoCanvas, type VideoCanvasHandle } from '@/components/VideoCanvas'
import { EffectPanel } from '@/components/EffectPanel'
import { PropertiesPanel } from '@/components/PropertiesPanel'
import { Timeline } from '@/components/Timeline'
import { UploadOverlay } from '@/components/UploadOverlay'
import { ExportModal } from '@/components/ExportModal'
import { useCollaboration } from '@/hooks/useCollaboration'
import { useAuth } from '@/context/AuthContext'

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showUploadOverlay, setShowUploadOverlay] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoCanvasRef = useRef<VideoCanvasHandle>(null)

  // Auth state
  const { user, isAuthenticated, logout } = useAuth()

  // Initialize collaboration with a project ID
  const [projectId, setProjectId] = useState('default')
  
  // Set project ID on client side only
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      setProjectId(hash)
    } else {
      const newId = Math.random().toString(36).substring(2, 9)
      window.location.hash = newId
      setProjectId(newId)
    }
  }, [])

  const {
    isConnected,
    currentUser,
    collaborators,
    effectSettings,
    setSelectedEffect,
    setEffectParams,
    updateCursor,
  } = useCollaboration(projectId)

  // Derive selected effect and params from synced state
  const selectedEffect = effectSettings.selectedEffect
  const effectParams = { decay: effectSettings.decay, intensity: effectSettings.intensity }

  const handleFileSelect = useCallback((file: File) => {
    if (file.type.startsWith('video/')) {
      setVideoFile(file)
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect]
  )

  const handleTimeUpdate = useCallback((time: number, dur: number) => {
    setCurrentTime(time)
    setDuration(dur)
  }, [])

  const handleAIGenerate = useCallback((prompt: string, effects: Array<{ type: string; params: Record<string, number> }>) => {
    console.log('AI Generate:', prompt, effects)
    if (effects.length > 0) {
      const firstEffect = effects[0]
      setSelectedEffect(firstEffect.type)
      if (firstEffect.params.decay !== undefined && firstEffect.params.intensity !== undefined) {
        setEffectParams({
          decay: firstEffect.params.decay,
          intensity: firstEffect.params.intensity,
        })
      }
    }
  }, [setSelectedEffect, setEffectParams])

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  const handleTimeChange = useCallback((time: number) => {
    setCurrentTime(time)
  }, [])

  const handleCursorMove = useCallback((position: number | null) => {
    updateCursor(position)
  }, [updateCursor])

  const handleUploadComplete = useCallback((videoUrl: string, filename: string) => {
    // Create a file-like object for the VideoCanvas
    // In production, we'd fetch the video from the URL
    console.log('Upload complete:', videoUrl, filename)
    // For now, just close the overlay - user can still drag/drop locally
    setShowUploadOverlay(false)
  }, [])

  // Transform collaborators for components
  const timelineCollaborators = collaborators.map(c => ({
    clientId: c.clientId,
    user: c.user,
    cursor: c.cursor,
    selection: c.selection,
  }))

  const propertiesCollaborators = collaborators.map(c => ({
    user: c.user,
    cursor: c.cursor,
  }))

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Header */}
      <header className="h-12 border-b border-tempo-border bg-tempo-surface/80 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-tempo-accent to-cyan-500 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span className="font-semibold tracking-tight">Tempo</span>
          {videoFile && (
            <span className="text-xs text-tempo-text-muted ml-2 px-2 py-0.5 bg-tempo-bg rounded border border-tempo-border">
              {videoFile.name}
            </span>
          )}
        </div>

        <nav className="flex items-center gap-3">
          {/* Connection indicator */}
          <div className="flex items-center gap-1.5 text-xs text-tempo-text-muted">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-400' : 'bg-yellow-400'
              }`}
            />
            {isConnected ? 'Live' : 'Offline'}
          </div>

          {/* Auth section */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 px-2 py-1 bg-tempo-bg rounded-lg border border-tempo-border">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-tempo-accent to-cyan-500 flex items-center justify-center text-xs font-medium text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-tempo-text-muted max-w-[100px] truncate">
                {user?.name}
              </span>
              <button
                onClick={logout}
                className="text-xs text-tempo-text-muted hover:text-red-400 transition-colors"
                title="Sign out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-tempo-bg hover:bg-tempo-surface border border-tempo-border rounded-lg transition-colors group"
            >
              <svg className="w-4 h-4 text-tempo-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-tempo-text-muted group-hover:text-tempo-text transition-colors">
                Sign in to collaborate
              </span>
            </Link>
          )}

          <div className="w-px h-6 bg-tempo-border" />

          <button
            onClick={() => videoFile ? fileInputRef.current?.click() : setShowUploadOverlay(true)}
            className="px-3 py-1.5 text-sm text-tempo-text-muted hover:text-tempo-text transition-colors"
          >
            {videoFile ? 'Change Video' : 'Open Video'}
          </button>
          <button 
            onClick={() => setShowExportModal(true)}
            disabled={!videoFile}
            className="px-3 py-1.5 text-sm bg-tempo-accent hover:bg-tempo-accent-dim text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Effects */}
        <EffectPanel
          selectedEffect={selectedEffect}
          onSelectEffect={setSelectedEffect}
          onAIGenerate={handleAIGenerate}
        />

        {/* Center - Preview + Timeline */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Preview Area */}
          <div
            className={`flex-1 flex items-center justify-center p-6 bg-tempo-bg transition-colors min-h-0 ${
              isDragging ? 'bg-tempo-accent/5' : ''
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !videoFile && fileInputRef.current?.click()}
          >
            <div
              className={`relative w-full max-w-4xl aspect-video bg-tempo-surface rounded-xl border overflow-hidden transition-all ${
                isDragging
                  ? 'border-tempo-accent border-2 scale-[1.01]'
                  : 'border-tempo-border hover:border-tempo-border/80'
              } ${!videoFile ? 'cursor-pointer' : ''}`}
            >
              <VideoCanvas
                ref={videoCanvasRef}
                videoFile={videoFile}
                effect={selectedEffect}
                effectParams={effectParams}
                isPlaying={isPlaying}
                onTimeUpdate={handleTimeUpdate}
              />

              {/* Effect indicator */}
              {selectedEffect && videoFile && (
                <div className="absolute top-3 left-3 px-2 py-1 bg-tempo-accent/90 text-white text-xs rounded-md flex items-center gap-1.5 capitalize">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {selectedEffect.replace('-', ' ')} Active
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="h-44 border-t border-tempo-border shrink-0 relative">
            <Timeline
              duration={duration}
              currentTime={currentTime}
              isPlaying={isPlaying}
              videoFile={videoFile}
              selectedEffect={selectedEffect}
              collaborators={timelineCollaborators}
              onTimeChange={handleTimeChange}
              onPlayPause={handlePlayPause}
              onCursorMove={handleCursorMove}
            />
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <PropertiesPanel
          selectedEffect={selectedEffect}
          effectParams={effectParams}
          onParamsChange={setEffectParams}
          currentUser={currentUser}
          collaborators={propertiesCollaborators}
          isConnected={isConnected}
        />
      </main>

      {/* Upload Overlay */}
      <UploadOverlay
        isOpen={showUploadOverlay}
        onClose={() => setShowUploadOverlay(false)}
        onUploadComplete={handleUploadComplete}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        projectId={projectId}
        canvasRef={{ current: videoCanvasRef.current?.canvas ?? null }}
        videoRef={{ current: videoCanvasRef.current?.video ?? null }}
      />
    </div>
  )
}
