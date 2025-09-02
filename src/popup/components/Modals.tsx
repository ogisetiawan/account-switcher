import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { X } from "lucide-react"

interface SaveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (name: string) => void
  initialName?: string
}

export const SaveModal: React.FC<SaveModalProps> = ({
  open,
  onOpenChange,
  onSave,
  initialName = "Unnamed Session"
}) => {
  const [sessionName, setSessionName] = React.useState(initialName)

  const handleSave = () => {
    onSave(sessionName)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Save Session</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="p-4">
          <label htmlFor="sessionName" className="block text-sm font-medium mb-2">
            Session Name:
          </label>
          <Input
            id="sessionName"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="Enter session name"
          />
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface RenameModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRename: (name: string) => void
  currentName?: string
}

export const RenameModal: React.FC<RenameModalProps> = ({
  open,
  onOpenChange,
  onRename,
  currentName = ""
}) => {
  const [newName, setNewName] = React.useState(currentName)

  React.useEffect(() => {
    setNewName(currentName)
  }, [currentName])

  const handleRename = () => {
    onRename(newName)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Rename Session</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="p-4">
          <label htmlFor="newSessionName" className="block text-sm font-medium mb-2">
            New Name:
          </label>
          <Input
            id="newSessionName"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter new name"
          />
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleRename}>
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => void
  sessionName?: string
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  open,
  onOpenChange,
  onDelete,
  sessionName = ""
}) => {
  const handleDelete = () => {
    onDelete()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Delete Session</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="p-4">
          <p className="mb-2">
            Are you sure you want to delete this session "<strong>{sessionName}</strong>"?
          </p>
          <p className="text-red-600 text-sm">
            This action cannot be undone.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ErrorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  errorMessage?: string
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  open,
  onOpenChange,
  errorMessage = "An unexpected error occurred."
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Error</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="p-4">
          <p>{errorMessage}</p>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
