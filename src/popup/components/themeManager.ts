import { STORAGE_KEYS } from "@shared/constants/storageKeys";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = Exclude<ThemeMode, "system">;

export class ThemeManager {
  private mode: ThemeMode = "system";
  private readonly systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

  constructor() {
    this.systemTheme.addEventListener("change", () => {
      if (this.mode === "system") {
        this.applyTheme();
      }
    });
  }

  async initialize(): Promise<ThemeMode> {
    this.mode = await this.loadMode();
    this.applyTheme();
    return this.mode;
  }

  async setMode(mode: ThemeMode): Promise<void> {
    this.mode = mode;
    this.applyTheme();

    if (this.isExtensionEnvironment()) {
      await chrome.storage.local.set({ [STORAGE_KEYS.THEME]: mode });
    } else {
      localStorage.setItem(STORAGE_KEYS.THEME, mode);
    }
  }

  getMode(): ThemeMode {
    return this.mode;
  }

  private async loadMode(): Promise<ThemeMode> {
    try {
      const value = this.isExtensionEnvironment()
        ? (await chrome.storage.local.get(STORAGE_KEYS.THEME))[STORAGE_KEYS.THEME]
        : localStorage.getItem(STORAGE_KEYS.THEME);

      return this.isThemeMode(value) ? value : "system";
    } catch (error) {
      console.error("Failed to load theme preference:", error);
      return "system";
    }
  }

  private applyTheme(): void {
    const resolved: ResolvedTheme =
      this.mode === "system" ? (this.systemTheme.matches ? "dark" : "light") : this.mode;

    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.themeMode = this.mode;
  }

  private isThemeMode(value: unknown): value is ThemeMode {
    return value === "light" || value === "dark" || value === "system";
  }

  private isExtensionEnvironment(): boolean {
    return typeof chrome !== "undefined" && typeof chrome.storage?.local !== "undefined";
  }
}
