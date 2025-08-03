import { Board } from "../../../assets/scripts/core/board/Board";
import { TileFactory, TileKind } from "../../../assets/scripts/core/board/Tile";
import { BoardSolver } from "../../../assets/scripts/core/board/BoardSolver";
import { BoardConfig } from "../../../assets/scripts/config/ConfigLoader";

const cfg: BoardConfig = {
  cols: 5,
  rows: 5,
  tileWidth: 1,
  tileHeight: 1,
  colors: ["red", "blue"],
  superThreshold: 3,
};

// Проверяем расширение групп для всех типов супер‑тайлов
it("expandGroupForSuper handles all kinds", () => {
  const board = new Board(cfg);
  const solver = new BoardSolver(board);

  const rowTile = TileFactory.createNormal("red");
  rowTile.kind = TileKind.SuperRow;
  const rowRes = solver.expandGroupForSuper(rowTile, new cc.Vec2(2, 0));
  expect(rowRes).toHaveLength(cfg.cols);
  expect(rowRes).toEqual(
    Array.from({ length: cfg.cols }, (_, x) => new cc.Vec2(x, 0)),
  );

  const colTile = TileFactory.createNormal("red");
  colTile.kind = TileKind.SuperCol;
  expect(solver.expandGroupForSuper(colTile, new cc.Vec2(4, 1))).toEqual(
    Array.from({ length: cfg.rows }, (_, y) => new cc.Vec2(4, y)),
  );

  const bombTile = TileFactory.createNormal("red");
  bombTile.kind = TileKind.SuperBomb;
  const bombRes = solver.expandGroupForSuper(bombTile, new cc.Vec2(2, 2));
  expect(bombRes).toHaveLength(9);
  expect(bombRes).toEqual(
    expect.arrayContaining([
      new cc.Vec2(2, 2),
      new cc.Vec2(1, 2),
      new cc.Vec2(3, 2),
      new cc.Vec2(2, 1),
      new cc.Vec2(2, 3),
      new cc.Vec2(1, 1),
      new cc.Vec2(1, 3),
      new cc.Vec2(3, 1),
      new cc.Vec2(3, 3),
    ]),
  );

  const clearTile = TileFactory.createNormal("red");
  clearTile.kind = TileKind.SuperClear;
  expect(solver.expandGroupForSuper(clearTile, new cc.Vec2(0, 0))).toHaveLength(
    cfg.cols * cfg.rows,
  );
});
