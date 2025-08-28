import { storedSessionDefaultValue } from "@popup/utils/defaultValue";
import { MESSAGE_ACTIONS } from "@shared/constants/messages";
import { STORAGE_KEYS } from "@shared/constants/storageKeys";
import { ExtensionStorage, PopupState, SessionData, StoredSession } from "@shared/types";
import { getDomainFromUrl } from "@shared/utils/domain";
import { ExtensionError, handleError } from "@shared/utils/errorHandling";
import { generateId } from "@shared/utils/idGenerator";
import { validateSessionName } from "@shared/utils/validation";
import { ChromeApiService } from "./chromeApi.service";

export class PopupService {
  private chromeApi = new ChromeApiService();
  private state: PopupState = {
    currentDomain: "",
    currentTab: {} as chrome.tabs.Tab,
    sessions: [],
    activeSessions: {},
    currentRenameSessionId: "",
    currentDeleteSessionId: "",
  };

  async initialize(): Promise<PopupState> {
    try {
      console.log("Initializing PopupService...");

      this.state.currentTab = await this.chromeApi.getCurrentTab();
      if (!this.state.currentTab.url) {
        throw new ExtensionError("Unable to get current tab URL");
      }

      this.state.currentDomain = getDomainFromUrl(this.state.currentTab.url);
      console.log("Current domain:", this.state.currentDomain);

      await this.loadStorageData();
      console.log("Storage data loaded successfully");

      return { ...this.state };
    } catch (error) {
      console.error("PopupService initialization error:", error);
      // Return a basic state even if there's an error
      return {
        ...this.state,
        currentDomain: this.state.currentDomain || "unknown",
        sessions: [],
        activeSessions: {},
      };
    }
  }

  async saveCurrentSession(name: string): Promise<SessionData> {
    try {
      console.log("Saving current session:", name);
      const validatedName = validateSessionName(name);

      const response = await this.chromeApi.sendMessage<StoredSession | null>({
        action: MESSAGE_ACTIONS.GET_CURRENT_SESSION,
        domain: this.state.currentDomain,
        tabId: this.state.currentTab.id!,
      });

      if (!response.success) {
        // Create a default session if we can't get the current one
        const newSession: SessionData = {
          ...storedSessionDefaultValue,
          id: generateId(),
          name: validatedName,
          domain: this.state.currentDomain,
          createdAt: Date.now(),
          lastUsed: Date.now(),
        };

        this.state.sessions.push(newSession);
        this.state.activeSessions[this.state.currentDomain] = newSession.id;
        await this.saveStorageData();
        return newSession;
      }

      const storedSession = response.data ?? storedSessionDefaultValue;

      const newSession: SessionData = {
        ...storedSession,
        id: generateId(),
        name: validatedName,
        domain: this.state.currentDomain,
        createdAt: Date.now(),
        lastUsed: Date.now(),
      };

      this.state.sessions.push(newSession);
      this.state.activeSessions[this.state.currentDomain] = newSession.id;
      await this.saveStorageData();

      console.log("Session saved successfully:", newSession.id);
      return newSession;
    } catch (error) {
      console.error("Save session error:", error);
      throw new ExtensionError(handleError(error, "PopupService.saveCurrentSession"));
    }
  }

  async switchToSession(sessionId: string): Promise<void> {
    try {
      console.log("Switching to session:", sessionId);
      const session = this.state.sessions.find((s) => s.id === sessionId);
      if (!session) {
        throw new ExtensionError("Session not found");
      }

      const response = await this.chromeApi.sendMessage({
        action: MESSAGE_ACTIONS.SWITCH_SESSION,
        sessionData: session,
        tabId: this.state.currentTab.id!,
      });

      if (!response.success) {
        // Even if switching fails, update the active session in our state
        this.state.activeSessions[this.state.currentDomain] = sessionId;
        session.lastUsed = Date.now();
        await this.saveStorageData();
        return;
      }

      this.state.activeSessions[this.state.currentDomain] = sessionId;
      session.lastUsed = Date.now();

      await this.saveStorageData();
      console.log("Session switched successfully");
    } catch (error) {
      console.error("Switch session error:", error);
      throw new ExtensionError(handleError(error, "PopupService.switchToSession"));
    }
  }

  async createNewSession(): Promise<void> {
    try {
      console.log("Creating new session");
      const response = await this.chromeApi.sendMessage({
        action: MESSAGE_ACTIONS.CLEAR_SESSION,
        domain: this.state.currentDomain,
        tabId: this.state.currentTab.id!,
      });

      if (!response.success) {
        // Even if clearing fails, update our state
        delete this.state.activeSessions[this.state.currentDomain];
        await this.saveStorageData();
        return;
      }

      delete this.state.activeSessions[this.state.currentDomain];
      await this.saveStorageData();
      console.log("New session created successfully");
    } catch (error) {
      console.error("Create new session error:", error);
      throw new ExtensionError(handleError(error, "PopupService.createNewSession"));
    }
  }

  async renameSession(sessionId: string, newName: string): Promise<void> {
    try {
      console.log("Renaming session:", sessionId, "to:", newName);
      const session = this.state.sessions.find((s) => s.id === sessionId);
      if (!session) {
        throw new ExtensionError("Session not found");
      }

      session.name = validateSessionName(newName);
      await this.saveStorageData();
      console.log("Session renamed successfully");
    } catch (error) {
      console.error("Rename session error:", error);
      throw new ExtensionError(handleError(error, "PopupService.renameSession"));
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      console.log("Deleting session:", sessionId);
      this.state.sessions = this.state.sessions.filter((s) => s.id !== sessionId);

      if (this.state.activeSessions[this.state.currentDomain] === sessionId) {
        delete this.state.activeSessions[this.state.currentDomain];
      }

      await this.saveStorageData();
      console.log("Session deleted successfully");
    } catch (error) {
      console.error("Delete session error:", error);
      throw new ExtensionError(handleError(error, "PopupService.deleteSession"));
    }
  }

  getSession(sessionId: string): SessionData | undefined {
    return this.state.sessions.find((s) => s.id === sessionId);
  }

  getState(): PopupState {
    return { ...this.state };
  }

  setState(newState: Partial<PopupState>): void {
    this.state = { ...this.state, ...newState };
  }

  private async loadStorageData(): Promise<void> {
    try {
      console.log("Loading storage data...");
      const result = await this.chromeApi.getStorageData<ExtensionStorage>([
        STORAGE_KEYS.SESSIONS,
        STORAGE_KEYS.ACTIVE_SESSIONS,
      ]);

      this.state.sessions = result[STORAGE_KEYS.SESSIONS] || [];
      this.state.activeSessions = result[STORAGE_KEYS.ACTIVE_SESSIONS] || {};

      console.log("Sessions loaded:", this.state.sessions.length);
      console.log("Active sessions:", Object.keys(this.state.activeSessions).length);
    } catch (error) {
      console.error("Error loading storage data:", error);
      // Use empty defaults if storage fails
      this.state.sessions = [];
      this.state.activeSessions = {};
    }
  }

  private async saveStorageData(): Promise<void> {
    try {
      console.log("Saving storage data...");
      await this.chromeApi.setStorageData({
        [STORAGE_KEYS.SESSIONS]: this.state.sessions,
        [STORAGE_KEYS.ACTIVE_SESSIONS]: this.state.activeSessions,
      });
      console.log("Storage data saved successfully");
    } catch (error) {
      console.error("Error saving storage data:", error);
      throw new Error("Failed to save storage data");
    }
  }
}
