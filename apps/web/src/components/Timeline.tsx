'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface TimelineClip {
  id: string
  type: 'video' | 'effect'
  name: string
  startTime: number
  endTime: number
  track: number
  color: string
}

interface TimelineProps {
  duration: number
  currentTime: number
  isPlaying: boolean
  videoFile: File | null
  selectedEffect: string | null
  onTimeChange: (time: number) => void
  onPlayPause: () => void
}

function formatTimeRuler(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function Timeline({
  duration,
  currentTime,
  isPlaying,
  videoFile,
  selectedEffect,
  onTimeChange,
  onPlayPause,
}: TimelineProps) {
  const [zoom, setZoom] = useState(1) // pixels per second
  const [scrollLeft, setScrollLeft] = useState(0)
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false)
  const timelineRef = useRef<HTMLDivElement>(null)
  const rulerRef = useRef<HTMLDivElement>(null)

  // Calculate timeline width based on duration and zoom
  const pixelsPerSecond = 50 * zoom
  const timelineWidth = Math.max(duration * pixelsPerSecond, 800)

  // Generate clips from video and effects
  const clips: TimelineClip[] = []
  
  if (videoFile && duration > 0) {
    clips.push({
      id: 'video-main',
      type: 'video',
      name: videoFile.name,
      startTime: 0,
      endTime: duration,
      track: 0,
      color: 'bg-tempo-accent/30 border-tempo-accent',
    })
  }

  if (selectedEffect && duration > 0) {
    clips.push({
      id: 'effect-1',
      type: 'effect',
      name: selectedEffect === 'time-smear' ? 'Time Smear' : selectedEffect,
      startTime: 0,
      endTime: duration,
      track: 1,
      color: 'bg-cyan-500/30 border-cyan-500',
    })
  }

  // Handle playhead drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return
    setIsDraggingPlayhead(true)
    
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left + scrollLeft
    const time = Math.max(0, Math.min(duration, x / pixelsPerSecond))
    onTimeChange(time)
  }, [duration, pixelsPerSecond, scrollLeft, onTimeChange])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingPlayhead || !timelineRef.current) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left + scrollLeft
    const time = Math.max(0, Math.min(duration, x / pixelsPerSecond))
    onTimeChange(time)
  }, [isDraggingPlayhead, duration, pixelsPerSecond, scrollLeft, onTimeChange])

  const handleMouseUp = useCallback(() => {
    setIsDraggingPlayhead(false)
  }, [])

  useEffect(() => {
    if (isDraggingPlayhead) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDraggingPlayhead, handleMouseMove, handleMouseUp])

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft)
    if (rulerRef.current) {
      rulerRef.current.scrollLeft = e.currentTarget.scrollLeft
    }
  }, [])

  // Generate time ruler marks
  const rulerMarks = []
  const markInterval = zoom < 0.5 ? 10 : zoom < 1 ? 5 : zoom < 2 ? 2 : 1
  for (let t = 0; t <= duration; t += markInterval) {
    rulerMarks.push(t)
  }

  // Playhead position
  const playheadX = currentTime * pixelsPerSecond

  return (
    <div className="h-full flex flex-col bg-tempo-surface/50">
      {/* Playback Controls */}
      <div className="h-12 border-b border-tempo-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {/* Skip Back */}
          <button
            onClick={() => onTimeChange(Math.max(0, currentTime - 5))}
            className="p-2 text-tempo-text-muted hover:text-tempo-text transition-colors rounded hover:bg-tempo-border/50"
            disabled={!videoFile}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={onPlayPause}
            className={`p-2.5 rounded-full text-white transition-colors ${
              videoFile
                ? 'bg-tempo-accent hover:bg-tempo-accent-dim'
                : 'bg-tempo-text-muted cursor-not-allowed'
            }`}
            disabled={!videoFile}
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Skip Forward */}
          <button
            onClick={() => onTimeChange(Math.min(duration, currentTime + 5))}
            className="p-2 text-tempo-text-muted hover:text-tempo-text transition-colors rounded hover:bg-tempo-border/50"
            disabled={!videoFile}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
            </svg>
          </button>

          {/* Time Display */}
          <div className="ml-3 px-3 py-1 bg-tempo-bg rounded border border-tempo-border">
            <span className="text-sm font-mono text-tempo-text">
              {formatTimeRuler(currentTime)}
            </span>
            <span className="text-sm font-mono text-tempo-text-muted"> / </span>
            <span className="text-sm font-mono text-tempo-text-muted">
              {formatTimeRuler(duration)}
            </span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(0.25, zoom / 1.5))}
            className="p-1.5 text-tempo-text-muted hover:text-tempo-text transition-colors rounded hover:bg-tempo-border/50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <span className="text-xs text-tempo-text-muted w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(4, zoom * 1.5))}
            className="p-1.5 text-tempo-text-muted hover:text-tempo-text transition-colors rounded hover:bg-tempo-border/50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Time Ruler */}
      <div
        ref={rulerRef}
        className="h-6 border-b border-tempo-border bg-tempo-bg overflow-hidden"
        style={{ marginLeft: '80px' }}
      >
        <div className="relative h-full" style={{ width: timelineWidth }}>
          {rulerMarks.map((time) => (
            <div
              key={time}
              className="absolute top-0 h-full flex flex-col items-center"
              style={{ left: time * pixelsPerSecond }}
            >
              <span className="text-[10px] text-tempo-text-muted">
                {formatTimeRuler(time)}
              </span>
              <div className="flex-1 w-px bg-tempo-border" />
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Tracks */}
      <div
        ref={timelineRef}
        className="flex-1 overflow-x-auto overflow-y-hidden cursor-crosshair"
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
      >
        <div className="relative min-h-full" style={{ width: timelineWidth + 80 }}>
          {/* Track Labels */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-tempo-surface border-r border-tempo-border z-10">
            <div className="h-12 flex items-center px-3 border-b border-tempo-border">
              <span className="text-xs text-tempo-text-muted">Video</span>
            </div>
            <div className="h-12 flex items-center px-3 border-b border-tempo-border">
              <span className="text-xs text-tempo-text-muted">Effects</span>
            </div>
          </div>

          {/* Tracks Content */}
          <div className="ml-20">
            {/* Video Track */}
            <div className="h-12 border-b border-tempo-border relative">
              {clips
                .filter((c) => c.track === 0)
                .map((clip) => (
                  <div
                    key={clip.id}
                    className={`absolute top-1 bottom-1 rounded border ${clip.color} flex items-center px-2 overflow-hidden cursor-grab hover:brightness-110 transition-all`}
                    style={{
                      left: clip.startTime * pixelsPerSecond,
                      width: (clip.endTime - clip.startTime) * pixelsPerSecond,
                    }}
                  >
                    <span className="text-xs text-tempo-text truncate">{clip.name}</span>
                  </div>
                ))}
            </div>

            {/* Effects Track */}
            <div className="h-12 border-b border-tempo-border relative">
              {clips
                .filter((c) => c.track === 1)
                .map((clip) => (
                  <div
                    key={clip.id}
                    className={`absolute top-1 bottom-1 rounded border ${clip.color} flex items-center gap-1.5 px-2 overflow-hidden cursor-grab hover:brightness-110 transition-all`}
                    style={{
                      left: clip.startTime * pixelsPerSecond,
                      width: (clip.endTime - clip.startTime) * pixelsPerSecond,
                    }}
                  >
                    <span className="text-sm">◐</span>
                    <span className="text-xs text-tempo-text truncate">{clip.name}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Playhead */}
          {duration > 0 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
              style={{ left: 80 + playheadX }}
            >
              {/* Playhead handle */}
              <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rounded-sm rotate-45" />
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!videoFile && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-tempo-text-muted text-sm">Load a video to see the timeline</p>
        </div>
      )}
    </div>
  )
}

