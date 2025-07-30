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

export const director = {
  loadScene: () => {},
  pause: () => {},
  resume: () => {},
};
