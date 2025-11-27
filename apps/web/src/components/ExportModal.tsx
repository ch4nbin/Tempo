'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  canvasRef?: React.RefObject<HTMLCanvasElement | null>
  videoRef?: React.RefObject<HTMLVideoElement | null>
}

type ExportStatus = 'idle' | 'recording' | 'processing' | 'completed' | 'failed'

export function ExportModal({ isOpen, onClose, canvasRef, videoRef }: ExportModalProps) {
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('high')
  const [status, setStatus] = useState<ExportStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const cancelledRef = useRef(false)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  const getBitrate = () => {
    switch (quality) {
      case 'low': return 2500000
      case 'medium': return 5000000
      case 'high': return 10000000
    }
  }

  const handleExport = useCallback(async () => {
    const canvas = canvasRef?.current
    const video = videoRef?.current

    if (!canvas || !video) {
      setError('No video loaded. Please load a video first.')
      return
    }

    if (video.duration === 0 || isNaN(video.duration)) {
      setError('Video not ready. Please wait for it to load.')
      return
    }

    setStatus('recording')
    setProgress(0)
    setError(null)
    setDownloadUrl(null)
    chunksRef.current = []
    cancelledRef.current = false

    try {
      // Disable loop for export
      const wasLooping = video.loop
      video.loop = false

      // Get canvas stream
      const stream = canvas.captureStream(30)
      
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
        ? 'video/webm;codecs=vp8'
        : 'video/webm'

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: getBitrate(),
      })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        // Clear progress interval
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
          progressIntervalRef.current = null
        }

        // Don't process if cancelled
        if (cancelledRef.current) {
          video.loop = wasLooping
          return
        }

        setStatus('processing')
        
        setTimeout(() => {
          const blob = new Blob(chunksRef.current, { type: mimeType })
          const url = URL.createObjectURL(blob)
          setDownloadUrl(url)
          setStatus('completed')
          setProgress(100)
          
          // Restore loop setting
          video.loop = wasLooping
        }, 500)
      }

      mediaRecorder.onerror = () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
        }
        video.loop = wasLooping
        setStatus('failed')
        setError('Recording failed. Please try again.')
      }

      // Start recording
      mediaRecorder.start(100)

      // Seek to start and play
      video.currentTime = 0
      
      // Wait a moment for seek to complete
      await new Promise(resolve => setTimeout(resolve, 100))
      
      await video.play()

      // Progress tracking with interval
      const duration = video.duration
      progressIntervalRef.current = setInterval(() => {
        if (video.currentTime > 0) {
          const pct = Math.min((video.currentTime / duration) * 100, 99)
          setProgress(pct)
        }
      }, 100)

      // Stop when video ends
      const handleEnded = () => {
        video.removeEventListener('ended', handleEnded)
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      }
      video.addEventListener('ended', handleEnded)

      // Fallback timeout in case ended event doesn't fire
      const timeoutId = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          video.removeEventListener('ended', handleEnded)
          mediaRecorderRef.current.stop()
        }
      }, (duration + 2) * 1000)

      // Clean up timeout when recorder stops
      const originalOnStop = mediaRecorder.onstop
      mediaRecorder.onstop = (e) => {
        clearTimeout(timeoutId)
        if (originalOnStop) originalOnStop.call(mediaRecorder, e)
      }

    } catch (err) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      setStatus('failed')
      setError(err instanceof Error ? err.message : 'Export failed')
    }
  }, [canvasRef, videoRef, quality])

  const handleCancel = useCallback(() => {
    // Set cancelled flag BEFORE stopping recorder
    cancelledRef.current = true
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (videoRef?.current) {
      videoRef.current.pause()
      videoRef.current.loop = true
    }
    setStatus('idle')
    setProgress(0)
  }, [videoRef])

  const handleClose = useCallback(() => {
    handleCancel()
    setDownloadUrl(null)
    setError(null)
    onClose()
  }, [handleCancel, onClose])

  const handleDownload = useCallback(() => {
    if (downloadUrl) {
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `tempo-export-${Date.now()}.webm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }, [downloadUrl])

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

        {status === 'idle' && (
          <div className="space-y-6">
            <div className="p-3 bg-tempo-bg rounded-lg border border-tempo-border space-y-2">
              <p className="text-sm text-tempo-text-muted">
                <span className="text-tempo-accent font-medium">Client-side export:</span> Records your video with effects applied directly in the browser.
              </p>
              <p className="text-xs text-tempo-text-muted">
                <span className="font-medium">Format:</span> WebM (browser-native). Convert to MP4 using <a href="https://cloudconvert.com/webm-to-mp4" target="_blank" rel="noopener noreferrer" className="text-tempo-accent hover:underline">CloudConvert</a> if needed.
              </p>
            </div>

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
                {quality === 'low' && '2.5 Mbps • Smaller file'}
                {quality === 'medium' && '5 Mbps • Balanced'}
                {quality === 'high' && '10 Mbps • Best quality'}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleExport}
              className="w-full py-3 bg-tempo-accent hover:bg-tempo-accent-dim text-white rounded-lg transition-colors font-medium"
            >
              Start Export
            </button>
            
            <p className="text-xs text-tempo-text-muted text-center">
              Video will play through once while recording
            </p>
          </div>
        )}

        {(status === 'recording' || status === 'processing') && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-tempo-accent/20 flex items-center justify-center">
                {status === 'recording' ? (
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                ) : (
                  <svg className="w-5 h-5 text-tempo-accent animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-medium">
                  {status === 'recording' ? 'Recording...' : 'Processing...'}
                </p>
                <p className="text-sm text-tempo-text-muted">
                  {status === 'recording' 
                    ? 'Playing video with effects' 
                    : 'Creating video file'}
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-tempo-text-muted">Progress</span>
                <span className="font-mono">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-tempo-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-tempo-accent transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {status === 'recording' && (
              <button
                onClick={handleCancel}
                className="w-full py-3 bg-tempo-border hover:bg-tempo-border/80 text-tempo-text rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        )}

        {status === 'completed' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Export Complete!</p>
                <p className="text-sm text-tempo-text-muted">Your video is ready</p>
              </div>
            </div>

            <button
              onClick={handleDownload}
              className="w-full py-3 bg-tempo-accent hover:bg-tempo-accent-dim text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Video
            </button>

            <button
              onClick={() => {
                setStatus('idle')
                setDownloadUrl(null)
                setProgress(0)
              }}
              className="w-full py-3 bg-tempo-border hover:bg-tempo-border/80 text-tempo-text rounded-lg transition-colors"
            >
              Export Another
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Export Failed</p>
                <p className="text-sm text-tempo-text-muted">{error || 'Something went wrong'}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setStatus('idle')
                setError(null)
              }}
              className="w-full py-3 bg-tempo-border hover:bg-tempo-border/80 text-tempo-text rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
