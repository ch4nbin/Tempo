// =============================================================================
// API Client - Communicates with the Go backend
// =============================================================================
// This is a simple fetch wrapper that:
// 1. Adds the base URL automatically
// 2. Handles JSON encoding/decoding
// 3. Attaches JWT tokens to requests
// 4. Handles errors consistently
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// Types for API responses
export interface User {
  id: string
  email: string
  name: string
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  user: User
  access_token: string
  refresh_token: string
}

export interface Project {
  id: string
  owner_id: string
  name: string
  description: string
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
  role: 'owner' | 'editor' | 'viewer'
  collaborators?: Collaborator[]
}

export interface Collaborator {
  user_id: string
  email: string
  name: string
  role: 'owner' | 'editor' | 'viewer'
  joined_at: string
}

export interface ProjectListResponse {
  projects: Project[]
  total_count: number
  page: number
  per_page: number
}

export interface ApiError {
  error: string
}

// Token storage - in a real app, consider httpOnly cookies for security
const TOKEN_KEY = 'tempo_access_token'
const REFRESH_TOKEN_KEY = 'tempo_refresh_token'

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

// Generic fetch wrapper
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Add auth token if available
  const token = getAccessToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Handle non-JSON responses
  const contentType = response.headers.get('content-type')
  if (!contentType?.includes('application/json')) {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return {} as T
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error((data as ApiError).error || 'Request failed')
  }

  return data as T
}

// =============================================================================
// Auth API
// =============================================================================

export async function register(
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> {
  const response = await fetchAPI<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  })
  setTokens(response.access_token, response.refresh_token)
  return response
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetchAPI<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setTokens(response.access_token, response.refresh_token)
  return response
}

export async function refreshTokens(): Promise<AuthResponse> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error('No refresh token')
  }
  
  const response = await fetchAPI<AuthResponse>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  setTokens(response.access_token, response.refresh_token)
  return response
}

export async function getMe(): Promise<User> {
  return fetchAPI<User>('/api/auth/me')
}

export function logout(): void {
  clearTokens()
}

// =============================================================================
// Projects API
// =============================================================================

export async function createProject(
  name: string,
  description?: string
): Promise<Project> {
  return fetchAPI<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  })
}

export async function listProjects(
  page = 1,
  perPage = 20
): Promise<ProjectListResponse> {
  return fetchAPI<ProjectListResponse>(
    `/api/projects?page=${page}&per_page=${perPage}`
  )
}

export async function getProject(id: string): Promise<Project> {
  return fetchAPI<Project>(`/api/projects/${id}`)
}

export async function updateProject(
  id: string,
  name?: string,
  description?: string
): Promise<Project> {
  return fetchAPI<Project>(`/api/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name, description }),
  })
}

export async function deleteProject(id: string): Promise<void> {
  await fetchAPI<void>(`/api/projects/${id}`, {
    method: 'DELETE',
  })
}

// =============================================================================
// Health Check
// =============================================================================

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    return response.ok
  } catch {
    return false
  }
}

