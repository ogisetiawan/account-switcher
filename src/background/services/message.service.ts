import { SessionHandler } from "@background/handlers/session.handler";
import { MESSAGE_ACTIONS } from "@shared/constants/messages";
// import { REQUIRED_PERMISSIONS } from "@shared/constants/requiredPermission";
import { MessageType, SendResponseType, StoredSession } from "@shared/types";
import { handleError } from "@shared/utils/errorHandling";

export class MessageService {
  private sessionHandler = new SessionHandler();

  handleMessage(message: MessageType, _: chrome.runtime.MessageSender, sendResponse: SendResponseType): boolean {
    // Use async IIFE to properly handle async operations
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

    return true; // Keep message channel open for async response
  }

  private async checkPermissions(): Promise<void> {
    try {
      // For Firefox, be more lenient with permission checking
      const permissions = await chrome.permissions.getAll();

      // Check if we have basic required permissions
      if (!permissions.permissions || permissions.permissions.length === 0) {
        throw new Error("Basic permissions are required");
      }

      // Check for essential permissions
      const hasStorage = permissions.permissions.includes("storage");
      const hasTabs = permissions.permissions.includes("tabs");
      const hasCookies = permissions.permissions.includes("cookies");

      if (!hasStorage || !hasTabs || !hasCookies) {
        throw new Error("Storage, tabs, and cookies permissions are required");
      }

      // For Firefox, be more flexible with origin permissions
      const origins = permissions.origins || [];
      if (origins.length === 0) {
        // Try to continue anyway, as some Firefox versions might not report origins correctly
        console.warn("No origin permissions found, but continuing...");
      }
    } catch (error) {
      console.error("Permission check error:", error);
      // Don't throw error for permission issues, just log them
      // This allows the extension to continue working
    }
  }

  //? first run proccess extension
  private async processMessage(message: MessageType, sendResponse: SendResponseType): Promise<void> {
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

  private async handleGetCurrentSession(
    message: Extract<MessageType, { action: "getCurrentSession" }>,
    sendResponse: SendResponseType<StoredSession | null>
  ): Promise<void> {
    try {
      const sessionData = await this.sessionHandler.getCurrentSession(message.domain, message.tabId);
      sendResponse({ success: true, data: sessionData });
    } catch (error) {
      const errorMessage = handleError(error, "handleGetCurrentSession");
      console.error("Get current session error:", errorMessage);
      sendResponse({ success: false, error: errorMessage });
    }
  }

  private async handleSwitchSession(
    message: Extract<MessageType, { action: "switchSession" }>,
    sendResponse: SendResponseType
  ): Promise<void> {
    try {
      await this.sessionHandler.switchToSession(message.sessionData, message.tabId);
      sendResponse({ success: true });
    } catch (error) {
      const errorMessage = handleError(error, "handleSwitchSession");
      console.error("Switch session error:", errorMessage);
      sendResponse({ success: false, error: errorMessage });
    }
  }

  private async handleClearSession(
    message: Extract<MessageType, { action: "clearSession" }>,
    sendResponse: SendResponseType
  ): Promise<void> {
    try {
      await this.sessionHandler.clearSession(message.domain, message.tabId);
      sendResponse({ success: true });
    } catch (error) {
      const errorMessage = handleError(error, "handleClearSession");
      console.error("Clear session error:", errorMessage);
      sendResponse({ success: false, error: errorMessage });
    }
  }
}
