import { getDomainFromUrl } from "@shared/utils/domain";
import { handleError } from "@shared/utils/errorHandling";
import { LoadingManager } from "./components/loadingManager";
import { ModalManager } from "./components/modalManager";
import { SessionList } from "./components/sessionList";
import { PopupService } from "./services/popup.service";
import { getElementByIdSafe } from "./utils/dom";

class PopupController {
  private loadingManager = new LoadingManager();
  private modalManager = new ModalManager();
  private sessionList: SessionList;
  private popupService = new PopupService();
  private isExtensionEnvironment = false;

  private currentSiteElement: HTMLElement;
  private saveBtn: HTMLButtonElement;
  private newSessionBtn: HTMLButtonElement;

  constructor() {
    // Check if we're in extension environment
    this.isExtensionEnvironment =
      typeof chrome !== "undefined" && typeof chrome.runtime !== "undefined" && typeof chrome.tabs !== "undefined";

    if (!this.isExtensionEnvironment) {
      console.warn("Running in non-extension environment - some features may not work");
    }

    // Get DOM elements
    this.currentSiteElement = getElementByIdSafe("currentSite");
    this.saveBtn = getElementByIdSafe("saveBtn");
    this.newSessionBtn = getElementByIdSafe("newSessionBtn");

    // Initialize session list
    this.sessionList = new SessionList(getElementByIdSafe("sessionsList"));
    this.setupSessionListHandlers();
    this.setupEventListeners();
  }

  async initialize(): Promise<void> {
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
      // Ensure loading state is cleared even on error
      this.loadingManager.hideLoading();
      // Show basic state even if initialization fails
      this.currentSiteElement.textContent = "Error loading domain";
      this.renderSessionsList();
    }
  }

  getServiceInstance(): PopupService {
    return this.popupService;
  }

  private setupEventListeners(): void {
    this.saveBtn.addEventListener("click", () => this.handleSaveClick());
    this.newSessionBtn.addEventListener("click", () => this.handleNewSessionClick());

    // Modal event listeners
    getElementByIdSafe("confirmSave").addEventListener("click", () => this.handleConfirmSave());
    getElementByIdSafe("confirmRename").addEventListener("click", () => this.handleConfirmRename());
    getElementByIdSafe("confirmDelete").addEventListener("click", () => this.handleConfirmDelete());
  }

  private setupSessionListHandlers(): void {
    this.sessionList.setEventHandlers({
      onSessionClick: (sessionId) => this.handleSessionSwitch(sessionId),
      onRenameClick: (sessionId) => this.handleRenameClick(sessionId),
      onDeleteClick: (sessionId) => this.handleDeleteClick(sessionId),
    });
  }

  private async handleSaveClick(): Promise<void> {
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

  private async handleConfirmSave(): Promise<void> {
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
      // Ensure loading state is cleared even on error
      this.loadingManager.hideLoading();
    }
  }

  private async handleNewSessionClick(): Promise<void> {
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
      // Ensure loading state is cleared even on error
      this.loadingManager.hideLoading();
    }
  }

  private async handleSessionSwitch(sessionId: string): Promise<void> {
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

      // Ensure loading state is cleared even on error
      this.loadingManager.hideLoading();
    }
  }

  private handleRenameClick(sessionId: string): void {
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

  private async handleConfirmRename(): Promise<void> {
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

  private handleDeleteClick(sessionId: string): void {
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

  private async handleConfirmDelete(): Promise<void> {
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

  private renderSessionsList(): void {
    try {
      const state = this.popupService.getState();
      this.sessionList.render(state.sessions, state.activeSessions, state.currentDomain);
    } catch (error) {
      console.error("Error rendering sessions list:", error);
      // Show empty list if rendering fails
      this.sessionList.render([], {}, "Error");
    }
  }

  private showError(message: string): void {
    console.error("Popup error:", message);
    this.modalManager.showErrorModal(message);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Account Switcher popup loaded");

  try {
    const controller = new PopupController();
    await controller.initialize();

    // Only setup Chrome-specific listeners if we're in extension environment
    if (typeof chrome !== "undefined" && typeof chrome.tabs !== "undefined") {
      const service = controller.getServiceInstance();
      const state = service.getState();

      let currentDomain = state.currentDomain;

      const tabActivatedListener = async (activeInfo: { tabId: number }) => {
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

      const tabUpdatedListener = async (_: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
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
    // Show error to user
    const errorElement = document.getElementById("currentSite");
    if (errorElement) {
      errorElement.textContent = "Failed to initialize extension";
    }
  }
});
