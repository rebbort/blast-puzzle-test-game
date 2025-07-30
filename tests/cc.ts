export class Vec2 {
  x: number;
  y: number;
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}

export class Vec3 {
  x: number;
  y: number;
  z: number;
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

export class Node {
  scale = new Vec3();
  active = false;
}

export class Component {
  node: unknown = new Node();
}

export const _decorator = {
  ccclass: () => () => {},
};

export class Label {
  string = "";
  node: unknown = new Node();
}

export class Button {
  node = new Node();
  static EventType = { CLICK: "click" };
}

export class EventTarget {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private listeners: Record<string, ((...args: any[]) => void)[]> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, cb: (...args: any[]) => void): void {
    (this.listeners[event] = this.listeners[event] || []).push(cb);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(event: string, cb: (...args: any[]) => void): void {
    this.listeners[event] = (this.listeners[event] || []).filter(
      (h) => h !== cb,
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit(event: string, ...args: any[]): void {
    (this.listeners[event] || []).forEach((h) => h(...args));
  }
  clear(event?: string): void {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}

export const director = {
  loadScene: () => {},
  pause: () => {},
  resume: () => {},
};
