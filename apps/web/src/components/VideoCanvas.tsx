'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface VideoCanvasProps {
  videoFile: File | null
  effect: string | null
  effectParams: {
    decay: number
    intensity: number
  }
  isPlaying: boolean
  onTimeUpdate?: (currentTime: number, duration: number) => void
}

export function VideoCanvas({
  videoFile,
  effect,
  effectParams,
  isPlaying,
  onTimeUpdate,
}: VideoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const animationRef = useRef<number>(0)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const previousFrameRef = useRef<ImageData | null>(null)
  
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  // Create object URL for video file
  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile)
      setVideoUrl(url)
      return () => URL.revokeObjectURL(url)
    } else {
      setVideoUrl(null)
      setVideoLoaded(false)
    }
  }, [videoFile])

  // Handle video loaded
  const handleVideoLoaded = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    ctxRef.current = canvas.getContext('2d', { willReadFrequently: true })
    setVideoLoaded(true)
  }, [])

  // Render loop
  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = ctxRef.current

    if (!video || !canvas || !ctx || !videoLoaded) return

    const render = () => {
      if (video.paused && !video.ended) {
        animationRef.current = requestAnimationFrame(render)
        return
      }

      // Draw current frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Apply Time Smear effect
      if (effect === 'time-smear' && previousFrameRef.current) {
        const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const previousFrame = previousFrameRef.current
        const { decay, intensity } = effectParams

        // Blend frames
        for (let i = 0; i < currentFrame.data.length; i += 4) {
          const r = currentFrame.data[i]
          const g = currentFrame.data[i + 1]
          const b = currentFrame.data[i + 2]

          const pr = previousFrame.data[i] * decay
          const pg = previousFrame.data[i + 1] * decay
          const pb = previousFrame.data[i + 2] * decay

          // Mix current with decayed previous (take max for trail effect)
          currentFrame.data[i] = Math.min(255, r + (Math.max(r, pr) - r) * intensity)
          currentFrame.data[i + 1] = Math.min(255, g + (Math.max(g, pg) - g) * intensity)
          currentFrame.data[i + 2] = Math.min(255, b + (Math.max(b, pb) - b) * intensity)
        }

        ctx.putImageData(currentFrame, 0, 0)
        previousFrameRef.current = currentFrame
      } else {
        // Store current frame for next iteration
        previousFrameRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height)
      }

      // Report time update
      if (onTimeUpdate) {
        onTimeUpdate(video.currentTime, video.duration)
      }

      animationRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [videoLoaded, effect, effectParams, onTimeUpdate])

  // Play/pause control
  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoLoaded) return

    if (isPlaying) {
      video.play()
    } else {
      video.pause()
    }
  }, [isPlaying, videoLoaded])

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Hidden video element */}
      <video
        ref={videoRef}
        src={videoUrl || undefined}
        onLoadedMetadata={handleVideoLoaded}
        className="hidden"
        loop
        muted
        playsInline
      />

      {/* Canvas for rendering */}
      <canvas
        ref={canvasRef}
        className={`max-w-full max-h-full object-contain rounded-lg ${
          videoLoaded ? 'block' : 'hidden'
        }`}
        style={{
          boxShadow: effect ? '0 0 40px rgba(99, 102, 241, 0.2)' : undefined,
        }}
      />

      {/* Placeholder when no video */}
      {!videoLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-tempo-text-muted">
          <svg
            className="w-16 h-16 mb-4 opacity-30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
            />
          </svg>
          <p className="text-sm">Drop a video file or click to upload</p>
          <p className="text-xs mt-1 opacity-50">MP4, WebM, MOV up to 500MB</p>
        </div>
      )}
    </div>
  )
}

