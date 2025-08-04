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
  name = "";
  parent: Node | null = null;
  children: Node[] = [];
  position = new Vec3();
  scale = new Vec3();
  active = false;
  private components: Component[] = [];
  // Anchor point is ignored in tests but must exist for code calling it
  // Called by production code; does nothing in tests
  setAnchorPoint(): void {
    // no-op for test environment
  }

  setPosition(pos: Vec2 | number, y?: number): void {
    if (pos instanceof Vec2) {
      this.position.x = pos.x;
      this.position.y = pos.y;
    } else {
      this.position.x = pos;
      this.position.y = y ?? 0;
    }
  }

  addComponent<T extends Component>(Ctor: new () => T): T {
    const c = new Ctor();
    c.node = this;
    this.components.push(c);
    return c;
  }

  getComponent<T extends Component>(Ctor: new () => T): T | null {
    return (this.components.find((c) => c instanceof Ctor) as T) || null;
  }
}

export class Component {
  node: unknown = new Node();
}

export const _decorator = {
  ccclass: () => () => {},
  property: () => () => {},
};

export class Label {
  string = "";
  node: unknown = new Node();
}

export class Button {
  node = new Node();
  static EventType = { CLICK: "click" };
}

export class Prefab {
  constructor(
    public name = "",
    public comp: new () => Component = Component,
  ) {}
}

export function instantiate(prefab: Prefab): Node {
  const node = new Node();
  node.name = prefab.name;
  node.addComponent(prefab.comp);
  return node;
}

export function v2(
  x: number | { x: number; y: number } | Vec2 = 0,
  y = 0,
): Vec2 {
  if (x instanceof Vec2) return new Vec2(x.x, x.y);
  if (typeof x === "object")
    return new Vec2(
      (x as { x: number; y: number }).x,
      (x as { x: number; y: number }).y,
    );
  return new Vec2(x, y);
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

export function tween<T extends { position?: unknown; scale?: unknown }>(
  target: T,
): {
  delay: (d: number) => unknown;
  to: (d: number, props: Partial<T>) => unknown;
  by: (d: number, props: Partial<T>) => unknown;
  call: (fn: () => void) => unknown;
  start: () => unknown;
} {
  const chain = {
    delay() {
      return chain;
    },
    to(_d: number, props: Partial<T>) {
      Object.assign(target as object, props);
      return chain;
    },
    by(_d: number, props: Partial<T>) {
      Object.assign(target as object, props);
      return chain;
    },
    call(fn: () => void) {
      fn();
      return chain;
    },
    start() {
      return chain;
    },
  };
  return chain;
}
