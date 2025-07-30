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
    tileSize: 1,
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

    // assign prefabs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controller.tileRedPrefab = new (cc.Prefab as any)("TileRed", TileView);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controller.tileBluePrefab = new (cc.Prefab as any)("TileBlue", TileView);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controller.tileGreenPrefab = new (cc.Prefab as any)("TileGreen", TileView);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controller.tileYellowPrefab = new (cc.Prefab as any)(
      "TileYellow",
      TileView,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controller.tilePurplePrefab = new (cc.Prefab as any)(
      "TilePurple",
      TileView,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controller.boosterRowPrefab = new (cc.Prefab as any)("TileRow", TileView);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controller.boosterColPrefab = new (cc.Prefab as any)("TileCol", TileView);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controller.boosterBombPrefab = new (cc.Prefab as any)("TileBomb", TileView);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controller.boosterClearPrefab = new (cc.Prefab as any)(
      "TileClear",
      TileView,
    );

    controller["initPrefabMap"]();

    const applySpy = jest.spyOn(TileView.prototype, "apply");

    (controller as unknown as { spawnAllTiles(): void }).spawnAllTiles();

    expect(applySpy).toHaveBeenCalledTimes(4);
    const views = (controller as unknown as { tileViews: TileView[][] })
      .tileViews;
    expect(views[0][0].node.name).toBe("TileRed");
    expect(views[0][1].node.name).toBe("TileBomb");
    expect(views[1][0].node.name).toBe("TileGreen");
    expect(views[1][1].node.name).toBe("TileClear");
  });
});
