/**
 * EventBus — обёртка над cc.EventTarget
 * для публикации/подписки на события внутри игры.
 */
export class ExtendedEventTarget extends cc.EventTarget {
  // Можно добавить вспомогательный метод once,
  // так как его нет в cc.EventTarget по умолчанию.
  once(event: string, listener: (...args: unknown[]) => void): void {
    const callback = (...args: unknown[]) => {
      this.off(event, callback);
      listener(...args);
    };
    this.on(event, callback);
  }
}
