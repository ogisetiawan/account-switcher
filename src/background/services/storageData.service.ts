import { StorageData } from "@shared/types";

export function extractStorageData(): StorageData {
  try {
    const localStorageData: Record<string, string> = {};
    const sessionStorageData: Record<string, string> = {};

    // Extract localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          localStorageData[key] = value;
        }
      }
    }

    // Extract sessionStorage
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
      sessionStorage: sessionStorageData,
    };
  } catch (error) {
    console.error("Error extracting storage data:", error);
    return { localStorage: {}, sessionStorage: {} };
  }
}

export function injectStorageData(localData: Record<string, string>, sessionData: Record<string, string>): boolean {
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

export function clearStorage(): void {
  try {
    // Clear localStorage
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }

    // Clear sessionStorage
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.clear();
    }

    // Clear IndexedDB (basic approach)
    if (typeof indexedDB !== "undefined") {
      // This is a simplified approach - full IndexedDB clearing is more complex
      console.log("IndexedDB clearing would require more specific implementation");
    }

    console.log("Client-side storage cleared");
  } catch (error) {
    console.error("Error clearing client storage:", error);
  }
}
