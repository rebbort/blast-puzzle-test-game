import { InfrastructureEventBus } from "../../assets/scripts/infrastructure/InfrastructureEventBus";
import { Board } from "../../assets/scripts/core/board/Board";
import { TileFactory, TileKind } from "../../assets/scripts/core/board/Tile";
import { MoveExecutor } from "../../assets/scripts/core/board/MoveExecutor";
import { BoardConfig } from "../../assets/scripts/config/ConfigLoader";
import { EventNames } from "../../assets/scripts/core/events/EventNames";
import { FXController } from "../../assets/scripts/core/fx/FXController";

const cfg: BoardConfig = {
  cols: 1,
  rows: 2,
  tileWidth: 1,
  tileHeight: 1,
  colors: ["red"],
  superThreshold: 3,
};

describe("super-tile VFX delay", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  interface MockNode {
    on(event: string, cb: (...args: unknown[]) => void): void;
    off(event: string, cb: (...args: unknown[]) => void): void;
    once(event: string, cb: (...args: unknown[]) => void): void;
    emit(event: string, ...args: unknown[]): void;
    destroy(): void;
    getComponent(_: unknown): { play: () => Promise<void> };
    getComponentInChildren(_: unknown): unknown;
    setPosition(_: cc.Vec2): void;
  }

  function mockVfx(): MockNode[] {
    const nodes: MockNode[] = [];
    (cc as unknown as { director: { getScene: () => cc.Scene } }).director = {
      getScene: () =>
        ({
          addChild: jest.fn(),
          autoReleaseAssets: false,
        }) as unknown as cc.Scene,
    };
    jest.spyOn(cc, "instantiate").mockImplementation(() => {
      const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
      const node: MockNode = {
        on(event: string, cb: (...args: unknown[]) => void): void {
          (listeners[event] || (listeners[event] = [])).push(cb);
        },
        off(event: string, cb: (...args: unknown[]) => void): void {
          const arr = listeners[event];
          if (!arr) return;
          const idx = arr.indexOf(cb);
          if (idx >= 0) arr.splice(idx, 1);
        },
        once(event: string, cb: (...args: unknown[]) => void): void {
          const wrapper = (...args: unknown[]) => {
            cb(...args);
            node.off(event, wrapper);
          };
          node.on(event, wrapper);
        },
        emit(event: string, ...args: unknown[]): void {
          const arr = listeners[event];
          if (!arr) return;
          [...arr].forEach((fn) => fn(...args));
        },
        destroy: jest.fn(),
        getComponent: jest.fn(() => ({
          play: () =>
            new Promise<void>((resolve) => {
              node.once("finished", () => {
                node.destroy();
                resolve();
              });
            }),
        })),
        getComponentInChildren: jest.fn(() => null),
        setPosition: jest.fn(),
      };
      nodes.push(node);
      return node as unknown as cc.Node;
    });
    return nodes;
  }

  it("waits for bomb explosion before falling", async () => {
    const nodes = mockVfx();
    FXController.setPrefab(TileKind.SuperBomb, {} as unknown as cc.Prefab);

    const board = new Board(cfg, [
      [TileFactory.createNormal("red")],
      [TileFactory.createNormal("red")],
    ]);
    board.tileAt(new cc.Vec2(0, 1))!.kind = TileKind.SuperBomb;
    const bus = new InfrastructureEventBus();
    const executor = new MoveExecutor(board, bus);
    let removeTime = 0;
    let fallTime = 0;
    bus.on(EventNames.RemoveStarted, () => {
      removeTime = Date.now();
    });
    bus.on(EventNames.FallStarted, () => {
      fallTime = Date.now();
    });

    const promise = executor.execute([new cc.Vec2(0, 1)]);

    expect(fallTime).toBe(0);

    nodes[0].emit("finished");
    await promise;

    expect(fallTime).not.toBe(0);
    expect(fallTime).toBeGreaterThanOrEqual(removeTime);
    expect(nodes[0].destroy).toHaveBeenCalled();
  });

  it("waits for the longest VFX when multiple supers trigger", async () => {
    const nodes = mockVfx();
    FXController.setPrefab(TileKind.SuperBomb, {} as unknown as cc.Prefab);
    FXController.setPrefab(TileKind.SuperRow, {} as unknown as cc.Prefab);

    const board = new Board(cfg, [
      [TileFactory.createNormal("red")],
      [TileFactory.createNormal("red")],
    ]);
    board.tileAt(new cc.Vec2(0, 1))!.kind = TileKind.SuperBomb;
    board.tileAt(new cc.Vec2(0, 0))!.kind = TileKind.SuperRow;
    const bus = new InfrastructureEventBus();
    const executor = new MoveExecutor(board, bus);
    let removeTime = 0;
    let fallTime = 0;
    bus.on(EventNames.RemoveStarted, () => {
      removeTime = Date.now();
    });
    bus.on(EventNames.FallStarted, () => {
      fallTime = Date.now();
    });

    const promise = executor.execute([new cc.Vec2(0, 1), new cc.Vec2(0, 0)]);

    nodes[0].emit("finished");
    await Promise.resolve();
    expect(fallTime).toBe(0);

    nodes[1].emit("finished");
    await promise;

    expect(fallTime).not.toBe(0);
    expect(fallTime).toBeGreaterThanOrEqual(removeTime);
    expect(nodes[0].destroy).toHaveBeenCalled();
    expect(nodes[1].destroy).toHaveBeenCalled();
  });
});
