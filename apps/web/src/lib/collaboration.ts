import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb'

export interface User {
  id: string
  name: string
  color: string
}

export interface EffectClip {
  id: string
  type: string
  name: string
  startTime: number
  endTime: number
  params: Record<string, number>
}

export interface CollaborationState {
  doc: Y.Doc
  provider: WebsocketProvider | null
  persistence: IndexeddbPersistence | null
  awareness: WebsocketProvider['awareness'] | null
}

// Generate a random user color
function generateUserColor(): string {
  const colors = [
    '#2f81f7', // blue
    '#3fb950', // green  
    '#a371f7', // purple
    '#f778ba', // pink
    '#ffa657', // orange
    '#79c0ff', // light blue
    '#7ee787', // light green
    '#d2a8ff', // light purple
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Generate a random user name
function generateUserName(): string {
  const adjectives = ['Swift', 'Clever', 'Brave', 'Bright', 'Quick', 'Sharp', 'Bold', 'Calm']
  const nouns = ['Editor', 'Creator', 'Artist', 'Maker', 'Builder', 'Designer', 'Crafter', 'Wizard']
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`
}

// Create or get user from localStorage
export function getLocalUser(): User {
  if (typeof window === 'undefined') {
    return { id: 'server', name: 'Server', color: '#888' }
  }
  
  const stored = localStorage.getItem('tempo-user')
  if (stored) {
    return JSON.parse(stored)
  }
  
  const user: User = {
    id: Math.random().toString(36).substring(2, 9),
    name: generateUserName(),
    color: generateUserColor(),
  }
  localStorage.setItem('tempo-user', JSON.stringify(user))
  return user
}

// Initialize collaboration for a project
export function initCollaboration(projectId: string): CollaborationState {
  const doc = new Y.Doc()
  
  // Initialize shared types
  doc.getArray<EffectClip>('effects')
  doc.getMap('video')
  doc.getMap('playback')
  
  let provider: WebsocketProvider | null = null
  let persistence: IndexeddbPersistence | null = null
  
  // Only run in browser
  if (typeof window !== 'undefined') {
    // Local persistence with IndexedDB
    persistence = new IndexeddbPersistence(`tempo-${projectId}`, doc)
    
    // Try to connect to WebSocket server (will gracefully fail if not available)
    try {
      // Use a public Yjs demo server for testing
      // In production, you'd use your own server
      provider = new WebsocketProvider(
        'wss://demos.yjs.dev/ws', // Public demo server
        `tempo-${projectId}`,
        doc,
        { connect: true }
      )
      
      // Set user awareness
      const user = getLocalUser()
      provider.awareness.setLocalStateField('user', user)
      provider.awareness.setLocalStateField('cursor', null)
    } catch (e) {
      console.warn('WebSocket connection failed, running in offline mode')
    }
  }
  
  return {
    doc,
    provider,
    persistence,
    awareness: provider?.awareness || null,
  }
}

// Clean up collaboration
export function destroyCollaboration(state: CollaborationState) {
  state.provider?.destroy()
  state.persistence?.destroy()
  state.doc.destroy()
}

