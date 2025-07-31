import GameBoardController from "../assets/scripts/ui/controllers/GameBoardController";
import TileView from "../assets/scripts/ui/views/TileView";
import { Board } from "../assets/scripts/core/board/Board";
import { TileFactory, TileKind } from "../assets/scripts/core/board/Tile";
import { BoardConfig } from "../assets/scripts/config/ConfigLoader";

describe("GameBoardController", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };
  const cfg: BoardConfig = {
    cols: 2,
    rows: 2,
    tileWidth: 1,
    tileHeight: 1,
    colors: ["red", "blue"],
    superThreshold: 3,
  };

  const tiles = [
    [
      TileFactory.createNormal("red"),
      Object.assign(TileFactory.createNormal("blue"), {
        kind: TileKind.SuperBomb,
      }),
    ],
    [
      TileFactory.createNormal("green"),
      Object.assign(TileFactory.createNormal("yellow"), {
        kind: TileKind.SuperClear,
      }),
    ],
  ];
  const board = new Board(cfg, tiles);

  test("spawnAllTiles uses correct prefabs", () => {
    const controller = new GameBoardController();
    controller["board"] = board;
    controller.tilesLayer = new cc.Node() as unknown as cc.Node;

    // assign base prefab
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controller.tileNodePrefab = new (cc.Prefab as any)("TileNode", TileView);

    const applySpy = jest.spyOn(TileView.prototype, "apply");

    (controller as unknown as { spawnAllTiles(): void }).spawnAllTiles();

    expect(applySpy).toHaveBeenCalledTimes(4);
    const views = (controller as unknown as { tileViews: TileView[][] })
      .tileViews;
    views.flat().forEach((v) => expect(v.node.name).toBe("TileNode"));
  });
});
