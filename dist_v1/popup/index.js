"use strict";
(() => {
  // src/shared/utils/domain.ts
  function extractDomain(hostname) {
    return hostname.replace(/^www\./, "");
  }
  function getDomainFromUrl(url) {
    try {
      const urlObj = new URL(url);
      const domain = extractDomain(urlObj.hostname);
      const isLocalhost = domain === "localhost" || domain.startsWith("127.");
      const port = urlObj.port;
      if (isLocalhost && port) {
        return `${domain}:${port}`;
      }
      return domain;
    } catch (_) {
      console.error("Invalid URL:", url);
      return "";
    }
  }

  // src/shared/utils/errorHandling.ts
  var ExtensionError = class extends Error {
    constructor(message, code) {
      super(message);
      this.code = code;
      this.name = "ExtensionError";
    }
  };
  function handleError(error, context) {
    console.error(`Error in ${context}:`, error);
    if (error instanceof ExtensionError) {
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "An unexpected error occurred";
  }

  // src/popup/utils/constants.ts
  var CSS_CLASSES = {
    SHOW: "show",
    LOADING: "loading",
    ACTIVE: "active",
    SESSION_ITEM: "session-item",
    SESSION_BTN: "session-btn",
    NO_SESSIONS: "no-sessions"
  };
  var UI_TEXT = {
    NO_SESSIONS: "No sessions saved for this site",
    UNNAMED_SESSION: "Unnamed Session",
    LAST_USED: "Last used:",
    LOADING: "Loading...",
    SAVE_SUCCESS: "Session saved successfully",
    SWITCH_SUCCESS: "Session switched successfully",
    DELETE_SUCCESS: "Session deleted successfully"
  };

  // src/popup/components/loadingManager.ts
  var LoadingManager = class {
    constructor() {
      this.isLoading = false;
    }
    showLoading() {
      if (!this.isLoading) {
        document.body.classList.add(CSS_CLASSES.LOADING);
        this.isLoading = true;
      }
    }
    hideLoading() {
      if (this.isLoading) {
        document.body.classList.remove(CSS_CLASSES.LOADING);
        this.isLoading = false;
      }
    }
    async withLoading(operation) {
      try {
        this.showLoading();
        return await operation();
      } finally {
        this.hideLoading();
      }
    }
  };

  // src/popup/utils/dom.ts
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  function getElementByIdSafe(id) {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Element not found with id: ${id}`);
    }
    return element;
  }

  // src/popup/components/modalManager.ts
  var ModalManager = class {
    constructor() {
      this.modals = {
        save: getElementByIdSafe("saveModal"),
        rename: getElementByIdSafe("renameModal"),
        delete: getElementByIdSafe("deleteModal"),
        error: getElementByIdSafe("errorModal")
      };
      this.inputs = {
        sessionName: getElementByIdSafe("sessionName"),
        newSessionName: getElementByIdSafe("newSessionName")
      };
      this.setupEventListeners();
    }
    setupEventListeners() {
      const closeButtons = [
        { id: "closeSaveModal", modal: "save" },
        { id: "cancelSave", modal: "save" },
        { id: "closeRenameModal", modal: "rename" },
        { id: "cancelRename", modal: "rename" },
        { id: "closeDeleteModal", modal: "delete" },
        { id: "cancelDelete", modal: "delete" },
        { id: "closeErrorModal", modal: "error" },
        { id: "closeErrorModalBtn", modal: "error" }
      ];
      closeButtons.forEach(({ id, modal }) => {
        getElementByIdSafe(id).addEventListener("click", () => this.hide(modal));
      });
      this.inputs.sessionName.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          getElementByIdSafe("confirmSave").click();
        }
      });
      this.inputs.newSessionName.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          getElementByIdSafe("confirmRename").click();
        }
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          this.hideVisible();
        }
        if (e.key === "Enter") {
          if (this.isVisible("delete")) {
            e.preventDefault();
            getElementByIdSafe("confirmDelete").click();
          }
          if (this.isVisible("error")) {
            e.preventDefault();
            getElementByIdSafe("closeErrorModal").click();
          }
        }
      });
      Object.entries(this.modals).forEach(([key, modal]) => {
        modal.addEventListener("click", (e) => {
          if (e.target === modal)
            this.hide(key);
        });
      });
    }
    showSaveModal(defaultName = "Unnamed Session") {
      this.inputs.sessionName.value = defaultName;
      this.show("save");
      this.inputs.sessionName.focus();
      this.inputs.sessionName.select();
    }
    showRenameModal(currentName) {
      this.inputs.newSessionName.value = currentName;
      this.show("rename");
      this.inputs.newSessionName.focus();
      this.inputs.newSessionName.select();
    }
    showDeleteModal(sessionName) {
      const deleteSessionNameEl = document.getElementById("deleteSessionName");
      if (deleteSessionNameEl) {
        deleteSessionNameEl.textContent = sessionName;
      }
      this.show("delete");
      this.modals.delete.focus();
    }
    showErrorModal(message) {
      const errorMessageEl = document.getElementById("errorMessage");
      if (errorMessageEl) {
        errorMessageEl.textContent = message;
      }
      this.show("error");
      this.modals.error.focus();
    }
    getSaveModalInput() {
      return this.inputs.sessionName.value.trim();
    }
    getRenameModalInput() {
      return this.inputs.newSessionName.value.trim();
    }
    hideSaveModal() {
      this.hide("save");
    }
    hideRenameModal() {
      this.hide("rename");
    }
    hideDeleteModal() {
      this.hide("delete");
    }
    hideErrorModal() {
      this.hide("error");
    }
    hideAllModals() {
      this.hideVisible();
      this.inputs.sessionName.value = "";
      this.inputs.newSessionName.value = "";
    }
    isVisible(modalKey) {
      var _a;
      return ((_a = this.modals[modalKey]) == null ? void 0 : _a.classList.contains(CSS_CLASSES.SHOW)) || false;
    }
    hideVisible() {
      Object.entries(this.modals).forEach(([key, modal]) => {
        if (modal.classList.contains(CSS_CLASSES.SHOW)) {
          this.hide(key);
        }
      });
    }
    show(modalKey) {
      this.modals[modalKey].classList.add(CSS_CLASSES.SHOW);
    }
    hide(modalKey) {
      this.modals[modalKey].classList.remove(CSS_CLASSES.SHOW);
    }
  };

  // src/shared/utils/date.ts
  function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString();
  }

  // src/popup/components/sessionList.ts
  var SessionList = class {
    constructor(container) {
      this.container = container;
      this.container.addEventListener("click", this.handleClick.bind(this));
    }
    setEventHandlers(handlers) {
      this.onSessionClick = handlers.onSessionClick;
      this.onRenameClick = handlers.onRenameClick;
      this.onDeleteClick = handlers.onDeleteClick;
    }
    render(sessions, activeSessions, currentDomain) {
      const domainSessions = sessions.filter((s) => s.domain === currentDomain);
      const activeSessionId = activeSessions[currentDomain];
      if (domainSessions.length === 0) {
        this.renderEmptyState();
        return;
      }
      this.renderSessions(domainSessions, activeSessionId);
    }
    renderEmptyState() {
      this.container.innerHTML = `<div class="${CSS_CLASSES.NO_SESSIONS}">${UI_TEXT.NO_SESSIONS}</div>`;
    }
    renderSessions(sessions, activeSessionId) {
      const sessionsHtml = sessions.map((session) => {
        const isActive = session.id === activeSessionId;
        const lastUsed = formatDate(session.lastUsed);
        return `
        <div class="${CSS_CLASSES.SESSION_ITEM} ${isActive ? CSS_CLASSES.ACTIVE : ""}" data-session-id="${session.id}">
          <div class="session-info">
            <div class="session-name">${escapeHtml(session.name)}</div>
            <div class="session-meta">${UI_TEXT.LAST_USED} ${lastUsed}</div>
          </div>
          <div class="session-actions">
            <button class="${CSS_CLASSES.SESSION_BTN} rename-btn" data-action="rename" data-session-id="${session.id}">
              \u270F\uFE0F
            </button>
            <button class="${CSS_CLASSES.SESSION_BTN} delete-btn" data-action="delete" data-session-id="${session.id}">
              \u{1F5D1}\uFE0F
            </button>
          </div>
        </div>
      `;
      }).join("");
      this.container.innerHTML = sessionsHtml;
    }
    handleClick(e) {
      const target = e.target;
      if (target.classList.contains(CSS_CLASSES.SESSION_BTN)) {
        e.stopPropagation();
        const action = target.dataset.action;
        const sessionId = target.dataset.sessionId;
        if (!sessionId)
          return;
        if (action === "rename" && this.onRenameClick) {
          this.onRenameClick(sessionId);
        } else if (action === "delete" && this.onDeleteClick) {
          this.onDeleteClick(sessionId);
        }
        return;
      }
      const sessionItem = target.closest(`.${CSS_CLASSES.SESSION_ITEM}`);
      if (sessionItem && this.onSessionClick) {
        const sessionId = sessionItem.dataset.sessionId;
        if (sessionId) {
          this.onSessionClick(sessionId);
        }
      }
    }
  };

  // src/popup/utils/defaultValue.ts
  var storedSessionDefaultValue = {
    cookies: [],
    localStorage: {},
    sessionStorage: {}
  };

  // src/shared/constants/messages.ts
  var MESSAGE_ACTIONS = {
    GET_CURRENT_SESSION: "getCurrentSession",
    SWITCH_SESSION: "switchSession",
    CLEAR_SESSION: "clearSession"
  };

  // src/shared/constants/storageKeys.ts
  var STORAGE_KEYS = {
    SESSIONS: "sessions",
    ACTIVE_SESSIONS: "activeSessions"
  };

  // src/shared/utils/idGenerator.ts
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // src/shared/utils/validation.ts
  function validateSessionName(name) {
    const trimmed = name.trim();
    return trimmed || "Unnamed Session";
  }

  // src/popup/services/chromeApi.service.ts
  var ChromeApiService = class {
    constructor() {
      this.MESSAGE_TIMEOUT = 1e4;
      // 10 seconds timeout
      this.isExtensionEnvironment = false;
      this.isExtensionEnvironment = typeof chrome !== "undefined" && typeof chrome.runtime !== "undefined" && typeof chrome.tabs !== "undefined";
      if (!this.isExtensionEnvironment) {
        console.warn("Chrome APIs not available - running in non-extension environment");
      }
    }
    async getCurrentTab() {
      try {
        if (!this.isExtensionEnvironment) {
          return {
            id: 1,
            url: window.location.href,
            title: document.title,
            active: true,
            windowId: 1
          };
        }
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length === 0) {
          throw new Error("No active tab found");
        }
        return tabs[0];
      } catch (error) {
        console.error("Error getting current tab:", error);
        throw new Error("Failed to get current tab");
      }
    }
    async sendMessage(message) {
      if (!this.isExtensionEnvironment) {
        console.warn("Chrome runtime not available - returning mock response");
        return {
          success: true,
          data: null
        };
      }
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error("Message timeout - no response received"));
        }, this.MESSAGE_TIMEOUT);
        try {
          chrome.runtime.sendMessage(message, (response) => {
            clearTimeout(timeoutId);
            if (chrome.runtime.lastError) {
              resolve({
                success: false,
                error: chrome.runtime.lastError.message || "Runtime error occurred"
              });
            } else if (!response) {
              resolve({
                success: false,
                error: "No response received from background script"
              });
            } else {
              resolve(response);
            }
          });
        } catch (error) {
          clearTimeout(timeoutId);
          console.error("Error sending message:", error);
          reject(new Error("Failed to send message"));
        }
      });
    }
    async getStorageData(keys) {
      try {
        if (!this.isExtensionEnvironment) {
          console.warn("Chrome storage not available - returning mock data");
          return {};
        }
        const result = await chrome.storage.local.get(keys);
        return result;
      } catch (error) {
        console.error("Error getting storage data:", error);
        throw new Error("Failed to get storage data");
      }
    }
    async setStorageData(data) {
      try {
        if (!this.isExtensionEnvironment) {
          console.warn("Chrome storage not available - mocking storage operation");
          return;
        }
        await chrome.storage.local.set(data);
      } catch (error) {
        console.error("Error setting storage data:", error);
        throw new Error("Failed to set storage data");
      }
    }
    // Method to check if we're in extension environment
    isExtension() {
      return this.isExtensionEnvironment;
    }
  };

  // src/popup/services/popup.service.ts
  var PopupService = class {
    constructor() {
      this.chromeApi = new ChromeApiService();
      this.state = {
        currentDomain: "",
        currentTab: {},
        sessions: [],
        activeSessions: {},
        currentRenameSessionId: "",
        currentDeleteSessionId: ""
      };
    }
    async initialize() {
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
        return {
          ...this.state,
          currentDomain: this.state.currentDomain || "unknown",
          sessions: [],
          activeSessions: {}
        };
      }
    }
    async saveCurrentSession(name) {
      try {
        console.log("Saving current session:", name);
        const validatedName = validateSessionName(name);
        const response = await this.chromeApi.sendMessage({
          action: MESSAGE_ACTIONS.GET_CURRENT_SESSION,
          domain: this.state.currentDomain,
          tabId: this.state.currentTab.id
        });
        if (!response.success) {
          const newSession2 = {
            ...storedSessionDefaultValue,
            id: generateId(),
            name: validatedName,
            domain: this.state.currentDomain,
            createdAt: Date.now(),
            lastUsed: Date.now()
          };
          this.state.sessions.push(newSession2);
          this.state.activeSessions[this.state.currentDomain] = newSession2.id;
          await this.saveStorageData();
          return newSession2;
        }
        const storedSession = response.data ?? storedSessionDefaultValue;
        const newSession = {
          ...storedSession,
          id: generateId(),
          name: validatedName,
          domain: this.state.currentDomain,
          createdAt: Date.now(),
          lastUsed: Date.now()
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
    async switchToSession(sessionId) {
      try {
        console.log("Switching to session:", sessionId);
        const session = this.state.sessions.find((s) => s.id === sessionId);
        if (!session) {
          throw new ExtensionError("Session not found");
        }
        const response = await this.chromeApi.sendMessage({
          action: MESSAGE_ACTIONS.SWITCH_SESSION,
          sessionData: session,
          tabId: this.state.currentTab.id
        });
        if (!response.success) {
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
    async createNewSession() {
      try {
        console.log("Creating new session");
        const response = await this.chromeApi.sendMessage({
          action: MESSAGE_ACTIONS.CLEAR_SESSION,
          domain: this.state.currentDomain,
          tabId: this.state.currentTab.id
        });
        if (!response.success) {
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
    async renameSession(sessionId, newName) {
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
    async deleteSession(sessionId) {
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
    getSession(sessionId) {
      return this.state.sessions.find((s) => s.id === sessionId);
    }
    getState() {
      return { ...this.state };
    }
    setState(newState) {
      this.state = { ...this.state, ...newState };
    }
    async loadStorageData() {
      try {
        console.log("Loading storage data...");
        const result = await this.chromeApi.getStorageData([
          STORAGE_KEYS.SESSIONS,
          STORAGE_KEYS.ACTIVE_SESSIONS
        ]);
        this.state.sessions = result[STORAGE_KEYS.SESSIONS] || [];
        this.state.activeSessions = result[STORAGE_KEYS.ACTIVE_SESSIONS] || {};
        console.log("Sessions loaded:", this.state.sessions.length);
        console.log("Active sessions:", Object.keys(this.state.activeSessions).length);
      } catch (error) {
        console.error("Error loading storage data:", error);
        this.state.sessions = [];
        this.state.activeSessions = {};
      }
    }
    async saveStorageData() {
      try {
        console.log("Saving storage data...");
        await this.chromeApi.setStorageData({
          [STORAGE_KEYS.SESSIONS]: this.state.sessions,
          [STORAGE_KEYS.ACTIVE_SESSIONS]: this.state.activeSessions
        });
        console.log("Storage data saved successfully");
      } catch (error) {
        console.error("Error saving storage data:", error);
        throw new Error("Failed to save storage data");
      }
    }
  };

  // src/popup/index.ts
  var PopupController = class {
    constructor() {
      this.loadingManager = new LoadingManager();
      this.modalManager = new ModalManager();
      this.popupService = new PopupService();
      this.isExtensionEnvironment = false;
      this.isExtensionEnvironment = typeof chrome !== "undefined" && typeof chrome.runtime !== "undefined" && typeof chrome.tabs !== "undefined";
      if (!this.isExtensionEnvironment) {
        console.warn("Running in non-extension environment - some features may not work");
      }
      this.currentSiteElement = getElementByIdSafe("currentSite");
      this.saveBtn = getElementByIdSafe("saveBtn");
      this.newSessionBtn = getElementByIdSafe("newSessionBtn");
      this.sessionList = new SessionList(getElementByIdSafe("sessionsList"));
      this.setupSessionListHandlers();
      this.setupEventListeners();
    }
    async initialize() {
      try {
        console.log("Initializing PopupController...");
        this.modalManager.hideAllModals();
        const state = await this.loadingManager.withLoading(async () => {
          return await this.popupService.initialize();
        });
        this.currentSiteElement.textContent = state.currentDomain;
        this.renderSessionsList();
        console.log("PopupController initialized successfully");
      } catch (error) {
        console.error("PopupController initialization error:", error);
        this.showError(handleError(error, "PopupController.initialize"));
        this.loadingManager.hideLoading();
        this.currentSiteElement.textContent = "Error loading domain";
        this.renderSessionsList();
      }
    }
    getServiceInstance() {
      return this.popupService;
    }
    setupEventListeners() {
      this.saveBtn.addEventListener("click", () => this.handleSaveClick());
      this.newSessionBtn.addEventListener("click", () => this.handleNewSessionClick());
      getElementByIdSafe("confirmSave").addEventListener("click", () => this.handleConfirmSave());
      getElementByIdSafe("confirmRename").addEventListener("click", () => this.handleConfirmRename());
      getElementByIdSafe("confirmDelete").addEventListener("click", () => this.handleConfirmDelete());
    }
    setupSessionListHandlers() {
      this.sessionList.setEventHandlers({
        onSessionClick: (sessionId) => this.handleSessionSwitch(sessionId),
        onRenameClick: (sessionId) => this.handleRenameClick(sessionId),
        onDeleteClick: (sessionId) => this.handleDeleteClick(sessionId)
      });
    }
    async handleSaveClick() {
      try {
        if (!this.isExtensionEnvironment) {
          this.showError("This feature requires the extension to be installed in Chrome");
          return;
        }
        this.modalManager.showSaveModal();
      } catch (error) {
        console.error("Error showing save modal:", error);
        this.showError("Failed to show save modal");
      }
    }
    async handleConfirmSave() {
      try {
        if (!this.isExtensionEnvironment) {
          this.showError("This feature requires the extension to be installed in Chrome");
          return;
        }
        const name = this.modalManager.getSaveModalInput();
        if (!name || name.trim() === "") {
          this.showError("Session name cannot be empty");
          return;
        }
        await this.loadingManager.withLoading(async () => {
          await this.popupService.saveCurrentSession(name);
        });
        this.modalManager.hideSaveModal();
        this.renderSessionsList();
      } catch (error) {
        console.error("Save session error:", error);
        this.showError(handleError(error, "save session"));
        this.loadingManager.hideLoading();
      }
    }
    async handleNewSessionClick() {
      try {
        if (!this.isExtensionEnvironment) {
          this.showError("This feature requires the extension to be installed in Chrome");
          return;
        }
        await this.loadingManager.withLoading(async () => {
          await this.popupService.createNewSession();
        });
        this.renderSessionsList();
      } catch (error) {
        console.error("Create new session error:", error);
        this.showError(handleError(error, "create new session"));
        this.loadingManager.hideLoading();
      }
    }
    async handleSessionSwitch(sessionId) {
      try {
        if (!this.isExtensionEnvironment) {
          this.showError("This feature requires the extension to be installed in Chrome");
          return;
        }
        await this.loadingManager.withLoading(async () => {
          await this.popupService.switchToSession(sessionId);
        });
        this.renderSessionsList();
      } catch (error) {
        console.error("Switch session error:", error);
        this.showError(handleError(error, "switch session"));
        this.loadingManager.hideLoading();
      }
    }
    handleRenameClick(sessionId) {
      try {
        if (!this.isExtensionEnvironment) {
          this.showError("This feature requires the extension to be installed in Chrome");
          return;
        }
        const session = this.popupService.getSession(sessionId);
        if (session) {
          this.popupService.setState({ currentRenameSessionId: sessionId });
          this.modalManager.showRenameModal(session.name);
        } else {
          this.showError("Session not found");
        }
      } catch (error) {
        console.error("Rename click error:", error);
        this.showError("Failed to show rename modal");
      }
    }
    async handleConfirmRename() {
      try {
        if (!this.isExtensionEnvironment) {
          this.showError("This feature requires the extension to be installed in Chrome");
          return;
        }
        const newName = this.modalManager.getRenameModalInput();
        const sessionId = this.popupService.getState().currentRenameSessionId;
        if (!newName || newName.trim() === "") {
          this.showError("Session name cannot be empty");
          return;
        }
        if (newName && sessionId) {
          await this.popupService.renameSession(sessionId, newName);
          this.renderSessionsList();
        }
        this.modalManager.hideRenameModal();
      } catch (error) {
        console.error("Confirm rename error:", error);
        this.showError(handleError(error, "rename session"));
      }
    }
    handleDeleteClick(sessionId) {
      try {
        if (!this.isExtensionEnvironment) {
          this.showError("This feature requires the extension to be installed in Chrome");
          return;
        }
        const session = this.popupService.getSession(sessionId);
        if (session) {
          this.popupService.setState({ currentDeleteSessionId: sessionId });
          this.modalManager.showDeleteModal(session.name);
        } else {
          this.showError("Session not found");
        }
      } catch (error) {
        console.error("Delete click error:", error);
        this.showError("Failed to show delete modal");
      }
    }
    async handleConfirmDelete() {
      try {
        if (!this.isExtensionEnvironment) {
          this.showError("This feature requires the extension to be installed in Chrome");
          return;
        }
        const sessionId = this.popupService.getState().currentDeleteSessionId;
        if (sessionId) {
          await this.popupService.deleteSession(sessionId);
          this.renderSessionsList();
        }
        this.modalManager.hideDeleteModal();
      } catch (error) {
        console.error("Confirm delete error:", error);
        this.showError(handleError(error, "delete session"));
      }
    }
    renderSessionsList() {
      try {
        const state = this.popupService.getState();
        this.sessionList.render(state.sessions, state.activeSessions, state.currentDomain);
      } catch (error) {
        console.error("Error rendering sessions list:", error);
        this.sessionList.render([], {}, "Error");
      }
    }
    showError(message) {
      console.error("Popup error:", message);
      this.modalManager.showErrorModal(message);
    }
  };
  document.addEventListener("DOMContentLoaded", async () => {
    console.log("Account Switcher popup loaded");
    try {
      const controller = new PopupController();
      await controller.initialize();
      if (typeof chrome !== "undefined" && typeof chrome.tabs !== "undefined") {
        const service = controller.getServiceInstance();
        const state = service.getState();
        let currentDomain = state.currentDomain;
        const tabActivatedListener = async (activeInfo) => {
          try {
            const tab = await chrome.tabs.get(activeInfo.tabId);
            if (tab.url) {
              const newDomain = getDomainFromUrl(tab.url);
              if (newDomain !== currentDomain) {
                currentDomain = newDomain;
                await controller.initialize();
              }
            }
          } catch (error) {
            console.error("Tab activated listener error:", error);
          }
        };
        const tabUpdatedListener = async (_, changeInfo, tab) => {
          try {
            if (changeInfo.status === "complete" && tab.url) {
              const newDomain = getDomainFromUrl(tab.url);
              if (newDomain !== currentDomain) {
                currentDomain = newDomain;
                await controller.initialize();
              }
            }
          } catch (error) {
            console.error("Tab updated listener error:", error);
          }
        };
        chrome.tabs.onActivated.addListener(tabActivatedListener);
        chrome.tabs.onUpdated.addListener(tabUpdatedListener);
        const cleanup = () => {
          try {
            chrome.tabs.onActivated.removeListener(tabActivatedListener);
            chrome.tabs.onUpdated.removeListener(tabUpdatedListener);
          } catch (error) {
            console.error("Cleanup error:", error);
          }
        };
        window.addEventListener("beforeunload", cleanup);
        window.addEventListener("unload", cleanup);
        console.log("Chrome-specific listeners setup completed");
      } else {
        console.log("Running in non-extension environment - Chrome listeners not setup");
      }
      console.log("Popup setup completed successfully");
    } catch (error) {
      console.error("Failed to setup popup:", error);
      const errorElement = document.getElementById("currentSite");
      if (errorElement) {
        errorElement.textContent = "Failed to initialize extension";
      }
    }
  });
})();
