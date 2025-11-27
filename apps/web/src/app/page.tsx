'use client'

import { useState, useRef, useCallback } from 'react'
import { VideoCanvas } from '@/components/VideoCanvas'
import { EffectPanel } from '@/components/EffectPanel'
import { PropertiesPanel } from '@/components/PropertiesPanel'

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null)
  const [effectParams, setEffectParams] = useState({ decay: 0.9, intensity: 0.5 })
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((file: File) => {
    if (file.type.startsWith('video/')) {
      setVideoFile(file)
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleTimeUpdate = useCallback((time: number, dur: number) => {
    setCurrentTime(time)
    setDuration(dur)
  }, [])

  const handleAIGenerate = useCallback((prompt: string) => {
    // TODO: Implement AI generation
    console.log('AI Generate:', prompt)
    // For now, select time-smear with random params
    setSelectedEffect('time-smear')
    setEffectParams({
      decay: 0.85 + Math.random() * 0.1,
      intensity: 0.4 + Math.random() * 0.4,
    })
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Header */}
      <header className="h-14 border-b border-tempo-border bg-tempo-surface/50 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-tempo-accent to-purple-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="font-semibold text-lg tracking-tight">Tempo</span>
          {videoFile && (
            <span className="text-sm text-tempo-text-muted ml-4 px-2 py-0.5 bg-tempo-surface rounded">
              {videoFile.name}
            </span>
          )}
        </div>

        <nav className="flex items-center gap-2">
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

        {/* Center - Preview Canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Preview Area */}
          <div
            className={`flex-1 flex items-center justify-center p-8 bg-tempo-bg transition-colors ${
              isDragging ? 'bg-tempo-accent/5' : ''
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !videoFile && fileInputRef.current?.click()}
          >
            <div
              className={`relative w-full max-w-4xl aspect-video bg-tempo-surface rounded-xl border overflow-hidden transition-all cursor-pointer ${
                isDragging
                  ? 'border-tempo-accent border-2 scale-[1.02]'
                  : 'border-tempo-border hover:border-tempo-border/80'
              }`}
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
          <div className="h-48 border-t border-tempo-border bg-tempo-surface/50">
            {/* Playback Controls */}
            <div className="h-12 border-b border-tempo-border flex items-center justify-center gap-4 px-4">
              <button
                onClick={() => setCurrentTime(Math.max(0, currentTime - 5))}
                className="p-2 text-tempo-text-muted hover:text-tempo-text transition-colors"
                disabled={!videoFile}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                </svg>
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-3 rounded-full text-white transition-colors ${
                  videoFile
                    ? 'bg-tempo-accent hover:bg-tempo-accent-dim'
                    : 'bg-tempo-text-muted cursor-not-allowed'
                }`}
                disabled={!videoFile}
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => setCurrentTime(Math.min(duration, currentTime + 5))}
                className="p-2 text-tempo-text-muted hover:text-tempo-text transition-colors"
                disabled={!videoFile}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
                </svg>
              </button>

              <span className="text-sm font-mono text-tempo-text-muted ml-4">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Timeline Tracks */}
            <div className="flex-1 p-4">
              <div className="h-full flex flex-col gap-2">
                {/* Video Track */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-tempo-text-muted w-16 shrink-0">Video</span>
                  <div className={`flex-1 h-10 rounded border flex items-center ${
                    videoFile
                      ? 'bg-tempo-accent/20 border-tempo-accent/50'
                      : 'bg-tempo-bg border-tempo-border border-dashed'
                  }`}>
                    {videoFile ? (
                      <div className="px-3 text-xs text-tempo-text truncate">
                        {videoFile.name}
                      </div>
                    ) : (
                      <span className="px-3 text-xs text-tempo-text-muted">No video loaded</span>
                    )}
                  </div>
                </div>

                {/* Effects Track */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-tempo-text-muted w-16 shrink-0">Effects</span>
                  <div className={`flex-1 h-10 rounded border ${
                    selectedEffect
                      ? 'bg-purple-500/20 border-purple-500/50'
                      : 'bg-tempo-bg border-tempo-border border-dashed'
                  }`}>
                    {selectedEffect && (
                      <div className="h-full px-3 flex items-center gap-2">
                        <span className="text-lg">◐</span>
                        <span className="text-xs text-tempo-text">Time Smear</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <PropertiesPanel
          selectedEffect={selectedEffect}
          effectParams={effectParams}
          onParamsChange={setEffectParams}
        />
      </main>
    </div>
  )
}
