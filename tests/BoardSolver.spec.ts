import { Board } from "../assets/scripts/core/board/Board";
import { TileFactory } from "../assets/scripts/core/board/Tile";
import { BoardSolver } from "../assets/scripts/core/board/BoardSolver";
import { BoardConfig } from "../assets/scripts/config/ConfigLoader";

const cfg: BoardConfig = {
  cols: 3,
  rows: 3,
  tileWidth: 1,
  tileHeight: 1,
  colors: ["red", "blue", "green"],
  superThreshold: 3,
};

function createCrossBoard(): Board {
  const tiles = [
    [
      TileFactory.createNormal("red"),
      TileFactory.createNormal("blue"),
      TileFactory.createNormal("red"),
    ],
    [
      TileFactory.createNormal("blue"),
      TileFactory.createNormal("blue"),
      TileFactory.createNormal("blue"),
    ],
    [
      TileFactory.createNormal("red"),
      TileFactory.createNormal("blue"),
      TileFactory.createNormal("red"),
    ],
  ];
  return new Board(cfg, tiles);
}

describe("BoardSolver.findGroup", () => {
  test("returns connected same-color tiles for center", () => {
    const board = createCrossBoard();
    const solver = new BoardSolver(board);
    const group = solver.findGroup(new cc.Vec2(1, 1));
    const coords = group.map((p) => [p.x, p.y]);
    expect(coords).toHaveLength(5);
    expect(coords).toEqual(
      expect.arrayContaining([
        [1, 1],
        [1, 0],
        [0, 1],
        [2, 1],
        [1, 2],
      ]),
    );
  });

  test("returns empty array when start is out of bounds", () => {
    const board = createCrossBoard();
    const solver = new BoardSolver(board);
    const group = solver.findGroup(new cc.Vec2(-1, -1));
    expect(group).toEqual([]);
  });
});
