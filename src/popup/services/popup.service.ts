import { storedSessionDefaultValue } from "@popup/utils/defaultValue";
import { MESSAGE_ACTIONS } from "@shared/constants/messages";
import { STORAGE_KEYS } from "@shared/constants/storageKeys";
import {
  ExtensionStorage,
  ImportResult,
  PopupState,
  SessionBackup,
  SessionBackupWebsite,
  SessionData,
  StoredSession,
} from "@shared/types";
import { getDomainFromUrl } from "@shared/utils/domain";
import { ExtensionError, handleError } from "@shared/utils/errorHandling";
import { generateId } from "@shared/utils/idGenerator";
import { validateSessionName } from "@shared/utils/validation";
import { ChromeApiService } from "./chromeApi.service";

export class PopupService {
  private static readonly BACKUP_FORMAT = "account-switcher-backup";
  private static readonly BACKUP_VERSION = 1;
  private static readonly MAX_IMPORT_WEBSITES = 1000;
  private static readonly MAX_IMPORT_SESSIONS = 10000;

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
      this.state.currentTab = await this.chromeApi.getCurrentTab();
      if (!this.state.currentTab.url) {
        throw new ExtensionError("Unable to get current tab URL");
      }

      this.state.currentDomain = getDomainFromUrl(this.state.currentTab.url);

      await this.loadStorageData();
      await this.syncActiveSessionFromCurrentState();

      return { ...this.state };
    } catch (error) {
      console.error("PopupService initialization error:", error);
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
      const validatedName = validateSessionName(name);

      const response = await this.chromeApi.sendMessage<StoredSession | null>({
        action: MESSAGE_ACTIONS.GET_CURRENT_SESSION,
        domain: this.state.currentDomain,
        tabId: this.state.currentTab.id!,
      });

      if (!response.success) {
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

      return newSession;
    } catch (error) {
      console.error("Save session error:", error);
      throw new ExtensionError(handleError(error, "PopupService.saveCurrentSession"));
    }
  }

  async switchToSession(sessionId: string): Promise<void> {
    try {
      const session = this.state.sessions.find((s) => s.id === sessionId);
      if (!session) {
        throw new ExtensionError("Session not found");
      }

      const targetTab =
        session.domain === this.state.currentDomain && this.state.currentTab.id != null
          ? this.state.currentTab
          : await this.chromeApi.findOrCreateTabForDomain(session.domain);

      const response = await this.chromeApi.sendMessage({
        action: MESSAGE_ACTIONS.SWITCH_SESSION,
        sessionData: session,
        tabId: targetTab.id!,
      });

      if (!response.success) {
        this.state.activeSessions[session.domain] = sessionId;
        session.lastUsed = Date.now();
        await this.saveStorageData();
        return;
      }

      this.state.activeSessions[session.domain] = sessionId;
      session.lastUsed = Date.now();

      await this.saveStorageData();
    } catch (error) {
      console.error("Switch session error:", error);
      throw new ExtensionError(handleError(error, "PopupService.switchToSession"));
    }
  }

  async createNewSession(): Promise<void> {
    try {
      const response = await this.chromeApi.sendMessage({
        action: MESSAGE_ACTIONS.CLEAR_SESSION,
        domain: this.state.currentDomain,
        tabId: this.state.currentTab.id!,
      });

      if (!response.success) {
        delete this.state.activeSessions[this.state.currentDomain];
        await this.saveStorageData();
        return;
      }

      delete this.state.activeSessions[this.state.currentDomain];
      await this.saveStorageData();
    } catch (error) {
      console.error("Create new session error:", error);
      throw new ExtensionError(handleError(error, "PopupService.createNewSession"));
    }
  }

  async renameSession(sessionId: string, newName: string): Promise<void> {
    try {
      const session = this.state.sessions.find((s) => s.id === sessionId);
      if (!session) {
        throw new ExtensionError("Session not found");
      }

      session.name = validateSessionName(newName);
      await this.saveStorageData();
    } catch (error) {
      console.error("Rename session error:", error);
      throw new ExtensionError(handleError(error, "PopupService.renameSession"));
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      this.state.sessions = this.state.sessions.filter((s) => s.id !== sessionId);

      if (this.state.activeSessions[this.state.currentDomain] === sessionId) {
        delete this.state.activeSessions[this.state.currentDomain];
      }

      await this.saveStorageData();
    } catch (error) {
      console.error("Delete session error:", error);
      throw new ExtensionError(handleError(error, "PopupService.deleteSession"));
    }
  }

  async deleteSessionsByDomain(domain: string): Promise<void> {
    try {
      this.state.sessions = this.state.sessions.filter((s) => s.domain !== domain);
      delete this.state.activeSessions[domain];
      await this.saveStorageData();
    } catch (error) {
      console.error("Delete domain error:", error);
      throw new ExtensionError(handleError(error, "PopupService.deleteSessionsByDomain"));
    }
  }

  async deleteAllSessions(): Promise<void> {
    const previousSessions = this.state.sessions;
    const previousActiveSessions = this.state.activeSessions;

    try {
      this.state.sessions = [];
      this.state.activeSessions = {};
      await this.saveStorageData();
    } catch (error) {
      this.state.sessions = previousSessions;
      this.state.activeSessions = previousActiveSessions;
      console.error("Delete all sessions error:", error);
      throw new ExtensionError(handleError(error, "PopupService.deleteAllSessions"));
    }
  }

  createBackup(): SessionBackup {
    const domains = [...new Set(this.state.sessions.map((session) => session.domain))].sort((a, b) =>
      a.localeCompare(b)
    );

    return {
      format: PopupService.BACKUP_FORMAT,
      version: PopupService.BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      websites: domains.map((domain) => {
        const website: SessionBackupWebsite = {
          domain,
          sessions: this.state.sessions
            .filter((session) => session.domain === domain)
            .sort((a, b) => b.lastUsed - a.lastUsed)
            .map((session) => ({
              ...session,
              cookies: session.cookies.map((cookie) => ({ ...cookie })),
              localStorage: { ...session.localStorage },
              sessionStorage: { ...session.sessionStorage },
            })),
        };

        const activeSessionId = this.state.activeSessions[domain];
        if (activeSessionId) {
          website.activeSessionId = activeSessionId;
        }

        return website;
      }),
    };
  }

  async importBackup(input: unknown): Promise<ImportResult> {
    const backup = this.validateBackup(input);
    const nextSessions = [...this.state.sessions];
    const nextActiveSessions = { ...this.state.activeSessions };
    const existingIds = new Set(nextSessions.map((session) => session.id));
    let importedSessions = 0;
    let skippedSessions = 0;
    let importedWebsites = 0;

    for (const website of backup.websites) {
      let websiteImported = false;
      const importedIdMap = new Map<string, string>();

      for (const importedSession of website.sessions) {
        const duplicate = nextSessions.find(
          (session) =>
            session.domain === importedSession.domain &&
            session.name === importedSession.name &&
            this.isSessionContentEqual(session, importedSession)
        );

        if (duplicate) {
          importedIdMap.set(importedSession.id, duplicate.id);
          skippedSessions += 1;
          continue;
        }

        const sessionId = existingIds.has(importedSession.id) ? generateId() : importedSession.id;
        const session: SessionData = {
          ...importedSession,
          id: sessionId,
          cookies: importedSession.cookies.map((cookie) => ({ ...cookie })),
          localStorage: { ...importedSession.localStorage },
          sessionStorage: { ...importedSession.sessionStorage },
        };

        existingIds.add(sessionId);
        importedIdMap.set(importedSession.id, sessionId);
        nextSessions.push(session);
        importedSessions += 1;
        websiteImported = true;
      }

      if (websiteImported) {
        importedWebsites += 1;
      }

      if (!nextActiveSessions[website.domain] && website.activeSessionId) {
        const mappedActiveId = importedIdMap.get(website.activeSessionId);
        if (mappedActiveId) {
          nextActiveSessions[website.domain] = mappedActiveId;
        }
      }
    }

    if (importedSessions > 0) {
      const previousSessions = this.state.sessions;
      const previousActiveSessions = this.state.activeSessions;
      this.state.sessions = nextSessions;
      this.state.activeSessions = nextActiveSessions;

      try {
        await this.saveStorageData();
      } catch (error) {
        this.state.sessions = previousSessions;
        this.state.activeSessions = previousActiveSessions;
        throw error;
      }
    }

    return { importedSessions, skippedSessions, importedWebsites };
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
      const result = await this.chromeApi.getStorageData<ExtensionStorage>([
        STORAGE_KEYS.SESSIONS,
        STORAGE_KEYS.ACTIVE_SESSIONS,
      ]);

      this.state.sessions = result[STORAGE_KEYS.SESSIONS] || [];
      this.state.activeSessions = result[STORAGE_KEYS.ACTIVE_SESSIONS] || {};
    } catch (error) {
      console.error("Error loading storage data:", error);
      this.state.sessions = [];
      this.state.activeSessions = {};
    }
  }

  private async saveStorageData(): Promise<void> {
    try {
      await this.chromeApi.setStorageData({
        [STORAGE_KEYS.SESSIONS]: this.state.sessions,
        [STORAGE_KEYS.ACTIVE_SESSIONS]: this.state.activeSessions,
      });
    } catch (error) {
      console.error("Error saving storage data:", error);
      throw new Error("Failed to save storage data");
    }
  }

  private async syncActiveSessionFromCurrentState(): Promise<void> {
    const currentDomain = this.state.currentDomain;
    const currentTabId = this.state.currentTab.id;
    if (!currentDomain || currentTabId == null) {
      return;
    }

    const domainSessions = this.state.sessions.filter((session) => session.domain === currentDomain);
    if (domainSessions.length === 0) {
      return;
    }

    try {
      const response = await this.chromeApi.sendMessage<StoredSession | null>({
        action: MESSAGE_ACTIONS.GET_CURRENT_SESSION,
        domain: currentDomain,
        tabId: currentTabId,
      });

      if (!response.success || !response.data || !this.hasSessionData(response.data)) {
        return;
      }

      const liveSession = response.data;
      const activeSessionId = this.state.activeSessions[currentDomain];
      const activeSession = activeSessionId
        ? domainSessions.find((session) => session.id === activeSessionId)
        : undefined;

      // If current active session exists but content changed (e.g. expired login then relogin),
      // update it in-place so active session is always the latest logged-in state.
      if (activeSession) {
        if (!this.isSessionContentEqual(activeSession, liveSession)) {
          activeSession.cookies = liveSession.cookies;
          activeSession.localStorage = liveSession.localStorage;
          activeSession.sessionStorage = liveSession.sessionStorage;
        }
        activeSession.lastUsed = Date.now();
        await this.saveStorageData();
        return;
      }

      // No active session for this domain (e.g. right after "Add Session").
      // Only re-attach to an already saved session; creating a session always
      // requires an explicit save from the user.
      const matchedSession = domainSessions.find((session) => this.isSessionContentEqual(session, liveSession));
      if (matchedSession) {
        this.state.activeSessions[currentDomain] = matchedSession.id;
        matchedSession.lastUsed = Date.now();
        await this.saveStorageData();
      }
    } catch (error) {
      console.error("Auto-sync active session error:", error);
    }
  }

  private validateBackup(input: unknown): SessionBackup {
    if (!this.isRecord(input)) {
      throw new ExtensionError("Invalid backup: expected a JSON object");
    }

    if (input.format !== PopupService.BACKUP_FORMAT || input.version !== PopupService.BACKUP_VERSION) {
      throw new ExtensionError("Invalid or unsupported Account Switcher backup");
    }

    if (typeof input.exportedAt !== "string" || Number.isNaN(Date.parse(input.exportedAt))) {
      throw new ExtensionError("Invalid backup export date");
    }

    if (!Array.isArray(input.websites) || input.websites.length > PopupService.MAX_IMPORT_WEBSITES) {
      throw new ExtensionError("Invalid backup website list");
    }

    let sessionCount = 0;
    const websites = input.websites.map((website, websiteIndex) => {
      if (!this.isRecord(website) || !this.isValidDomainValue(website.domain)) {
        throw new ExtensionError(`Invalid website at index ${websiteIndex}`);
      }

      if (!Array.isArray(website.sessions)) {
        throw new ExtensionError(`Invalid session list for ${website.domain}`);
      }

      sessionCount += website.sessions.length;
      if (sessionCount > PopupService.MAX_IMPORT_SESSIONS) {
        throw new ExtensionError("Backup contains too many sessions");
      }

      const sessions = website.sessions.map((session, sessionIndex) =>
        this.validateImportedSession(session, website.domain as string, sessionIndex)
      );
      const activeSessionId =
        website.activeSessionId === undefined
          ? undefined
          : this.requireString(website.activeSessionId, `active session for ${website.domain}`, 200);

      if (activeSessionId && !sessions.some((session) => session.id === activeSessionId)) {
        throw new ExtensionError(`Active session is missing for ${website.domain}`);
      }

      return {
        domain: website.domain as string,
        activeSessionId,
        sessions,
      };
    });

    return {
      format: PopupService.BACKUP_FORMAT,
      version: PopupService.BACKUP_VERSION,
      exportedAt: input.exportedAt,
      websites,
    };
  }

  private validateImportedSession(input: unknown, domain: string, index: number): SessionData {
    if (!this.isRecord(input) || input.domain !== domain) {
      throw new ExtensionError(`Invalid session ${index + 1} for ${domain}`);
    }

    if (!Array.isArray(input.cookies)) {
      throw new ExtensionError(`Invalid cookies in session ${index + 1} for ${domain}`);
    }

    const cookies = input.cookies.map((cookie, cookieIndex) => {
      if (
        !this.isRecord(cookie) ||
        typeof cookie.name !== "string" ||
        typeof cookie.value !== "string" ||
        typeof cookie.domain !== "string" ||
        typeof cookie.path !== "string" ||
        typeof cookie.secure !== "boolean" ||
        typeof cookie.httpOnly !== "boolean" ||
        typeof cookie.session !== "boolean" ||
        typeof cookie.storeId !== "string"
      ) {
        throw new ExtensionError(`Invalid cookie ${cookieIndex + 1} in session ${index + 1}`);
      }

      return cookie as unknown as chrome.cookies.Cookie;
    });

    return {
      id: this.requireString(input.id, `session ID for ${domain}`, 200),
      name: this.requireString(input.name, `session name for ${domain}`, 200),
      domain,
      createdAt: this.requireTimestamp(input.createdAt, `created date for ${domain}`),
      lastUsed: this.requireTimestamp(input.lastUsed, `last-used date for ${domain}`),
      cookies,
      localStorage: this.validateStringRecord(input.localStorage, `localStorage for ${domain}`),
      sessionStorage: this.validateStringRecord(input.sessionStorage, `sessionStorage for ${domain}`),
    };
  }

  private validateStringRecord(input: unknown, label: string): Record<string, string> {
    if (!this.isRecord(input) || Object.values(input).some((value) => typeof value !== "string")) {
      throw new ExtensionError(`Invalid ${label}`);
    }

    return Object.fromEntries(Object.entries(input)) as Record<string, string>;
  }

  private requireString(input: unknown, label: string, maxLength: number): string {
    if (typeof input !== "string" || input.length === 0 || input.length > maxLength) {
      throw new ExtensionError(`Invalid ${label}`);
    }
    return input;
  }

  private requireTimestamp(input: unknown, label: string): number {
    if (typeof input !== "number" || !Number.isFinite(input) || input < 0) {
      throw new ExtensionError(`Invalid ${label}`);
    }
    return input;
  }

  private isValidDomainValue(input: unknown): input is string {
    return (
      typeof input === "string" &&
      input.length > 0 &&
      input.length <= 253 &&
      !input.includes(" ") &&
      !input.includes("/")
    );
  }

  private isRecord(input: unknown): input is Record<string, unknown> {
    return typeof input === "object" && input !== null && !Array.isArray(input);
  }

  private hasSessionData(session: StoredSession): boolean {
    return (
      session.cookies.length > 0 ||
      Object.keys(session.localStorage).length > 0 ||
      Object.keys(session.sessionStorage).length > 0
    );
  }

  private isSessionContentEqual(session: StoredSession, live: StoredSession): boolean {
    if (session.cookies.length !== live.cookies.length) return false;

    const leftCookies = [...session.cookies]
      .map((cookie) => [cookie.domain, cookie.path ?? "/", cookie.name, cookie.value].join("|"))
      .sort();
    const rightCookies = [...live.cookies]
      .map((cookie) => [cookie.domain, cookie.path ?? "/", cookie.name, cookie.value].join("|"))
      .sort();

    if (leftCookies.join("||") !== rightCookies.join("||")) return false;

    const leftLocal = JSON.stringify(this.sortRecord(session.localStorage));
    const rightLocal = JSON.stringify(this.sortRecord(live.localStorage));
    if (leftLocal !== rightLocal) return false;

    const leftSession = JSON.stringify(this.sortRecord(session.sessionStorage));
    const rightSession = JSON.stringify(this.sortRecord(live.sessionStorage));
    return leftSession === rightSession;
  }

  private sortRecord(record: Record<string, string>): Record<string, string> {
    return Object.keys(record)
      .sort()
      .reduce<Record<string, string>>((acc, key) => {
        acc[key] = record[key];
        return acc;
      }, {});
  }
}
