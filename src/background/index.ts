import { STORAGE_KEYS } from "@shared/constants/storageKeys";
import { MessageService } from "./services/message.service";

const messageService = new MessageService();

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.storage.local.set({
      [STORAGE_KEYS.SESSIONS]: [],
      [STORAGE_KEYS.ACTIVE_SESSIONS]: {},
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  return messageService.handleMessage(message, sender, sendResponse);
});
