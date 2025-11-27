'use client'

interface Collaborator {
  clientId: number
  user: {
    id: string
    name: string
    color: string
  }
  cursor: number | null
  selection: [number, number] | null
}

interface CollaboratorCursorsProps {
  collaborators: Collaborator[]
  pixelsPerSecond: number
  offsetLeft: number
}

export function CollaboratorCursors({
  collaborators,
  pixelsPerSecond,
  offsetLeft,
}: CollaboratorCursorsProps) {
  return (
    <>
      {collaborators.map((collab) => {
        if (collab.cursor === null) return null
        
        const cursorX = offsetLeft + collab.cursor * pixelsPerSecond
        
        return (
          <div
            key={collab.clientId}
            className="absolute top-0 bottom-0 pointer-events-none z-30 transition-all duration-75"
            style={{ left: cursorX }}
          >
            {/* Cursor line */}
            <div
              className="w-0.5 h-full opacity-70"
              style={{ backgroundColor: collab.user.color }}
            />
            
            {/* User label */}
            <div
              className="absolute -top-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-medium text-white whitespace-nowrap shadow-lg"
              style={{ backgroundColor: collab.user.color }}
            >
              {collab.user.name}
            </div>
            
            {/* Selection highlight */}
            {collab.selection && (
              <div
                className="absolute top-0 bottom-0 opacity-20"
                style={{
                  backgroundColor: collab.user.color,
                  left: (collab.selection[0] - collab.cursor) * pixelsPerSecond,
                  width: (collab.selection[1] - collab.selection[0]) * pixelsPerSecond,
                }}
              />
            )}
          </div>
        )
      })}
    </>
  )
}

