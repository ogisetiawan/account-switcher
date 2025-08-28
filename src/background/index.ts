import { STORAGE_KEYS } from "@shared/constants/storageKeys";
import { MessageService } from "./services/message.service";

const messageService = new MessageService();

// Extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log("Account Switcher extension started");
});

// Extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  console.log("Account Switcher extension installed/updated", details);

  if (details.reason === "install") {
    chrome.storage.local.set({
      [STORAGE_KEYS.SESSIONS]: [],
      [STORAGE_KEYS.ACTIVE_SESSIONS]: {},
    });
  }
});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  return messageService.handleMessage(message, sender, sendResponse);
});
