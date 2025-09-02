import * as React from "react";
import { Header } from "./components/Header";
import { ActionButtons } from "./components/ActionButtons";
import { SessionList } from "./components/SessionList";
import { SaveModal, RenameModal, DeleteModal, ErrorModal } from "./components/Modals";
import { SessionData } from "../shared/types/session.types";

interface AppState {
  currentSite: string
  sessions: SessionData[]
  activeSessionId?: string
  isLoading: boolean
  modals: {
    save: boolean
    rename: boolean
    delete: boolean
    error: boolean
  }
  selectedSessionId?: string
  errorMessage: string
}

export const App: React.FC = () => {
  const [state, setState] = React.useState<AppState>({
    currentSite: "Connecting...",
    sessions: [],
    isLoading: false,
    modals: {
      save: false,
      rename: false,
      delete: false,
      error: false
    },
    errorMessage: ""
  })

  // Load initial data
  React.useEffect(() => {
    console.log("Loading initial data...")
    loadInitialData()
  }, [])

     const loadInitialData = async () => {
     try {
       setState(prev => ({ ...prev, isLoading: true }))
       
       // Check if we're in extension environment
       if (typeof chrome === 'undefined' || !chrome.tabs) {
         setState(prev => ({
           ...prev,
           currentSite: 'localhost',
           isLoading: false
         }))
         return
       }
       
       // Get current tab info
       const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
       const currentTab = tabs[0]
       const domain = currentTab?.url ? new URL(currentTab.url).hostname : 'unknown'
       
       // Load sessions for this domain
       const result = await chrome.storage.local.get(['sessions', 'activeSessions'])
       const allSessions: SessionData[] = result.sessions || []
       const activeSessions = result.activeSessions || {}
       
       const domainSessions = allSessions.filter(session => session.domain === domain)
       const activeSessionId = activeSessions[domain]

       setState(prev => ({
         ...prev,
         currentSite: domain,
         sessions: domainSessions,
         activeSessionId,
         isLoading: false
       }))
     } catch (error) {
       console.error('Failed to load initial data:', error)
       setState(prev => ({
         ...prev,
         isLoading: false,
         modals: { ...prev.modals, error: true },
         errorMessage: 'Failed to load session data. Make sure extension is properly installed.'
       }))
     }
   }

  const handleSaveSession = () => {
    setState(prev => ({
      ...prev,
      modals: { ...prev.modals, save: true }
    }))
  }

  const handleNewSession = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      if (typeof chrome === 'undefined' || !chrome.runtime) {
        throw new Error('Chrome extension API not available')
      }
      
      // Send message to background script
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      await chrome.runtime.sendMessage({
        action: 'clearSession',
        domain: state.currentSite,
        tabId: tabs[0].id
      })
      
      // Reload sessions
      await loadInitialData()
    } catch (error) {
      console.error('Failed to create new session:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        modals: { ...prev.modals, error: true },
        errorMessage: 'Failed to create new session: ' + (error as Error).message
      }))
    }
  }

  const handleSessionSelect = async (sessionId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      if (typeof chrome === 'undefined' || !chrome.storage) {
        throw new Error('Chrome extension API not available')
      }
      
      // Get session data first
      const result = await chrome.storage.local.get(['sessions'])
      const allSessions: SessionData[] = result.sessions || []
      const sessionData = allSessions.find(s => s.id === sessionId)
      
      if (sessionData) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        await chrome.runtime.sendMessage({
          action: 'switchSession',
          sessionData,
          tabId: tabs[0].id
        })
        
        // Update active session
        const activeSessions = (await chrome.storage.local.get(['activeSessions'])).activeSessions || {}
        activeSessions[state.currentSite] = sessionId
        await chrome.storage.local.set({ activeSessions })
      }
      
      await loadInitialData()
    } catch (error) {
      console.error('Failed to switch session:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        modals: { ...prev.modals, error: true },
        errorMessage: 'Failed to switch session: ' + (error as Error).message
      }))
    }
  }

  const handleSessionRename = (sessionId: string) => {
    setState(prev => ({
      ...prev,
      selectedSessionId: sessionId,
      modals: { ...prev.modals, rename: true }
    }))
  }

  const handleSessionDelete = (sessionId: string) => {
    setState(prev => ({
      ...prev,
      selectedSessionId: sessionId,
      modals: { ...prev.modals, delete: true }
    }))
  }

  const onSaveSession = async (name: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
             // Get current session data
       const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
       const currentTab = tabs[0]
       
       const currentSession = await chrome.runtime.sendMessage({
         action: 'getCurrentSession',
         domain: state.currentSite,
         tabId: currentTab.id
       })
       
       if (currentSession.success) {
         // Save session to storage
         const result = await chrome.storage.local.get(['sessions'])
         const allSessions: SessionData[] = result.sessions || []
         
         const newSession: SessionData = {
           id: Date.now().toString(),
           name,
           domain: state.currentSite,
           createdAt: Date.now(),
           lastUsed: Date.now(),
           ...currentSession.data
         }
         
         allSessions.push(newSession)
         await chrome.storage.local.set({ sessions: allSessions })
       }
      
      await loadInitialData()
    } catch (error) {
      console.error('Failed to save session:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        modals: { ...prev.modals, error: true },
        errorMessage: 'Failed to save session'
      }))
    }
  }

  const onRenameSession = async (newName: string) => {
    if (!state.selectedSessionId) return
    
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
             // Update session name in storage
       const result = await chrome.storage.local.get(['sessions'])
       const allSessions: SessionData[] = result.sessions || []
       
       const sessionIndex = allSessions.findIndex(s => s.id === state.selectedSessionId)
       if (sessionIndex >= 0) {
         allSessions[sessionIndex].name = newName
         await chrome.storage.local.set({ sessions: allSessions })
       }
      
      await loadInitialData()
    } catch (error) {
      console.error('Failed to rename session:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        modals: { ...prev.modals, error: true },
        errorMessage: 'Failed to rename session'
      }))
    }
  }

  const onDeleteSession = async () => {
    if (!state.selectedSessionId) return
    
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
             // Remove session from storage
       const result = await chrome.storage.local.get(['sessions'])
       const allSessions: SessionData[] = result.sessions || []
       
       const filteredSessions = allSessions.filter(s => s.id !== state.selectedSessionId)
       await chrome.storage.local.set({ sessions: filteredSessions })
      
      await loadInitialData()
    } catch (error) {
      console.error('Failed to delete session:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        modals: { ...prev.modals, error: true },
        errorMessage: 'Failed to delete session'
      }))
    }
  }

  const closeModal = (modalName: keyof AppState['modals']) => {
    setState(prev => ({
      ...prev,
      modals: { ...prev.modals, [modalName]: false },
      selectedSessionId: undefined
    }))
  }

  const selectedSession = state.sessions.find(s => s.id === state.selectedSessionId)

  return (
    <div className="w-full h-full">
      <Header currentSite={state.currentSite} />
      
      <main className="p-4">
        <ActionButtons
          onSaveSession={handleSaveSession}
          onNewSession={handleNewSession}
          isLoading={state.isLoading}
        />
        
        <div className="mt-5">
          <h3 className="text-base font-semibold mb-3 text-slate-600">
            Saved Sessions
          </h3>
          <SessionList
            sessions={state.sessions}
            onSessionSelect={handleSessionSelect}
            onSessionRename={handleSessionRename}
            onSessionDelete={handleSessionDelete}
            activeSessionId={state.activeSessionId}
            isLoading={state.isLoading}
          />
        </div>
      </main>
      
      <footer className="text-center text-sm text-slate-500 p-2">
        <span>qnr.dev</span>
      </footer>

      {/* Modals */}
      <SaveModal
        open={state.modals.save}
        onOpenChange={(open) => closeModal('save')}
        onSave={onSaveSession}
      />
      
      <RenameModal
        open={state.modals.rename}
        onOpenChange={(open) => closeModal('rename')}
        onRename={onRenameSession}
        currentName={selectedSession?.name}
      />
      
      <DeleteModal
        open={state.modals.delete}
        onOpenChange={(open) => closeModal('delete')}
        onDelete={onDeleteSession}
        sessionName={selectedSession?.name}
      />
      
      <ErrorModal
        open={state.modals.error}
        onOpenChange={(open) => closeModal('error')}
        errorMessage={state.errorMessage}
      />
    </div>
  )
}
