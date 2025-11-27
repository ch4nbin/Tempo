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
  
  // Effect state refs
  const previousFrameRef = useRef<ImageData | null>(null)
  const frameHistoryRef = useRef<ImageData[]>([]) // For echo cascade
  const timeRef = useRef<number>(0) // For animated effects
  const startTimeRef = useRef<number>(Date.now())
  
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

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctxRef.current = ctx
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    }
    
    if (onTimeUpdate) {
      onTimeUpdate(0, video.duration)
    }
    
    startTimeRef.current = Date.now()
    setVideoLoaded(true)
  }, [onTimeUpdate])

  // Reset effect state when effect changes
  useEffect(() => {
    previousFrameRef.current = null
    frameHistoryRef.current = []
    startTimeRef.current = Date.now()
  }, [effect])

  // Render loop
  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = ctxRef.current

    if (!video || !canvas || !ctx || !videoLoaded) return

    const render = () => {
      const { decay, intensity } = effectParams
      timeRef.current = (Date.now() - startTimeRef.current) / 1000

      // Draw current frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // Apply effects
      switch (effect) {
        case 'time-smear':
          applyTimeSmear(ctx, currentFrame, decay, intensity)
          break
        case 'echo-cascade':
          applyEchoCascade(ctx, currentFrame, canvas.width, canvas.height, decay, intensity)
          break
        case 'temporal-glitch':
          applyTemporalGlitch(ctx, currentFrame, intensity)
          break
        case 'breath-sync':
          applyBreathSync(ctx, canvas, video, intensity, decay)
          break
        case 'memory-fade':
          applyMemoryFade(ctx, currentFrame, decay, intensity)
          break
        case 'liquid-time':
          applyLiquidTime(ctx, currentFrame, canvas.width, canvas.height, decay)
          break
        default:
          previousFrameRef.current = currentFrame
      }

      if (onTimeUpdate) {
        onTimeUpdate(video.currentTime, video.duration)
      }

      animationRef.current = requestAnimationFrame(render)
    }

    // Effect implementations
    const applyTimeSmear = (
      ctx: CanvasRenderingContext2D,
      currentFrame: ImageData,
      decay: number,
      intensity: number
    ) => {
      if (previousFrameRef.current) {
        const prev = previousFrameRef.current
        for (let i = 0; i < currentFrame.data.length; i += 4) {
          const r = currentFrame.data[i]
          const g = currentFrame.data[i + 1]
          const b = currentFrame.data[i + 2]
          const pr = prev.data[i] * decay
          const pg = prev.data[i + 1] * decay
          const pb = prev.data[i + 2] * decay
          currentFrame.data[i] = Math.min(255, r + (Math.max(r, pr) - r) * intensity)
          currentFrame.data[i + 1] = Math.min(255, g + (Math.max(g, pg) - g) * intensity)
          currentFrame.data[i + 2] = Math.min(255, b + (Math.max(b, pb) - b) * intensity)
        }
        ctx.putImageData(currentFrame, 0, 0)
      }
      previousFrameRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height)
    }

    const applyEchoCascade = (
      ctx: CanvasRenderingContext2D,
      currentFrame: ImageData,
      width: number,
      height: number,
      decay: number,
      intensity: number
    ) => {
      const maxEchoes = Math.floor(3 + intensity * 7) // 3-10 echoes
      const offsetAmount = 8 + intensity * 15 // 8-23 pixels offset per echo
      
      // Store current frame in history (clone it)
      const frameClone = new ImageData(
        new Uint8ClampedArray(currentFrame.data),
        currentFrame.width,
        currentFrame.height
      )
      frameHistoryRef.current.unshift(frameClone)
      
      // Keep only needed frames
      if (frameHistoryRef.current.length > maxEchoes) {
        frameHistoryRef.current.length = maxEchoes
      }

      // Need at least 2 frames to show echo effect
      if (frameHistoryRef.current.length < 2) {
        return
      }

      // Clear and redraw with echoes (oldest first, newest on top)
      ctx.clearRect(0, 0, width, height)
      
      // Create a reusable temp canvas
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = width
      tempCanvas.height = height
      const tempCtx = tempCanvas.getContext('2d')!
      
      // Draw from oldest to newest (so newest is on top)
      for (let i = frameHistoryRef.current.length - 1; i >= 0; i--) {
        const frame = frameHistoryRef.current[i]
        const alpha = Math.pow(decay, i)
        
        tempCtx.putImageData(frame, 0, 0)
        
        ctx.globalAlpha = i === 0 ? 1 : alpha * 0.6 // Current frame full opacity
        const offset = i * offsetAmount
        ctx.drawImage(tempCanvas, offset, offset)
      }
      
      ctx.globalAlpha = 1
    }

    const applyTemporalGlitch = (
      ctx: CanvasRenderingContext2D,
      currentFrame: ImageData,
      intensity: number
    ) => {
      const glitchChance = intensity * 0.3
      
      if (Math.random() < glitchChance) {
        // RGB split
        const splitAmount = Math.floor(intensity * 15)
        const imageData = currentFrame
        
        for (let i = 0; i < imageData.data.length; i += 4) {
          // Shift red channel
          const redIndex = i + splitAmount * 4
          if (redIndex < imageData.data.length) {
            imageData.data[i] = imageData.data[redIndex] || imageData.data[i]
          }
          // Shift blue channel opposite
          const blueIndex = i - splitAmount * 4
          if (blueIndex >= 0) {
            imageData.data[i + 2] = imageData.data[blueIndex + 2] || imageData.data[i + 2]
          }
        }
        
        ctx.putImageData(imageData, 0, 0)
        
        // Random horizontal slice displacement
        if (Math.random() < 0.5) {
          const sliceY = Math.floor(Math.random() * canvas.height)
          const sliceHeight = Math.floor(Math.random() * 30 + 10)
          const displacement = Math.floor((Math.random() - 0.5) * 40 * intensity)
          
          const sliceData = ctx.getImageData(0, sliceY, canvas.width, sliceHeight)
          ctx.putImageData(sliceData, displacement, sliceY)
        }
      }
      
      previousFrameRef.current = currentFrame
    }

    const applyBreathSync = (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      video: HTMLVideoElement,
      intensity: number,
      speed: number
    ) => {
      const breathSpeed = 0.5 + speed * 2 // 0.5 - 2.5 Hz
      const breathPhase = Math.sin(timeRef.current * breathSpeed * Math.PI * 2)
      const scale = 1 + breathPhase * intensity * 0.1 // +/- 10% max
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      
      // Scale from center
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.scale(scale, scale)
      ctx.translate(-canvas.width / 2, -canvas.height / 2)
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Subtle brightness pulse
      ctx.fillStyle = `rgba(255, 255, 255, ${breathPhase * intensity * 0.05})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      ctx.restore()
    }

    const applyMemoryFade = (
      ctx: CanvasRenderingContext2D,
      currentFrame: ImageData,
      decay: number,
      intensity: number
    ) => {
      if (previousFrameRef.current) {
        const prev = previousFrameRef.current
        
        for (let i = 0; i < currentFrame.data.length; i += 4) {
          // Current frame colors
          const r = currentFrame.data[i]
          const g = currentFrame.data[i + 1]
          const b = currentFrame.data[i + 2]
          
          // Previous frame (faded)
          const pr = prev.data[i]
          const pg = prev.data[i + 1]
          const pb = prev.data[i + 2]
          
          // Desaturate previous frame
          const gray = (pr + pg + pb) / 3
          const fadedR = pr + (gray - pr) * intensity
          const fadedG = pg + (gray - pg) * intensity
          const fadedB = pb + (gray - pb) * intensity
          
          // Blend with decay
          currentFrame.data[i] = r * (1 - decay * 0.5) + fadedR * decay * 0.5
          currentFrame.data[i + 1] = g * (1 - decay * 0.5) + fadedG * decay * 0.5
          currentFrame.data[i + 2] = b * (1 - decay * 0.5) + fadedB * decay * 0.5
        }
        
        ctx.putImageData(currentFrame, 0, 0)
        
        // Add slight blur effect via canvas filter
        ctx.filter = `blur(${intensity * 2}px)`
        ctx.globalAlpha = decay * 0.3
        ctx.drawImage(canvas, 0, 0)
        ctx.filter = 'none'
        ctx.globalAlpha = 1
      }
      
      previousFrameRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height)
    }

    const applyLiquidTime = (
      ctx: CanvasRenderingContext2D,
      currentFrame: ImageData,
      width: number,
      height: number,
      speed: number
    ) => {
      // Wave distortion effect
      const waveAmplitude = 10 * speed
      const waveFrequency = 0.02
      const time = timeRef.current
      
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = width
      tempCanvas.height = height
      const tempCtx = tempCanvas.getContext('2d')!
      tempCtx.putImageData(currentFrame, 0, 0)
      
      ctx.clearRect(0, 0, width, height)
      
      // Draw with wave distortion
      for (let y = 0; y < height; y++) {
        const offset = Math.sin(y * waveFrequency + time * 2) * waveAmplitude
        ctx.drawImage(
          tempCanvas,
          0, y, width, 1,
          offset, y, width, 1
        )
      }
      
      previousFrameRef.current = ctx.getImageData(0, 0, width, height)
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
      <video
        ref={videoRef}
        src={videoUrl || undefined}
        onLoadedMetadata={handleVideoLoaded}
        className="hidden"
        loop
        muted
        playsInline
      />

      <canvas
        ref={canvasRef}
        className={`max-w-full max-h-full object-contain rounded-lg ${
          videoLoaded ? 'block' : 'hidden'
        }`}
        style={{
          boxShadow: effect ? '0 0 40px rgba(47, 129, 247, 0.3)' : undefined,
        }}
      />

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
