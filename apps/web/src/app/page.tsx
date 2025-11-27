'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { VideoCanvas } from '@/components/VideoCanvas'
import { EffectPanel } from '@/components/EffectPanel'
import { PropertiesPanel } from '@/components/PropertiesPanel'
import { Timeline } from '@/components/Timeline'
import { useCollaboration } from '@/hooks/useCollaboration'

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null)
  const [effectParams, setEffectParams] = useState({ decay: 0.9, intensity: 0.5 })
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

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
    updateCursor,
  } = useCollaboration(projectId)

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

  const handleAIGenerate = useCallback((prompt: string) => {
    console.log('AI Generate:', prompt)
    setSelectedEffect('time-smear')
    setEffectParams({
      decay: 0.85 + Math.random() * 0.1,
      intensity: 0.4 + Math.random() * 0.4,
    })
  }, [])

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  const handleTimeChange = useCallback((time: number) => {
    setCurrentTime(time)
  }, [])

  const handleCursorMove = useCallback((position: number | null) => {
    updateCursor(position)
  }, [updateCursor])

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

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-sm text-tempo-text-muted hover:text-tempo-text transition-colors"
          >
            {videoFile ? 'Change Video' : 'Open Video'}
          </button>
          <button className="px-3 py-1.5 text-sm bg-tempo-accent hover:bg-tempo-accent-dim text-white rounded-md transition-colors">
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
                videoFile={videoFile}
                effect={selectedEffect}
                effectParams={effectParams}
                isPlaying={isPlaying}
                onTimeUpdate={handleTimeUpdate}
              />

              {/* Effect indicator */}
              {selectedEffect && videoFile && (
                <div className="absolute top-3 left-3 px-2 py-1 bg-tempo-accent/90 text-white text-xs rounded-md flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Time Smear Active
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
    </div>
  )
}
