import { SessionData, StoredSession } from "@shared/types";
import { ExtensionError } from "@shared/utils/errorHandling";
import { CookieHandler } from "./cookie.handler";
import { StorageHandler } from "./storage.handler";

export class SessionHandler {
  private cookieHandler = new CookieHandler();
  private storageHandler = new StorageHandler();

  async getCurrentSession(domain: string, tabId: number): Promise<StoredSession> {
    try {
      const [cookies, storageData] = await Promise.all([
        this.cookieHandler.getCookiesForDomain(domain),
        this.storageHandler.getStorageData(tabId),
      ]);

      return {
        cookies,
        localStorage: storageData.localStorage,
        sessionStorage: storageData.sessionStorage,
      };
    } catch (error) {
      console.error("Failed to get current session:", error);
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
      await this.cookieHandler.clearCookiesForDomain(domain);
      await this.storageHandler.clearStorageData(tabId);

      await Promise.all([
        this.cookieHandler.restoreCookies(cookies, domain),
        this.storageHandler.restoreStorageData(tabId, {
          localStorage,
          sessionStorage,
        }),
      ]);

      await chrome.tabs.reload(tabId);
    } catch (error) {
      console.error("Failed to switch session:", error);
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
      const tab = await chrome.tabs.get(tabId).catch(() => null);
      if (!tab) {
        throw new ExtensionError("Tab not found or accessible");
      }

      const results = await Promise.allSettled([
        this.cookieHandler.clearCookiesForDomain(domain),
        this.storageHandler.clearStorageData(tabId),
      ]);

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          const operation = index === 0 ? "cookies" : "storage";
          errors.push(`${operation}: ${result.reason}`);
          console.warn(`Failed to clear ${operation}:`, result.reason);
        }
      });

      await this.reloadTabWithRetry(tabId);
      if (errors.length > 0) {
        console.warn("Session partially cleared with errors:", errors);
      }
    } catch (error) {
      console.error("Failed to clear session:", error);

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
        await new Promise((resolve) => setTimeout(resolve, 100 * (i + 1)));
      }
    }
  }
}
