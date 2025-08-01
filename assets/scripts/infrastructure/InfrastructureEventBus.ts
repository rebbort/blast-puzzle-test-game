export class InfrastructureEventBus {
  private target = new cc.EventTarget();
  private registry: Map<string, Set<(...args: unknown[]) => void>> = new Map();

  on(
    eventName: string,
    handler: (...args: unknown[]) => void,
    target?: unknown,
    useCapture?: boolean,
  ): void {
    // Привязываем контекст если передан target
    const boundHandler = target ? handler.bind(target) : handler;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.target.on(eventName, boundHandler, target, useCapture);
    let set = this.registry.get(eventName);
    if (!set) {
      set = new Set();
      this.registry.set(eventName, set);
    }
    set.add(boundHandler);
  }

  off(
    eventName: string,
    handler?: (...args: unknown[]) => void,
    target?: unknown,
  ): void {
    // Привязываем контекст если передан target и handler
    const boundHandler = target && handler ? handler.bind(target) : handler;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.target.off(eventName, boundHandler, target);
    const set = this.registry.get(eventName);
    if (set && boundHandler) {
      set.delete(boundHandler);
      if (set.size === 0) {
        this.registry.delete(eventName);
      }
    } else if (set && !boundHandler) {
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
      // Привязываем контекст для listener
      const boundListener = target ? listener.bind(target) : listener;
      boundListener(...args);
    };
    this.on(event, callback, target);
  }

  emit(eventName: string, ...args: unknown[]): void {
    const count = this.getListenerCount(eventName);
    if (count === 0) {
      console.warn(
        `EventBus: emitted event '${eventName}' has no listeners (possible typo or initialization issue)`,
      );
      // if (typeof CC_DEBUG !== "undefined" && CC_DEBUG) {
      //   console.warn(new Error().stack);
      // }
    }
    console.log("emit", eventName, args);
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
        set.forEach((h) => {
          // console.log("off", eventName, h);
          this.target.off(eventName, h);
        });
      }
      this.registry.delete(eventName);
    } else {
      this.registry.forEach((handlers, evt) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handlers.forEach((h) => {
          // console.log("off", evt, h);
          this.target.off(evt, h);
        });
      });
      this.registry.clear();
    }
  }
}
