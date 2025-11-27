'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import * as Y from 'yjs'
import {
  initCollaboration,
  destroyCollaboration,
  getLocalUser,
  type CollaborationState,
  type User,
  type EffectClip,
} from '@/lib/collaboration'

interface AwarenessState {
  user: User
  cursor: number | null // Timeline cursor position
  selection: [number, number] | null // Selected time range
}

interface UseCollaborationReturn {
  // Connection state
  isConnected: boolean
  isSynced: boolean
  
  // Current user
  currentUser: User
  
  // Other users' presence
  collaborators: Array<AwarenessState & { clientId: number }>
  
  // Effects (CRDT-synced)
  effects: EffectClip[]
  addEffect: (effect: EffectClip) => void
  updateEffect: (id: string, updates: Partial<EffectClip>) => void
  removeEffect: (id: string) => void
  
  // Cursor presence
  updateCursor: (position: number | null) => void
  updateSelection: (selection: [number, number] | null) => void
}

export function useCollaboration(projectId: string): UseCollaborationReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [isSynced, setIsSynced] = useState(false)
  const [effects, setEffects] = useState<EffectClip[]>([])
  const [collaborators, setCollaborators] = useState<Array<AwarenessState & { clientId: number }>>([])
  const [currentUser, setCurrentUser] = useState<User>({ 
    id: 'loading', 
    name: 'Loading...', 
    color: '#2f81f7' 
  })
  
  const stateRef = useRef<CollaborationState | null>(null)
  const effectsArrayRef = useRef<Y.Array<EffectClip> | null>(null)

  // Set user on client side only
  useEffect(() => {
    setCurrentUser(getLocalUser())
  }, [])

  useEffect(() => {
    // Initialize collaboration
    const state = initCollaboration(projectId)
    stateRef.current = state
    
    // Get shared effects array
    const effectsArray = state.doc.getArray<EffectClip>('effects')
    effectsArrayRef.current = effectsArray
    
    // Sync effects state
    const updateEffects = () => {
      setEffects(effectsArray.toArray())
    }
    effectsArray.observe(updateEffects)
    updateEffects()
    
    // Handle connection status
    if (state.provider) {
      const updateConnectionStatus = () => {
        setIsConnected(state.provider?.wsconnected || false)
      }
      
      state.provider.on('status', updateConnectionStatus)
      updateConnectionStatus()
      
      // Handle awareness (other users)
      const updateAwareness = () => {
        if (!state.awareness) return
        
        const states: Array<AwarenessState & { clientId: number }> = []
        state.awareness.getStates().forEach((awarenessState, clientId) => {
          // Skip self
          if (clientId === state.awareness?.clientID) return
          
          if (awarenessState.user) {
            states.push({
              clientId,
              user: awarenessState.user as User,
              cursor: awarenessState.cursor as number | null,
              selection: awarenessState.selection as [number, number] | null,
            })
          }
        })
        setCollaborators(states)
      }
      
      state.awareness?.on('change', updateAwareness)
      updateAwareness()
    }
    
    // Handle local persistence sync
    if (state.persistence) {
      state.persistence.on('synced', () => {
        setIsSynced(true)
      })
    }
    
    return () => {
      destroyCollaboration(state)
    }
  }, [projectId])

  const addEffect = useCallback((effect: EffectClip) => {
    effectsArrayRef.current?.push([effect])
  }, [])

  const updateEffect = useCallback((id: string, updates: Partial<EffectClip>) => {
    const arr = effectsArrayRef.current
    if (!arr) return
    
    const index = arr.toArray().findIndex(e => e.id === id)
    if (index === -1) return
    
    const current = arr.get(index)
    arr.delete(index, 1)
    arr.insert(index, [{ ...current, ...updates }])
  }, [])

  const removeEffect = useCallback((id: string) => {
    const arr = effectsArrayRef.current
    if (!arr) return
    
    const index = arr.toArray().findIndex(e => e.id === id)
    if (index !== -1) {
      arr.delete(index, 1)
    }
  }, [])

  const updateCursor = useCallback((position: number | null) => {
    stateRef.current?.awareness?.setLocalStateField('cursor', position)
  }, [])

  const updateSelection = useCallback((selection: [number, number] | null) => {
    stateRef.current?.awareness?.setLocalStateField('selection', selection)
  }, [])

  return {
    isConnected,
    isSynced,
    currentUser,
    collaborators,
    effects,
    addEffect,
    updateEffect,
    removeEffect,
    updateCursor,
    updateSelection,
  }
}

