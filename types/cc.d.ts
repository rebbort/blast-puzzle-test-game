declare module "cc" {
  export class Vec2 {
    constructor(x?: number, y?: number);
    x: number;
    y: number;
  }

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
