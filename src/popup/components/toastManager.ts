export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

export class ToastManager {
  private toastEl: HTMLElement;
  private iconEl?: HTMLElement;
  private textEl?: HTMLElement;
  private timer?: ReturnType<typeof setTimeout>;
  private isVisible = false;

  constructor() {
    this.toastEl = document.getElementById("toast") as HTMLElement;
    if (!this.toastEl) {
      throw new Error("Toast element (#toast) not found in DOM");
    }
  }

  show(options: string | ToastOptions): void {
    const { message, type = "warning", duration = 3200 } =
      typeof options === "string" ? { message: options } : options;

    // Clear any existing timer
    if (this.timer) {
      clearTimeout(this.timer);
    }

    // Build icon name per type
    const iconMap: Record<string, string> = {
      success: "check_circle",
      error: "error",
      warning: "warning",
      info: "info",
    };

    // Update content with icon + text
    const icon = iconMap[type] ?? "info";
    this.toastEl.innerHTML = `
      <span class="toast__icon material-symbols-rounded" aria-hidden="true">${icon}</span>
      <span class="toast__text">${message}</span>
    `;

    // Set type class for styling
    this.toastEl.className = `toast toast--${type}`;

    // Trigger reflow for animation restart
    void this.toastEl.offsetWidth;

    // Show with animation
    this.toastEl.classList.add("toast--visible");
    this.isVisible = true;

    // Auto-dismiss
    this.timer = setTimeout(() => {
      this.hide();
    }, duration);
  }

  hide(): void {
    if (!this.isVisible) return;

    this.toastEl.classList.remove("toast--visible");
    this.isVisible = false;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  success(message: string, duration?: number): void {
    this.show({ message, type: "success", duration });
  }

  error(message: string, duration?: number): void {
    this.show({ message, type: "error", duration });
  }

  info(message: string, duration?: number): void {
    this.show({ message, type: "info", duration });
  }

  warning(message: string, duration?: number): void {
    this.show({ message, type: "warning", duration });
  }

  destroy(): void {
    this.hide();
  }
}