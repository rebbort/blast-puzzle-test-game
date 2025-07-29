import { Vec2 } from "cc";
import { EventEmitter2 } from "eventemitter2";

// Create a mock event bus preserving emit functionality
const bus = new EventEmitter2();
const emitSpy = jest.spyOn(bus, "emit");

jest.mock("../../assets/scripts/core/EventBus", () => ({
  EventBus: bus,
}));

import { Board } from "../../assets/scripts/core/board/Board";
import { TileFactory } from "../../assets/scripts/core/board/Tile";
import { BoardSolver } from "../../assets/scripts/core/board/BoardSolver";
import { BoardConfig } from "../../assets/scripts/config/BoardConfig";

// Common 3x3 config for tests
const cfg: BoardConfig = {
  cols: 3,
  rows: 3,
  tileSize: 1,
  colors: ["red", "blue"],
  superThreshold: 3,
};

function crossBoard(): Board {
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

beforeEach(() => {
  emitSpy.mockClear();
  bus.removeAllListeners();
});

// group of 5 tiles should be returned and event emitted
it("findGroup emits GroupFound with connected tiles", () => {
  const solver = new BoardSolver(crossBoard());
  const res = solver.findGroup(new Vec2(1, 1));
  expect(res).toHaveLength(5);
  expect(emitSpy).toHaveBeenCalledWith("GroupFound", res);
});

// starting outside board returns empty without emitting
it("findGroup on out of bounds returns empty", () => {
  const solver = new BoardSolver(crossBoard());
  const res = solver.findGroup(new Vec2(-1, -1));
  expect(res).toEqual([]);
  expect(emitSpy).not.toHaveBeenCalled();
});

// board with no adjacent colors should report no moves
it("hasMoves detects absence of moves", () => {
  const board = new Board(cfg, [
    [
      TileFactory.createNormal("red"),
      TileFactory.createNormal("blue"),
      TileFactory.createNormal("red"),
    ],
    [
      TileFactory.createNormal("blue"),
      TileFactory.createNormal("red"),
      TileFactory.createNormal("blue"),
    ],
    [
      TileFactory.createNormal("red"),
      TileFactory.createNormal("blue"),
      TileFactory.createNormal("red"),
    ],
  ]);
  const solver = new BoardSolver(board);
  expect(solver.hasMoves()).toBe(false);
});

// starting on empty cell should return empty
it("returns empty when start cell has no tile", () => {
  const board = crossBoard();
  board.setTile(new Vec2(1, 1), null);
  const solver = new BoardSolver(board);
  const res = solver.findGroup(new Vec2(1, 1));
  expect(res).toEqual([]);
});

// hasMoves positive case
it("hasMoves detects available move", () => {
  const board = crossBoard();
  const solver = new BoardSolver(board);
  expect(solver.hasMoves()).toBe(true);
});
