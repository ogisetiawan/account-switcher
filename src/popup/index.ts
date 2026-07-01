import { handleError } from "@shared/utils/errorHandling";
import { SessionData } from "@shared/types";
import { PopupService } from "./services/popup.service";
import { ToastManager } from "./components/toastManager";
import { escapeHtml, getElementByIdSafe, querySelector } from "./utils/dom";

type Page = "main" | "detail";

interface DomainEntry {
  domain: string;
  count: number;
  activeId?: string;
}

class PopupController {
  private popupService = new PopupService();
  private isExtensionEnvironment = false;
  private initialized = false;
  private selectedDomain = "";
  private renameSessionId = "";
  private deleteSessionId = "";
  private deleteTargetDomain = "";
  private searchQuery = "";

  private mainPage = getElementByIdSafe("main-page");
  private detailPage = getElementByIdSafe("detail-page");
  private siteGrid = querySelector<HTMLElement>(".site-grid");
  private searchInput = getElementByIdSafe<HTMLInputElement>("website-search");

  private detailSiteIcon = getElementByIdSafe<HTMLImageElement>("detail-site-icon");
  private detailSiteName = getElementByIdSafe("detail-site-name");
  private detailSiteTitle = getElementByIdSafe("detail-site-title");
  private sessionCount = getElementByIdSafe("session-count");
  private sessionsList = getElementByIdSafe("sessions-list");

  private loadingOverlay = getElementByIdSafe("loading-overlay");
  private loadingText = querySelector<HTMLElement>("#loading-overlay span");

  private saveModal = getElementByIdSafe("saveModal");
  private websiteUrlInput = getElementByIdSafe<HTMLInputElement>("websiteUrl");
  private sessionNameInput = getElementByIdSafe<HTMLInputElement>("sessionName");
  private sessionNameError = getElementByIdSafe("sessionNameError");

  private renameModal = getElementByIdSafe("renameModal");
  private renameInput = getElementByIdSafe<HTMLInputElement>("renameSessionName");
  private renameError = getElementByIdSafe("renameNameError");

  private deleteModal = getElementByIdSafe("deleteModal");

  private toastManager: ToastManager;

  constructor() {
    this.isExtensionEnvironment =
      typeof chrome !== "undefined" && typeof chrome.runtime !== "undefined" && typeof chrome.tabs !== "undefined";

    if (!this.isExtensionEnvironment) {
      console.warn("Running in non-extension environment - some features may not work");
    }

    this.toastManager = new ToastManager();
    this.setupEventListeners();
  }

  async initialize(): Promise<void> {
    try {
      this.hideAllModals();
      await this.withLoading("Loading sessions...", async () => {
        await this.popupService.initialize();
      });
      this.renderGrid();
      this.applyLanding();
    } catch (error) {
      console.error("PopupController initialization error:", error);
      this.showToast(handleError(error, "PopupController.initialize"));
      this.renderGrid();
      this.applyLanding();
    }
  }

  private applyLanding(): void {
    const state = this.popupService.getState();

    // On first open, jump straight to the detail page when the current
    // website already has saved sessions; otherwise show the grid.
    if (!this.initialized) {
      this.initialized = true;
      const hasSessions =
        !!state.currentDomain && state.sessions.some((session) => session.domain === state.currentDomain);
      if (hasSessions) {
        this.navigateToDetail(state.currentDomain);
        return;
      }
      this.showPage("main");
      return;
    }

    // On later refreshes (tab changes), keep the current view in sync.
    if (!this.detailPage.classList.contains("hidden") && this.selectedDomain) {
      this.renderDetail();
    } else {
      this.showPage("main");
    }
  }

  getServiceInstance(): PopupService {
    return this.popupService;
  }

  private setupEventListeners(): void {
    document.addEventListener("click", (event) => this.handleClick(event));

    this.searchInput.addEventListener("input", () => {
      this.searchQuery = this.searchInput.value.trim().toLowerCase();
      this.renderGrid();
    });

    getElementByIdSafe("closeSaveModal").addEventListener("click", () => this.hide(this.saveModal));
    getElementByIdSafe("cancelSaveModal").addEventListener("click", () => this.hide(this.saveModal));
    getElementByIdSafe("saveSaveModal").addEventListener("click", () => this.handleConfirmSave());
    this.sessionNameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.handleConfirmSave();
      }
    });

    getElementByIdSafe("closeRenameModal").addEventListener("click", () => this.hide(this.renameModal));
    getElementByIdSafe("cancelRenameModal").addEventListener("click", () => this.hide(this.renameModal));
    getElementByIdSafe("confirmRenameModal").addEventListener("click", () => this.handleConfirmRename());
    this.renameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.handleConfirmRename();
      }
    });

    getElementByIdSafe("closeDeleteModal").addEventListener("click", () => this.hide(this.deleteModal));
    getElementByIdSafe("cancelDeleteModal").addEventListener("click", () => this.hide(this.deleteModal));
    getElementByIdSafe("confirmDeleteModal").addEventListener("click", () => this.handleConfirmDelete());

    // When modal closes, reset domain target
    this.deleteModal.addEventListener("transitionend", () => {
      if (this.deleteModal.classList.contains("hidden")) {
        this.deleteTargetDomain = "";
      }
    });

    [this.saveModal, this.renameModal, this.deleteModal].forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) this.hide(modal);
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.hideAllModals();
      }
    });
  }

  private handleClick(event: Event): void {
    const target = event.target as HTMLElement;
    const actionEl = target.closest<HTMLElement>("[data-action]");

    if (actionEl) {
      const { action, sessionId } = actionEl.dataset;
      switch (action) {
        case "add-session":
          this.handleCreateNewSession();
          return;
        case "save-session":
          this.openSaveModal();
          return;
        case "back-to-main":
          this.showPage("main");
          return;
        case "switch-session":
          if (sessionId) this.handleSwitch(sessionId);
          return;
        case "edit-session":
          if (sessionId) this.openRenameModal(sessionId);
          return;
        case "delete-session":
          if (sessionId) this.openDeleteModal(sessionId);
          return;
        case "delete-domain":
          this.handleDeleteDomain(actionEl.dataset.site ?? "");
          return;
        case "show-help":
        case "show-settings":
          this.showToast("This feature is coming soon");
          return;
      }
    }

    const siteEl = target.closest<HTMLElement>("[data-site]");
    if (siteEl?.dataset.site) {
      this.navigateToDetail(siteEl.dataset.site);
    }
  }

  private showPage(page: Page): void {
    if (page === "main") {
      this.mainPage.classList.remove("hidden");
      this.detailPage.classList.add("hidden");
    } else {
      this.mainPage.classList.add("hidden");
      this.detailPage.classList.remove("hidden");
    }
  }

  private getDomainEntries(): DomainEntry[] {
    const state = this.popupService.getState();
    const counts = new Map<string, number>();

    for (const session of state.sessions) {
      counts.set(session.domain, (counts.get(session.domain) ?? 0) + 1);
    }

    const current = state.currentDomain;
    return [...counts.entries()]
      .map(([domain, count]) => ({ domain, count, activeId: state.activeSessions[domain] }))
      .sort((a, b) => {
        if (a.domain === current) return -1;
        if (b.domain === current) return 1;
        if (b.count !== a.count) return b.count - a.count;
        return a.domain.localeCompare(b.domain);
      });
  }

  private renderGrid(): void {
    const current = this.popupService.getState().currentDomain;
    const entries = this.getDomainEntries().filter((entry) =>
      this.searchQuery ? entry.domain.toLowerCase().includes(this.searchQuery) : true
    );

    if (entries.length === 0) {
      this.siteGrid.innerHTML = this.renderEmptyState(
        this.searchQuery ? "No websites match your search." : "No saved sessions yet. Open a website and press Save."
      );
      return;
    }

    this.siteGrid.innerHTML = entries
      .map((entry) => {
        const isCurrent = entry.domain === current;
        const safeDomain = escapeHtml(entry.domain);
        const badge =
          entry.count > 0
            ? `<span class="site-badge">${entry.count}</span>`
            : "";
        return `
        <article class="flex flex-col items-center space-y-1 group">
          <button type="button"
            class="site-button relative w-16 h-16 bg-white rounded-2xl shadow-md flex items-center justify-center focus-ring ${isCurrent ? "active" : ""}"
            title="${safeDomain}" aria-label="View sessions for ${safeDomain}" data-site="${safeDomain}">
            <img src="${this.faviconFor(entry.domain)}" alt="${safeDomain}" class="w-9 h-9 rounded" loading="lazy" decoding="async" />
            ${badge}
          </button>
          <div class="flex items-center justify-center w-16 mt-1 relative">
            <span class="text-[11px] text-gray-600 text-center truncate font-medium" title="${safeDomain}">${safeDomain.length > 11 ? safeDomain.slice(0, 11) + ".." : safeDomain}</span>
            <span class="site-delete-icon" data-action="delete-domain" data-site="${safeDomain}" title="Delete all sessions for ${safeDomain}">
              <span class="material-symbols-rounded text-gray-600" aria-hidden="true">delete</span>
            </span>
          </div>
        </article>`;
      })
      .join("");
  }

  private renderEmptyState(message: string): string {
    return `
      <div class="empty-state">
        <img src="../assets/img/file-search.svg" alt="" class="empty-state__image" aria-hidden="true" />
        <p class="empty-state__text">${escapeHtml(message)}</p>
      </div>`;
  }

  private navigateToDetail(domain: string): void {
    this.selectedDomain = domain;
    this.renderDetail();
    this.showPage("detail");
  }

  private renderDetail(): void {
    const domain = this.selectedDomain;
    this.detailSiteIcon.src = this.faviconFor(domain);
    this.detailSiteIcon.alt = domain;
    this.detailSiteName.textContent = domain.length > 14 ? domain.slice(0, 14) + ".." : domain;
    this.detailSiteName.title = domain;
    this.detailSiteTitle.textContent = domain;

    const state = this.popupService.getState();
    const sessions = state.sessions.filter((s) => s.domain === domain);
    const activeId = state.activeSessions[domain];

    this.sessionCount.textContent = `${sessions.length} session${sessions.length !== 1 ? "s" : ""}`;

    if (sessions.length === 0) {
      this.sessionsList.innerHTML = `
        <li class="text-center py-8 text-gray-500">
          <span class="material-symbols-rounded text-4xl mb-2 block">account_circle</span>
          <p>No saved sessions for this website</p>
        </li>`;
      return;
    }

    this.sessionsList.innerHTML = sessions.map((session) => this.renderSessionItem(session, activeId)).join("");
  }

  private renderSessionItem(session: SessionData, activeId?: string): string {
    const isActive = session.id === activeId;
    const safeName = escapeHtml(session.name);
    return `
      <li role="listitem">
        <article class="session-item ${isActive ? "active" : ""} flex items-center justify-between bg-white/50 p-3 rounded-lg shadow-sm cursor-pointer transition-colors hover:bg-orange-50"
          title="Switch to this account" data-action="switch-session" data-session-id="${session.id}">
          <div class="flex items-center flex-1 min-w-0">
            <span class="material-symbols-rounded text-gray-400 mr-3" aria-hidden="true">account_circle</span>
            <div class="min-w-0">
              <h3 class="font-medium text-gray-800 truncate">${safeName}</h3>
              <p class="text-sm text-gray-500">
                <time datetime="${new Date(session.lastUsed).toISOString()}">Last used: ${this.formatLastUsed(session.lastUsed)}</time>
                ${isActive ? "<span class=\"inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-300 text-orange-800\">Active</span>" : ""}
              </p>
            </div>
          </div>
          <nav class="flex items-center space-x-1 ml-2" aria-label="Session actions">
            <button type="button" class="p-2 rounded-none hover:bg-gray-200 hover:shadow-md focus-ring"
              title="Rename" aria-label="Rename ${safeName}" data-action="edit-session" data-session-id="${session.id}">
              <span class="material-symbols-rounded text-gray-600" aria-hidden="true">edit</span>
            </button>
            <button type="button" class="p-2 rounded-none hover:bg-gray-200 hover:shadow-md focus-ring"
              title="Delete" aria-label="Delete ${safeName}" data-action="delete-session" data-session-id="${session.id}">
              <span class="material-symbols-rounded text-gray-600" aria-hidden="true">delete</span>
            </button>
          </nav>
        </article>
      </li>`;
  }

  private openSaveModal(): void {
    if (!this.requireExtension()) return;

    const state = this.popupService.getState();
    this.websiteUrlInput.value = state.currentTab?.url ?? "";
    this.websiteUrlInput.readOnly = true;
    this.sessionNameInput.value = "";
    this.clearFieldError(this.sessionNameInput, this.sessionNameError);
    this.show(this.saveModal);
    this.sessionNameInput.focus();
  }

  private async handleConfirmSave(): Promise<void> {
    if (!this.requireExtension()) return;

    const name = this.sessionNameInput.value.trim();
    if (!name) {
      this.showFieldError(this.sessionNameInput, this.sessionNameError, "Please enter a session name");
      return;
    }

    try {
      await this.withLoading("Saving session...", async () => {
        await this.popupService.saveCurrentSession(name);
      });
      this.hide(this.saveModal);
      this.refreshAfterChange();
      this.showToast(`Session "${name}" saved`);
    } catch (error) {
      console.error("Save session error:", error);
      this.showFieldError(this.sessionNameInput, this.sessionNameError, handleError(error, "save session"));
    }
  }

  private async handleCreateNewSession(): Promise<void> {
    if (!this.requireExtension()) return;

    try {
      await this.withLoading("Clearing current session...", async () => {
        await this.popupService.createNewSession();
      });
      this.refreshAfterChange();
      this.showToast("Session cleared. Log in with another account, then press Save.");
    } catch (error) {
      console.error("Create new session error:", error);
      this.showToast(handleError(error, "create new session"));
    }
  }

  private async handleSwitch(sessionId: string): Promise<void> {
    if (!this.requireExtension()) return;

    try {
      await this.withLoading("Switching session...", async () => {
        await this.popupService.switchToSession(sessionId);
      });
      this.refreshAfterChange();
      this.showToast("Session switched");
    } catch (error) {
      console.error("Switch session error:", error);
      this.showToast(handleError(error, "switch session"));
    }
  }

  private openRenameModal(sessionId: string): void {
    if (!this.requireExtension()) return;

    const session = this.popupService.getSession(sessionId);
    if (!session) {
      this.showToast("Session not found");
      return;
    }

    this.renameSessionId = sessionId;
    this.renameInput.value = session.name;
    this.clearFieldError(this.renameInput, this.renameError);
    this.show(this.renameModal);
    this.renameInput.focus();
    this.renameInput.select();
  }

  private async handleConfirmRename(): Promise<void> {
    if (!this.requireExtension()) return;

    const newName = this.renameInput.value.trim();
    if (!newName) {
      this.showFieldError(this.renameInput, this.renameError, "Session name cannot be empty");
      return;
    }

    try {
      await this.popupService.renameSession(this.renameSessionId, newName);
      this.hide(this.renameModal);
      this.refreshAfterChange();
      this.showToast("Session renamed");
    } catch (error) {
      console.error("Rename session error:", error);
      this.showFieldError(this.renameInput, this.renameError, handleError(error, "rename session"));
    }
  }

  private openDeleteModal(sessionId: string): void {
    if (!this.requireExtension()) return;

    const session = this.popupService.getSession(sessionId);
    if (!session) {
      this.showToast("Session not found");
      return;
    }

    this.deleteSessionId = sessionId;
    this.deleteTargetDomain = "";
    const modalTitle = getElementByIdSafe("deleteModalTitle");
    const modalMessage = getElementByIdSafe("deleteModalMessage");
    const confirmBtn = getElementByIdSafe("confirmDeleteModal");

    modalTitle.textContent = "Delete Session";
    modalMessage.innerHTML =
      `Are you sure you want to delete session <span class="font-semibold text-gray-900">${escapeHtml(session.name)}</span>? This action cannot be undone.`;
    confirmBtn.querySelector("span:last-child")!.textContent = "Delete";
    this.show(this.deleteModal);
  }

  private async handleDeleteDomain(domain: string): Promise<void> {
    if (!this.requireExtension()) return;
    if (!domain) return;

    this.deleteTargetDomain = domain;
    const modalTitle = getElementByIdSafe("deleteModalTitle");
    const modalMessage = getElementByIdSafe("deleteModalMessage");
    const confirmBtn = getElementByIdSafe("confirmDeleteModal");

    modalTitle.textContent = "Delete Website";
    modalMessage.innerHTML =
      `Are you sure you want to delete <span class="font-semibold text-gray-900">${escapeHtml(domain)}</span> and all <span class="font-semibold text-gray-900">${this.popupService.getState().sessions.filter((s) => s.domain === domain).length} session(s)</span>? This action cannot be undone.`;
    confirmBtn.querySelector("span:last-child")!.textContent = "Delete Website";
    this.show(this.deleteModal);
  }

  private async handleConfirmDelete(): Promise<void> {
    if (!this.requireExtension()) return;

    // If a domain is targeted, delete by domain
    if (this.deleteTargetDomain) {
      const domain = this.deleteTargetDomain;
      this.deleteTargetDomain = "";
      try {
        await this.withLoading("Deleting sessions...", async () => {
          await this.popupService.deleteSessionsByDomain(domain);
        });
        this.hide(this.deleteModal);
        this.refreshAfterChange();
        this.showToast(`All sessions for ${domain} deleted`);
      } catch (error) {
        console.error("Delete domain error:", error);
        this.showToast(handleError(error, "delete domain"));
      }
      return;
    }

    // Otherwise delete a single session
    try {
      await this.popupService.deleteSession(this.deleteSessionId);
      this.hide(this.deleteModal);
      this.refreshAfterChange();
      this.showToast("Session deleted");
    } catch (error) {
      console.error("Delete session error:", error);
      this.showToast(handleError(error, "delete session"));
    }
  }

  private refreshAfterChange(): void {
    this.renderGrid();
    if (!this.detailPage.classList.contains("hidden") && this.selectedDomain) {
      this.renderDetail();
    }
  }

  private faviconFor(domain: string): string {
    const host = domain.split(":")[0];
    return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(host)}`;
  }

  private formatLastUsed(timestamp: number): string {
    const diffMs = Date.now() - timestamp;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    return "Just now";
  }

  private requireExtension(): boolean {
    if (!this.isExtensionEnvironment) {
      this.showToast("This feature requires the extension to be installed in the browser");
      return false;
    }
    return true;
  }

  private show(modal: HTMLElement): void {
    modal.classList.remove("hidden");
  }

  private hide(modal: HTMLElement): void {
    modal.classList.add("hidden");
  }

  private hideAllModals(): void {
    [this.saveModal, this.renameModal, this.deleteModal].forEach((modal) => this.hide(modal));
  }

  private async withLoading<T>(message: string, operation: () => Promise<T>): Promise<T> {
    this.loadingText.textContent = message;
    this.loadingOverlay.classList.remove("hidden");
    try {
      return await operation();
    } finally {
      this.loadingOverlay.classList.add("hidden");
    }
  }

  private showFieldError(input: HTMLInputElement, errorEl: HTMLElement, message: string): void {
    input.classList.add("input-error");
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
  }

  private clearFieldError(input: HTMLInputElement, errorEl: HTMLElement): void {
    input.classList.remove("input-error");
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
  }

  private showToast(message: string): void {
    this.toastManager.show(message);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Account Switcher popup loaded");

  try {
    const controller = new PopupController();
    await controller.initialize();

    if (typeof chrome !== "undefined" && typeof chrome.tabs !== "undefined") {
      const refresh = () => {
        controller.initialize().catch((error) => console.error("Re-initialize error:", error));
      };

      const tabActivatedListener = () => refresh();
      const tabUpdatedListener = (_: number, changeInfo: chrome.tabs.TabChangeInfo) => {
        if (changeInfo.status === "complete") refresh();
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
    } else {
      console.log("Running in non-extension environment - Chrome listeners not setup");
    }
  } catch (error) {
    console.error("Failed to setup popup:", error);
  }
});
