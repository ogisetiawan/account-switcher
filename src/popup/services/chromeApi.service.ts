import { MessageResponse, MessageType } from "@shared/types";

export class ChromeApiService {
  private readonly MESSAGE_TIMEOUT = 10000; // 10 seconds timeout
  private isExtensionEnvironment = false;

  constructor() {
    // Check if we're running in an extension environment
    this.isExtensionEnvironment =
      typeof chrome !== "undefined" && typeof chrome.runtime !== "undefined" && typeof chrome.tabs !== "undefined";

    if (!this.isExtensionEnvironment) {
      console.warn("Chrome APIs not available - running in non-extension environment");
    }
  }

  async getCurrentTab(): Promise<chrome.tabs.Tab> {
    try {
      if (!this.isExtensionEnvironment) {
        // Return mock tab for non-extension environment
        return {
          id: 1,
          url: window.location.href,
          title: document.title,
          active: true,
          windowId: 1,
        } as chrome.tabs.Tab;
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

  async sendMessage<T>(message: MessageType): Promise<MessageResponse<T>> {
    if (!this.isExtensionEnvironment) {
      // Return mock response for non-extension environment
      console.warn("Chrome runtime not available - returning mock response");
      return {
        success: true,
        data: null as T,
      };
    }

    return new Promise((resolve, reject) => {
      // Add timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        reject(new Error("Message timeout - no response received"));
      }, this.MESSAGE_TIMEOUT);

      try {
        chrome.runtime.sendMessage(message, (response: MessageResponse<T>) => {
          clearTimeout(timeoutId);

          if (chrome.runtime.lastError) {
            resolve({
              success: false,
              error: chrome.runtime.lastError.message || "Runtime error occurred",
            });
          } else if (!response) {
            resolve({
              success: false,
              error: "No response received from background script",
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

  async getStorageData<T>(keys: (keyof T)[]): Promise<T> {
    try {
      if (!this.isExtensionEnvironment) {
        // Return mock storage data for non-extension environment
        console.warn("Chrome storage not available - returning mock data");
        return {} as T;
      }

      const result = await chrome.storage.local.get(keys);
      return result as T;
    } catch (error) {
      console.error("Error getting storage data:", error);
      throw new Error("Failed to get storage data");
    }
  }

  async setStorageData(data: Record<string, unknown>): Promise<void> {
    try {
      if (!this.isExtensionEnvironment) {
        // Mock storage operation for non-extension environment
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
  isExtension(): boolean {
    return this.isExtensionEnvironment;
  }
}
