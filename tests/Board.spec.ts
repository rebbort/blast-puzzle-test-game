import { Board } from "../assets/scripts/core/board/Board";
import { BoardConfig } from "../assets/scripts/config/ConfigLoader";

describe("Board", () => {
  const cfg: BoardConfig = {
    cols: 3,
    rows: 3,
    tileWidth: 1,
    tileHeight: 1,
    colors: ["red"],
    superThreshold: 3,
  };
  const board = new Board(cfg);

  test("inBounds works", () => {
    expect(board.inBounds(new cc.Vec2(0, 0))).toBe(true);
    expect(board.inBounds(new cc.Vec2(2, 2))).toBe(true);
    expect(board.inBounds(new cc.Vec2(3, 0))).toBe(false);
    expect(board.inBounds(new cc.Vec2(-1, 0))).toBe(false);
  });

  test("neighbors4 respects borders", () => {
    const center = board.neighbors4(new cc.Vec2(1, 1));
    expect(center).toEqual([
      new cc.Vec2(1, 0),
      new cc.Vec2(2, 1),
      new cc.Vec2(1, 2),
      new cc.Vec2(0, 1),
    ]);

    const corner = board.neighbors4(new cc.Vec2(0, 0));
    expect(corner).toEqual([new cc.Vec2(1, 0), new cc.Vec2(0, 1)]);
  });
});
