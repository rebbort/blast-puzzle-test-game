import GameBoardController from "../assets/scripts/ui/controllers/GameBoardController";
import MoveFlowController from "../assets/scripts/ui/controllers/MoveFlowController";
import FillController from "../assets/scripts/ui/controllers/FillController";
import TileView from "../assets/scripts/ui/views/TileView";
import { Board } from "../assets/scripts/core/board/Board";
import { TileFactory } from "../assets/scripts/core/board/Tile";
import { BoardConfig } from "../assets/scripts/config/ConfigLoader";
import { MoveExecutor } from "../assets/scripts/core/board/MoveExecutor";
import { EventBus } from "../assets/scripts/core/EventBus";

/* eslint-disable @typescript-eslint/no-explicit-any */

// stubs for action helpers used in controllers
beforeEach(() => {
  // stub localStorage expected by config loader
  (globalThis as any).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };
  EventBus.clear();
  (cc.Node as any).prototype.runAction = function run(action: any) {
    if (!action) return;
    if (action.type === "moveTo") {
      this.setPosition(action.x, action.y);
    } else if (action.type === "sequence" || action.type === "spawn") {
      action.acts.forEach((a: any) => run.call(this, a));
    } else if (action.type === "callFunc") {
      action.fn();
    } else if (action.type === "delayTime") {
      /* no-op for tests */
    }
  };
  (cc as any).moveTo = (d: number, x: any, y?: number) => {
    if (x instanceof cc.Vec2) return { type: "moveTo", x: x.x, y: x.y, d };
    return { type: "moveTo", x, y, d };
  };
  (cc as any).fadeOut = () => ({ type: "fadeOut" });
  (cc as any).scaleTo = () => ({ type: "scaleTo" });
  (cc as any).delayTime = (d: number) => ({ type: "delayTime", d });
  (cc as any).tween = (target: any) => {
    const chain = {
      delay() {
        return this;
      },
      to(_d: number, props: any) {
        if (props.position) {
          target.position = props.position;
        }
        if (props.scale) {
          target.scale = props.scale;
        }
        return this;
      },
      call(fn: () => void) {
        fn();
        return this;
      },
      start() {
        return this;
      },
    } as any;
    return chain;
  };
  (cc as any).spawn = (...acts: any[]) => ({ type: "spawn", acts });
  (cc as any).sequence = (...acts: any[]) => ({ type: "sequence", acts });
  (cc as any).callFunc = (fn: () => void) => ({ type: "callFunc", fn });
  (cc.Node as any).prototype.destroy = function () {
    this.destroyed = true;
  };
});

describe("Move flow integration", () => {
  const cfg: BoardConfig = {
    cols: 2,
    rows: 3,
    tileWidth: 1,
    tileHeight: 1,
    colors: ["red"],
    superThreshold: 3,
  };

  test("views fall and fill after a move", async () => {
    const tiles = [
      [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
      [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
      [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
    ];
    const board = new Board(cfg, tiles);

    const root = new cc.Node();
    const layer = new cc.Node();
    layer.name = "TilesLayer";
    (root as any).children.push(layer);
    (root as any).getChildByName = (n: string) =>
      n === "TilesLayer" ? layer : null;

    const boardCtrl = root.addComponent(GameBoardController);
    (boardCtrl as any).board = board;
    boardCtrl.tilesLayer = layer;
    const prefab = new (cc.Prefab as any)("TileNode", TileView);
    boardCtrl.tileNodePrefab = prefab;
    (boardCtrl as any).spawnAllTiles();

    const original = boardCtrl.tileViews.map((r) => r.slice());
    const removedA = original[2][0];
    const removedB = original[2][1];

    const flow = root.addComponent(MoveFlowController);
    flow.tilesLayer = layer;
    (flow as any).onLoad();

    const fill = root.addComponent(FillController);
    fill.tileNodePrefab = prefab;
    (fill as any).getComponent = (Ctor: unknown) =>
      root.getComponent(Ctor as any);
    (fill as any).onLoad();

    const executor = new MoveExecutor(board, EventBus);
    await executor.execute([new cc.Vec2(0, 2), new cc.Vec2(1, 2)]);

    const views = boardCtrl.tileViews;
    expect(views[1][0]).toBe(original[0][0]);
    expect(views[1][1]).toBe(original[0][1]);
    expect(views[2][0]).toBe(original[1][0]);
    expect(views[2][1]).toBe(original[1][1]);

    const pos = (boardCtrl as any).computePos.bind(boardCtrl);
    expect(views[1][0].node.position.y).toBe(pos(0, 1).y);
    expect(views[2][0].node.position.y).toBe(pos(0, 2).y);

    expect(views.flat().filter(Boolean).length).toBe(cfg.cols * cfg.rows);
    expect((removedA.node as any).destroyed).toBe(true);
    expect((removedB.node as any).destroyed).toBe(true);
  });

  test("matrix stays complete after two sequential moves", async () => {
    const tiles = [
      [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
      [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
      [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
    ];
    const board = new Board(cfg, tiles);

    const root = new cc.Node();
    const layer = new cc.Node();
    layer.name = "TilesLayer";
    (root as any).children.push(layer);
    (root as any).getChildByName = (n: string) =>
      n === "TilesLayer" ? layer : null;

    const boardCtrl = root.addComponent(GameBoardController);
    (boardCtrl as any).board = board;
    boardCtrl.tilesLayer = layer;
    const prefab = new (cc.Prefab as any)("TileNode", TileView);
    boardCtrl.tileNodePrefab = prefab;
    (boardCtrl as any).spawnAllTiles();

    const flow = root.addComponent(MoveFlowController);
    flow.tilesLayer = layer;
    (flow as any).onLoad();

    const fill = root.addComponent(FillController);
    fill.tileNodePrefab = prefab;
    (fill as any).getComponent = (Ctor: unknown) =>
      root.getComponent(Ctor as any);
    (fill as any).onLoad();

    const executor = new MoveExecutor(board, EventBus);
    // First move removes bottom row
    await executor.execute([new cc.Vec2(0, 2), new cc.Vec2(1, 2)]);

    const firstBottomA = boardCtrl.tileViews[2][0];
    const firstBottomB = boardCtrl.tileViews[2][1];

    // Second move removes the new bottom row
    await executor.execute([new cc.Vec2(0, 2), new cc.Vec2(1, 2)]);

    const views = boardCtrl.tileViews;
    expect(views.flat().filter(Boolean).length).toBe(cfg.cols * cfg.rows);
    views.forEach((row) => row.forEach((v) => expect(v).toBeDefined()));
    expect((firstBottomA.node as any).destroyed).toBe(true);
    expect((firstBottomB.node as any).destroyed).toBe(true);
  });
});
