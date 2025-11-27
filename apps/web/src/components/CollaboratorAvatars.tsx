'use client'

interface User {
  id: string
  name: string
  color: string
}

interface CollaboratorAvatarsProps {
  currentUser: User
  collaborators: Array<{
    user: User
    cursor: number | null
  }>
  isConnected: boolean
}

export function CollaboratorAvatars({
  currentUser,
  collaborators,
  isConnected,
}: CollaboratorAvatarsProps) {
  const allUsers = [
    { user: currentUser, isYou: true, isActive: true },
    ...collaborators.map((c) => ({ 
      user: c.user, 
      isYou: false, 
      isActive: c.cursor !== null 
    })),
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-tempo-text-muted">
          Collaborators
        </h2>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400' : 'bg-yellow-400'
            }`}
          />
          <span className="text-[10px] text-tempo-text-muted">
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {allUsers.map(({ user, isYou, isActive }) => (
          <div key={user.id} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0"
              style={{ backgroundColor: user.color }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">
                {user.name}
                {isYou && (
                  <span className="text-tempo-text-muted ml-1">(you)</span>
                )}
              </p>
            </div>
            <span
              className={`w-2 h-2 rounded-full ${
                isActive ? 'bg-green-400' : 'bg-tempo-text-muted'
              }`}
            />
          </div>
        ))}
      </div>

      {collaborators.length === 0 && (
        <p className="text-xs text-tempo-text-muted">
          Share this project to collaborate in real-time
        </p>
      )}
    </div>
  )
}

