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
    const { message, type = "info", duration = 3200 } =
      typeof options === "string" ? { message: options } : options;

    // Clear any existing timer
    if (this.timer) {
      clearTimeout(this.timer);
    }

    // Update content
    this.toastEl.textContent = message;

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