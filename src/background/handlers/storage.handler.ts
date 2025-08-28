import { clearStorage, extractStorageData, injectStorageData } from "@background/services/storageData.service";
import { StorageData } from "@shared/types";
import { ExtensionError } from "@shared/utils/errorHandling";

export class StorageHandler {
  async getStorageData(tabId: number): Promise<StorageData> {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: extractStorageData,
      });

      return results?.[0]?.result || { localStorage: {}, sessionStorage: {} };
    } catch (error) {
      console.error("Error getting storage data:", error);
      return { localStorage: {}, sessionStorage: {} };
    }
  }

  async restoreStorageData(tabId: number, data: StorageData): Promise<void> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: injectStorageData,
        args: [data.localStorage, data.sessionStorage],
      });
    } catch (error) {
      throw new ExtensionError(`Failed to restore storage data: ${error}`);
    }
  }

  async clearStorageData(tabId: number): Promise<void> {
    try {
      // Check if chrome.scripting API is available
      if (!chrome.scripting) {
        throw new ExtensionError("Chrome scripting API not available");
      }

      // Check if tab is accessible
      const tab = await chrome.tabs.get(tabId);
      if (!tab || !tab.url) {
        throw new ExtensionError("Tab not accessible");
      }

      // Skip for chrome:// or extension:// URLs
      if (tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) {
        console.log("Skipping storage clear for system URL:", tab.url);
        return;
      }

      await chrome.scripting.executeScript({
        target: { tabId },
        func: clearStorage,
      });

      console.log("Storage cleared successfully for tab:", tabId);
    } catch (error) {
      console.error("Storage clear error:", error);
      throw new ExtensionError(`Failed to clear storage data: ${error}`);
    }
  }
}
