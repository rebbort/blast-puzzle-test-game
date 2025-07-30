declare namespace cc {
  class Vec2 {
    constructor(x?: number, y?: number);
    x: number;
    y: number;
  }

  class Vec3 {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
  }

  class Node {
    scale: Vec3;
    active: boolean;
  }

  function tween(target: unknown): {
    to(
      duration: number,
      props: Record<string, unknown>,
      opts?: { easing?: string },
    ): ReturnType<typeof tween>;
    start(): void;
  };

  const _decorator: {
    ccclass(name?: string): ClassDecorator;
  };

  class Component {
    node: unknown;
  }

  const director: {
    loadScene(name: string): void;
    pause(): void;
    resume(): void;
  };

  class Label {
    string: string;
    node: unknown;
  }

  class Button {
    node: unknown;
  }
}

declare module "cc" {
  export = cc;
}
