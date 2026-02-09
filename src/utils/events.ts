/**
 * Simple event emitter for React Native
 * Alternative to Node's EventEmitter which isn't available in React Native
 */
class AppEventEmitter {
  private listeners: { [key: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event: string, ...args: any[]) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(...args));
  }

  removeAllListeners(event?: string) {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}

export const appEvents = new AppEventEmitter();

export const EVENTS = {
  ONBOARDING_COMPLETED: 'onboarding:completed',
  ONBOARDING_RESET: 'onboarding:reset',
} as const;
