import { SessionData, StoredSession } from "@shared/types";
import { ExtensionError } from "@shared/utils/errorHandling";
import { CookieHandler } from "./cookie.handler";
import { StorageHandler } from "./storage.handler";

export class SessionHandler {
  private cookieHandler = new CookieHandler();
  private storageHandler = new StorageHandler();

  async getCurrentSession(domain: string, tabId: number): Promise<StoredSession> {
    try {
      console.log("Getting current session for domain:", domain, "tabId:", tabId);

      const [cookies, storageData] = await Promise.all([
        this.cookieHandler.getCookiesForDomain(domain),
        this.storageHandler.getStorageData(tabId),
      ]);

      const session = {
        cookies,
        localStorage: storageData.localStorage,
        sessionStorage: storageData.sessionStorage,
      };

      console.log("Current session retrieved successfully");
      return session;
    } catch (error) {
      console.error("Failed to get current session:", error);
      // Return empty session data as fallback
      return {
        cookies: [],
        localStorage: {},
        sessionStorage: {},
      };
    }
  }

  async switchToSession(sessionData: SessionData, tabId: number): Promise<void> {
    const { domain, cookies, localStorage, sessionStorage } = sessionData;

    try {
      console.log("Switching to session for domain:", domain, "tabId:", tabId);

      // Clear existing session data
      await this.cookieHandler.clearCookiesForDomain(domain);
      await this.storageHandler.clearStorageData(tabId);

      // Restore session data
      await Promise.all([
        this.cookieHandler.restoreCookies(cookies, domain),
        this.storageHandler.restoreStorageData(tabId, {
          localStorage,
          sessionStorage,
        }),
      ]);

      // Reload tab to apply changes
      await chrome.tabs.reload(tabId);
      console.log("Session switched successfully");
    } catch (error) {
      console.error("Failed to switch session:", error);
      // Try to reload tab anyway to ensure user sees some change
      try {
        await chrome.tabs.reload(tabId);
      } catch (reloadError) {
        console.error("Failed to reload tab:", reloadError);
      }
      throw new ExtensionError(`Failed to switch session: ${error}`);
    }
  }

  async clearSession(domain: string, tabId: number): Promise<void> {
    const errors: string[] = [];
    try {
      console.log("Clearing session for domain:", domain, "tabId:", tabId);

      // Get tab info first to validate
      const tab = await chrome.tabs.get(tabId).catch(() => null);
      if (!tab) {
        throw new ExtensionError("Tab not found or accessible");
      }

      // Clear cookies and storage with individual error handling
      const results = await Promise.allSettled([
        this.cookieHandler.clearCookiesForDomain(domain),
        this.storageHandler.clearStorageData(tabId),
      ]);

      // Check results and collect errors
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          const operation = index === 0 ? "cookies" : "storage";
          errors.push(`${operation}: ${result.reason}`);
          console.warn(`Failed to clear ${operation}:`, result.reason);
        }
      });

      // Reload tab to apply changes (with retry logic)
      await this.reloadTabWithRetry(tabId);
      if (errors.length === 0) {
        console.log("Session cleared successfully");
      } else {
        console.warn("Session partially cleared with errors:", errors);
        // Don't throw if at least one operation succeeded
      }
    } catch (error) {
      console.error("Failed to clear session:", error);

      // Try to reload tab anyway as last resort
      try {
        await chrome.tabs.reload(tabId);
      } catch (reloadError) {
        console.error("Failed to reload tab:", reloadError);
        errors.push(`reload: ${reloadError}`);
      }

      const combinedErrors = errors.length > 0 ? errors.join("; ") : error;
      throw new ExtensionError(`Failed to clear session: ${combinedErrors}`);
    }
  }

  private async reloadTabWithRetry(tabId: number, maxRetries: number = 3): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await chrome.tabs.reload(tabId);
        return;
      } catch (error) {
        console.warn(`Reload attempt ${i + 1} failed:`, error);
        if (i === maxRetries - 1) {
          throw error;
        }
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 100 * (i + 1)));
      }
    }
  }
}
