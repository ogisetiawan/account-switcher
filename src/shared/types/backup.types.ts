import { SessionData } from "./session.types";

export interface SessionBackupWebsite {
  domain: string;
  activeSessionId?: string;
  sessions: SessionData[];
}

export interface SessionBackup {
  format: "account-switcher-backup";
  version: 1;
  exportedAt: string;
  websites: SessionBackupWebsite[];
}

export interface ImportResult {
  importedSessions: number;
  skippedSessions: number;
  importedWebsites: number;
}
