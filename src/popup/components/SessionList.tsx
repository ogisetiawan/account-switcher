import * as React from "react"
import { Card, CardContent } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { SessionData } from "../../shared/types/session.types"
import { Edit, Trash2 } from "lucide-react"

interface SessionListProps {
  sessions: SessionData[]
  onSessionSelect: (sessionId: string) => void
  onSessionRename: (sessionId: string) => void
  onSessionDelete: (sessionId: string) => void
  activeSessionId?: string
  isLoading?: boolean
}

export const SessionList: React.FC<SessionListProps> = ({
  sessions,
  onSessionSelect,
  onSessionRename,
  onSessionDelete,
  activeSessionId,
  isLoading = false
}) => {
  if (sessions.length === 0) {
    return (
      <div className="text-center text-gray-500 italic py-5">
        No sessions record this sites
      </div>
    )
  }

  return (
    <div className="max-h-80 overflow-y-auto space-y-2">
      {sessions.map((session) => (
        <Card 
          key={session.id} 
          className={`card transition-all cursor-pointer hover:border-blue-400 hover:shadow-md ${
            activeSessionId === session.id 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200'
          }`}
          onClick={() => onSessionSelect(session.id)}
        >
          <CardContent className="card-content p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-semibold text-slate-700 mb-1">
                  {session.name}
                </div>
                <div className="text-sm text-slate-500">
                  Created: {new Date(session.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-blue-600 hover:bg-blue-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSessionRename(session.id)
                  }}
                  disabled={isLoading}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:bg-red-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSessionDelete(session.id)
                  }}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
