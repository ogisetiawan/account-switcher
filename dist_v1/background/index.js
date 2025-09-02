"use strict";
(() => {
  // src/shared/constants/storageKeys.ts
  var STORAGE_KEYS = {
    SESSIONS: "sessions",
    ACTIVE_SESSIONS: "activeSessions"
  };

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

  // src/background/handlers/cookie.handler.ts
  var CookieHandler = class {
    async getCookiesForDomain(domain) {
      try {
        console.log("Getting cookies for domain:", domain);
        const stores = await chrome.cookies.getAllCookieStores();
        const allCookies = [];
        const currentDomain = domain.split(":")[0];
        for (const store of stores) {
          try {
            const cookies = await chrome.cookies.getAll({ storeId: store.id });
            const domainCookies = cookies.filter((cookie) => {
              const slicedCookieDomain = cookie.domain.startsWith(".") ? cookie.domain.slice(1) : cookie.domain;
              return slicedCookieDomain === currentDomain || slicedCookieDomain === `www.${currentDomain}` || currentDomain.endsWith(slicedCookieDomain);
            });
            allCookies.push(...domainCookies);
          } catch (storeError) {
            console.warn("Failed to get cookies from store:", store.id, storeError);
          }
        }
        console.log("Cookies retrieved successfully:", allCookies.length);
        return allCookies;
      } catch (error) {
        console.error("Error getting cookies for domain:", domain, error);
        return [];
      }
    }
    async clearCookiesForDomain(domain) {
      try {
        console.log("Clearing cookies for domain:", domain);
        const cookies = await this.getCookiesForDomain(domain);
        if (cookies.length === 0) {
          console.log("No cookies to clear");
          return;
        }
        const clearPromises = cookies.map(async (cookie) => {
          try {
            await chrome.cookies.remove({
              url: this.buildCookieUrl(cookie, domain),
              name: cookie.name,
              storeId: cookie.storeId
            });
          } catch (error) {
            console.warn("Failed to remove cookie:", cookie.name, error);
          }
        });
        await Promise.all(clearPromises);
        console.log("Cookies cleared successfully");
      } catch (error) {
        console.error("Error clearing cookies for domain:", domain, error);
      }
    }
    async restoreCookies(cookies, domain) {
      try {
        console.log("Restoring cookies for domain:", domain, "count:", cookies.length);
        if (cookies.length === 0) {
          console.log("No cookies to restore");
          return;
        }
        const restorePromises = cookies.map(async (cookie) => {
          try {
            const cookieDetails = this.prepareCookieForRestore(cookie, domain);
            await chrome.cookies.set(cookieDetails);
          } catch (error) {
            console.warn("Failed to restore cookie:", cookie.name, error);
          }
        });
        await Promise.all(restorePromises);
        console.log("Cookies restored successfully");
      } catch (error) {
        console.error("Error restoring cookies for domain:", domain, error);
      }
    }
    buildCookieUrl(cookie, fallbackDomain) {
      try {
        const protocol = cookie.secure ? "https" : "http";
        let domain = cookie.domain;
        if (domain.startsWith(".")) {
          domain = domain.slice(1);
        }
        if (!domain && fallbackDomain) {
          domain = fallbackDomain;
        }
        if (!domain) {
          throw new Error(`Invalid domain for cookie ${cookie.name}: ${cookie.domain}`);
        }
        const path = cookie.path || "/";
        return `${protocol}://${domain}${path}`;
      } catch (error) {
        console.error("Error building cookie URL:", error);
        return `http://${fallbackDomain || "localhost"}/`;
      }
    }
    prepareCookieForRestore(cookie, fallbackDomain) {
      try {
        const url = this.buildCookieUrl(cookie, fallbackDomain);
        const cookieDetails = {
          url,
          name: cookie.name,
          value: cookie.value,
          path: cookie.path,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          storeId: cookie.storeId
        };
        if (cookie.domain && cookie.domain.startsWith(".")) {
          cookieDetails.domain = cookie.domain;
        }
        if (!cookie.session && cookie.expirationDate) {
          cookieDetails.expirationDate = cookie.expirationDate;
        }
        if (cookie.sameSite && cookie.sameSite !== "unspecified") {
          cookieDetails.sameSite = cookie.sameSite;
        }
        return cookieDetails;
      } catch (error) {
        console.error("Error preparing cookie for restore:", error);
        return {
          url: `http://${fallbackDomain}/`,
          name: cookie.name,
          value: cookie.value,
          path: "/",
          secure: false,
          httpOnly: false,
          storeId: cookie.storeId
        };
      }
    }
  };

  // src/background/services/storageData.service.ts
  function extractStorageData() {
    try {
      const localStorageData = {};
      const sessionStorageData = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value !== null) {
            localStorageData[key] = value;
          }
        }
      }
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          const value = sessionStorage.getItem(key);
          if (value !== null) {
            sessionStorageData[key] = value;
          }
        }
      }
      return {
        localStorage: localStorageData,
        sessionStorage: sessionStorageData
      };
    } catch (error) {
      console.error("Error extracting storage data:", error);
      return { localStorage: {}, sessionStorage: {} };
    }
  }
  function injectStorageData(localData, sessionData) {
    try {
      localStorage.clear();
      sessionStorage.clear();
      Object.entries(localData).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      Object.entries(sessionData).forEach(([key, value]) => {
        sessionStorage.setItem(key, value);
      });
      return true;
    } catch (error) {
      console.error("Error injecting storage data:", error);
      return false;
    }
  }
  function clearStorage() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.clear();
      }
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.clear();
      }
      if (typeof indexedDB !== "undefined") {
        console.log("IndexedDB clearing would require more specific implementation");
      }
      console.log("Client-side storage cleared");
    } catch (error) {
      console.error("Error clearing client storage:", error);
    }
  }

  // src/background/handlers/storage.handler.ts
  var StorageHandler = class {
    async getStorageData(tabId) {
      var _a;
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId },
          func: extractStorageData
        });
        return ((_a = results == null ? void 0 : results[0]) == null ? void 0 : _a.result) || { localStorage: {}, sessionStorage: {} };
      } catch (error) {
        console.error("Error getting storage data:", error);
        return { localStorage: {}, sessionStorage: {} };
      }
    }
    async restoreStorageData(tabId, data) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          func: injectStorageData,
          args: [data.localStorage, data.sessionStorage]
        });
      } catch (error) {
        throw new ExtensionError(`Failed to restore storage data: ${error}`);
      }
    }
    async clearStorageData(tabId) {
      try {
        if (!chrome.scripting) {
          throw new ExtensionError("Chrome scripting API not available");
        }
        const tab = await chrome.tabs.get(tabId);
        if (!tab || !tab.url) {
          throw new ExtensionError("Tab not accessible");
        }
        if (tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) {
          console.log("Skipping storage clear for system URL:", tab.url);
          return;
        }
        await chrome.scripting.executeScript({
          target: { tabId },
          func: clearStorage
        });
        console.log("Storage cleared successfully for tab:", tabId);
      } catch (error) {
        console.error("Storage clear error:", error);
        throw new ExtensionError(`Failed to clear storage data: ${error}`);
      }
    }
  };

  // src/background/handlers/session.handler.ts
  var SessionHandler = class {
    constructor() {
      this.cookieHandler = new CookieHandler();
      this.storageHandler = new StorageHandler();
    }
    async getCurrentSession(domain, tabId) {
      try {
        console.log("Getting current session for domain:", domain, "tabId:", tabId);
        const [cookies, storageData] = await Promise.all([
          this.cookieHandler.getCookiesForDomain(domain),
          this.storageHandler.getStorageData(tabId)
        ]);
        const session = {
          cookies,
          localStorage: storageData.localStorage,
          sessionStorage: storageData.sessionStorage
        };
        console.log("Current session retrieved successfully");
        return session;
      } catch (error) {
        console.error("Failed to get current session:", error);
        return {
          cookies: [],
          localStorage: {},
          sessionStorage: {}
        };
      }
    }
    async switchToSession(sessionData, tabId) {
      const { domain, cookies, localStorage: localStorage2, sessionStorage: sessionStorage2 } = sessionData;
      try {
        console.log("Switching to session for domain:", domain, "tabId:", tabId);
        await this.cookieHandler.clearCookiesForDomain(domain);
        await this.storageHandler.clearStorageData(tabId);
        await Promise.all([
          this.cookieHandler.restoreCookies(cookies, domain),
          this.storageHandler.restoreStorageData(tabId, {
            localStorage: localStorage2,
            sessionStorage: sessionStorage2
          })
        ]);
        await chrome.tabs.reload(tabId);
        console.log("Session switched successfully");
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
    async clearSession(domain, tabId) {
      const errors = [];
      try {
        console.log("Clearing session for domain:", domain, "tabId:", tabId);
        const tab = await chrome.tabs.get(tabId).catch(() => null);
        if (!tab) {
          throw new ExtensionError("Tab not found or accessible");
        }
        const results = await Promise.allSettled([
          this.cookieHandler.clearCookiesForDomain(domain),
          this.storageHandler.clearStorageData(tabId)
        ]);
        results.forEach((result, index) => {
          if (result.status === "rejected") {
            const operation = index === 0 ? "cookies" : "storage";
            errors.push(`${operation}: ${result.reason}`);
            console.warn(`Failed to clear ${operation}:`, result.reason);
          }
        });
        await this.reloadTabWithRetry(tabId);
        if (errors.length === 0) {
          console.log("Session cleared successfully");
        } else {
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
    async reloadTabWithRetry(tabId, maxRetries = 3) {
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
  };

  // src/shared/constants/messages.ts
  var MESSAGE_ACTIONS = {
    GET_CURRENT_SESSION: "getCurrentSession",
    SWITCH_SESSION: "switchSession",
    CLEAR_SESSION: "clearSession"
  };

  // src/background/services/message.service.ts
  var MessageService = class {
    constructor() {
      this.sessionHandler = new SessionHandler();
    }
    handleMessage(message, _, sendResponse) {
      (async () => {
        try {
          await this.checkPermissions();
          await this.processMessage(message, sendResponse);
        } catch (error) {
          const errorMessage = handleError(error, "MessageService.handleMessage");
          console.error("MessageService error:", errorMessage);
          sendResponse({ success: false, error: errorMessage });
        }
      })();
      return true;
    }
    async checkPermissions() {
      try {
        const permissions = await chrome.permissions.getAll();
        if (!permissions.permissions || permissions.permissions.length === 0) {
          throw new Error("Basic permissions are required");
        }
        const hasStorage = permissions.permissions.includes("storage");
        const hasTabs = permissions.permissions.includes("tabs");
        const hasCookies = permissions.permissions.includes("cookies");
        if (!hasStorage || !hasTabs || !hasCookies) {
          throw new Error("Storage, tabs, and cookies permissions are required");
        }
        const origins = permissions.origins || [];
        if (origins.length === 0) {
          console.warn("No origin permissions found, but continuing...");
        }
      } catch (error) {
        console.error("Permission check error:", error);
      }
    }
    //? first run proccess extension
    async processMessage(message, sendResponse) {
      console.log("#test, apakah ini init?");
      try {
        switch (message.action) {
          case MESSAGE_ACTIONS.GET_CURRENT_SESSION:
            await this.handleGetCurrentSession(message, sendResponse);
            break;
          case MESSAGE_ACTIONS.SWITCH_SESSION:
            await this.handleSwitchSession(message, sendResponse);
            break;
          case MESSAGE_ACTIONS.CLEAR_SESSION:
            await this.handleClearSession(message, sendResponse);
            break;
          default:
            sendResponse({ success: false, error: "Unknown action" });
        }
      } catch (error) {
        const errorMessage = handleError(error, "MessageService.processMessage");
        console.error("Process message error:", errorMessage);
        sendResponse({ success: false, error: errorMessage });
      }
    }
    async handleGetCurrentSession(message, sendResponse) {
      try {
        const sessionData = await this.sessionHandler.getCurrentSession(message.domain, message.tabId);
        sendResponse({ success: true, data: sessionData });
      } catch (error) {
        const errorMessage = handleError(error, "handleGetCurrentSession");
        console.error("Get current session error:", errorMessage);
        sendResponse({ success: false, error: errorMessage });
      }
    }
    async handleSwitchSession(message, sendResponse) {
      try {
        await this.sessionHandler.switchToSession(message.sessionData, message.tabId);
        sendResponse({ success: true });
      } catch (error) {
        const errorMessage = handleError(error, "handleSwitchSession");
        console.error("Switch session error:", errorMessage);
        sendResponse({ success: false, error: errorMessage });
      }
    }
    async handleClearSession(message, sendResponse) {
      try {
        await this.sessionHandler.clearSession(message.domain, message.tabId);
        sendResponse({ success: true });
      } catch (error) {
        const errorMessage = handleError(error, "handleClearSession");
        console.error("Clear session error:", errorMessage);
        sendResponse({ success: false, error: errorMessage });
      }
    }
  };

  // src/background/index.ts
  var messageService = new MessageService();
  chrome.runtime.onStartup.addListener(() => {
    console.log("Account Switcher extension started");
  });
  chrome.runtime.onInstalled.addListener((details) => {
    console.log("Account Switcher extension installed/updated", details);
    if (details.reason === "install") {
      chrome.storage.local.set({
        [STORAGE_KEYS.SESSIONS]: [],
        [STORAGE_KEYS.ACTIVE_SESSIONS]: {}
      });
    }
  });
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    return messageService.handleMessage(message, sender, sendResponse);
  });
})();
