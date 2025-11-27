/**
 * API client for Tempo backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export interface ApiError {
  message: string
  status: number
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = {
      message: await response.text(),
      status: response.status,
    }
    throw error
  }
  return response.json()
}

// Health check
export async function healthCheck() {
  const res = await fetch(`${API_BASE}/health`)
  return handleResponse<{ status: string; service: string; version: string }>(res)
}

// Projects
export interface Project {
  id: string
  name: string
  description?: string
  videoId?: string
  effects: Effect[]
  createdAt: string
  updatedAt: string
}

export interface Effect {
  id: string
  type: string
  name: string
  startTime: number
  endTime: number
  params: Record<string, number>
}

export async function listProjects() {
  const res = await fetch(`${API_BASE}/api/v1/projects`)
  return handleResponse<{ projects: Project[]; total: number }>(res)
}

export async function createProject(name: string, description?: string) {
  const res = await fetch(`${API_BASE}/api/v1/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  })
  return handleResponse<Project>(res)
}

export async function getProject(id: string) {
  const res = await fetch(`${API_BASE}/api/v1/projects/${id}`)
  return handleResponse<Project>(res)
}

// Videos
export interface Video {
  id: string
  filename: string
  size: number
  contentType: string
  duration?: number
  width?: number
  height?: number
  url: string
  createdAt: string
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export async function uploadVideo(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<Video> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const formData = new FormData()
    formData.append('video', file)

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percentage: Math.round((e.loaded / e.total) * 100),
        })
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText))
      } else {
        reject({ message: xhr.responseText, status: xhr.status })
      }
    })

    xhr.addEventListener('error', () => {
      reject({ message: 'Upload failed', status: 0 })
    })

    xhr.open('POST', `${API_BASE}/api/v1/videos/upload`)
    xhr.send(formData)
  })
}

export async function getVideo(id: string) {
  const res = await fetch(`${API_BASE}/api/v1/videos/${id}`)
  return handleResponse<Video>(res)
}

// Effects catalog
export interface EffectDefinition {
  id: string
  name: string
  description: string
  category: string
  params: ParamDefinition[]
}

export interface ParamDefinition {
  name: string
  type: string
  min: number
  max: number
  default: number
  description: string
}

export async function listEffects() {
  const res = await fetch(`${API_BASE}/api/v1/effects`)
  return handleResponse<{ effects: EffectDefinition[]; total: number }>(res)
}

// AI Generation
export interface GeneratedEffect {
  type: string
  params: Record<string, number>
}

export interface GenerateEffectResponse {
  effects: GeneratedEffect[]
  reasoning: string
}

export async function generateEffect(prompt: string) {
  const res = await fetch(`${API_BASE}/api/v1/ai/generate-effect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  return handleResponse<GenerateEffectResponse>(res)
}

// Export
export interface ExportJob {
  id: string
  projectId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  url?: string
  error?: string
  createdAt: string
  updatedAt: string
}

export async function startExport(projectId: string, format = 'mp4', quality = 'high') {
  const res = await fetch(`${API_BASE}/api/v1/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, format, quality }),
  })
  return handleResponse<ExportJob>(res)
}

export async function getExportStatus(exportId: string) {
  const res = await fetch(`${API_BASE}/api/v1/export/${exportId}/status`)
  return handleResponse<ExportJob>(res)
}

