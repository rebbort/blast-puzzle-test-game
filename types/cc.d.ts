declare module "cc" {
  export class Vec2 {
    constructor(x?: number, y?: number);
    x: number;
    y: number;
  }

  export class Vec3 {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
  }

  export class Node {
    scale: Vec3;
  }

  export class Label {
    string: string;
  }

  export class Button {
    node: Node;
    static EventType: { CLICK: string };
  }

  export function tween(target: unknown): {
    to(
      duration: number,
      props: Record<string, unknown>,
      opts?: { easing?: string },
    ): ReturnType<typeof tween>;
    start(): void;
  };

  /** Minimal stub for Cocos decorator system. */
  export const _decorator: {
    /** Marks a class as a Cocos component. */
    ccclass(name?: string): ClassDecorator;
  };

  /** Base component class every behaviour derives from. */
  export class Component {
    node: unknown;
  }

  /** Provides scene management utilities. */
  export const director: {
    /** Loads a scene by its name. */
    loadScene(name: string): void;
  };

  /** Simplified label component used to display text in the HUD. */
  export class Label {
    /** Text contents shown on screen. */
    string: string;
    /** Node the component is attached to. */
    node: unknown;
  }

  /** Minimal clickable UI element. */
  export class Button {
    /** Root node this button controls. */
    node: unknown;
  }
}
