export class InfrastructureEventBus {
  private target = new cc.EventTarget();
  private registry: Map<string, Set<(...args: unknown[]) => void>> = new Map();

  on(
    eventName: string,
    handler: (...args: unknown[]) => void,
    target?: unknown,
    useCapture?: boolean,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.target as any).on(eventName, handler, target, useCapture);
    let set = this.registry.get(eventName);
    if (!set) {
      set = new Set();
      this.registry.set(eventName, set);
    }
    set.add(handler);
  }

  off(
    eventName: string,
    handler?: (...args: unknown[]) => void,
    target?: unknown,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.target as any).off(eventName, handler, target);
    const set = this.registry.get(eventName);
    if (set && handler) {
      set.delete(handler);
      if (set.size === 0) {
        this.registry.delete(eventName);
      }
    } else if (set && !handler) {
      this.registry.delete(eventName);
    }
  }

  once(
    event: string,
    listener: (...args: unknown[]) => void,
    target?: unknown,
  ): void {
    const callback = (...args: unknown[]) => {
      this.off(event, callback, target);
      listener(...args);
    };
    this.on(event, callback, target);
  }

  emit(eventName: string, ...args: unknown[]): void {
    const count = this.getListenerCount(eventName);
    if (count === 0) {
      console.warn(
        `EventBus: emitted event '${eventName}' has no listeners (possible typo or initialization issue)`,
      );
      if (typeof CC_DEBUG !== "undefined" && CC_DEBUG) {
        console.warn(new Error().stack);
      }
    }
    this.target.emit(eventName, ...args);
  }

  getListenerCount(eventName: string): number {
    return this.registry.get(eventName)?.size ?? 0;
  }

  clear(eventName?: string): void {
    if (eventName) {
      const set = this.registry.get(eventName);
      if (set) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        set.forEach((h) => (this.target as any).off(eventName, h));
      }
      this.registry.delete(eventName);
    } else {
      this.registry.forEach((handlers, evt) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handlers.forEach((h) => (this.target as any).off(evt, h));
      });
      this.registry.clear();
    }
  }
}
