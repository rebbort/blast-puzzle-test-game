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
  (cc.Node as any).prototype.runAction = function (action: any) {
    if (action && action.type === "moveTo") {
      this.setPosition(action.x, action.y);
    }
  };
  (cc as any).moveTo = (d: number, x: any, y?: number) => {
    if (x instanceof cc.Vec2) return { type: "moveTo", x: x.x, y: x.y, d };
    return { type: "moveTo", x, y, d };
  };
  (cc as any).fadeOut = () => ({ type: "fadeOut" });
  (cc as any).scaleTo = () => ({ type: "scaleTo" });
  (cc as any).spawn = (...acts: any[]) => ({ type: "spawn", acts });
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
    const prefab = new (cc.Prefab as any)("Tile", TileView);
    boardCtrl.tileRedPrefab = prefab;
    boardCtrl.tileBluePrefab = prefab;
    boardCtrl.tileGreenPrefab = prefab;
    boardCtrl.tileYellowPrefab = prefab;
    boardCtrl.tilePurplePrefab = prefab;
    boardCtrl.boosterRowPrefab = prefab;
    boardCtrl.boosterColPrefab = prefab;
    boardCtrl.boosterBombPrefab = prefab;
    boardCtrl.boosterClearPrefab = prefab;
    boardCtrl["initPrefabMap"]();
    (boardCtrl as any).spawnAllTiles();

    const original = boardCtrl.tileViews.map((r) => r.slice());

    const flow = root.addComponent(MoveFlowController);
    flow.tilesLayer = layer;
    (flow as any).onLoad();

    const fill = root.addComponent(FillController);
    fill.tilePrefab = prefab;
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
  });
});
