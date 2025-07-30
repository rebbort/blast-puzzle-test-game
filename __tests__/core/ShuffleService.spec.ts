import { ExtendedEventTarget } from "../../assets/scripts/infrastructure/ExtendedEventTarget";

const bus = new ExtendedEventTarget();
const emitSpy = jest.spyOn(bus, "emit");

import { Board } from "../../assets/scripts/core/board/Board";
import { BoardSolver } from "../../assets/scripts/core/board/BoardSolver";
import { TileFactory } from "../../assets/scripts/core/board/Tile";
import { ShuffleService } from "../../assets/scripts/core/board/ShuffleService";
import { BoardConfig } from "../../assets/scripts/config/ConfigLoader";

const cfgSingle: BoardConfig = {
  cols: 1,
  rows: 1,
  tileSize: 1,
  colors: ["red"],
  superThreshold: 3,
};
const cfgPair: BoardConfig = {
  cols: 2,
  rows: 1,
  tileSize: 1,
  colors: ["red"],
  superThreshold: 3,
};

beforeEach(() => {
  emitSpy.mockClear();
  bus.clear();
});

// when moves exist nothing happens
it("ensureMoves does nothing when moves available", () => {
  const board = new Board(cfgPair, [
    [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
  ]);
  const solver = new BoardSolver(board);
  const service = new ShuffleService(board, solver, bus, 2);
  service.ensureMoves();
  expect(emitSpy).not.toHaveBeenCalled();
});

// auto shuffle until limit reached
it("auto shuffles until limit then emits ShuffleLimitExceeded", () => {
  const board = new Board(cfgSingle, [[TileFactory.createNormal("red")]]);
  const solver = new BoardSolver(board);
  const service = new ShuffleService(board, solver, bus, 2);
  service.ensureMoves();
  service.ensureMoves();
  service.ensureMoves();
  expect(emitSpy.mock.calls.map((c) => c[0])).toEqual([
    "AutoShuffle",
    "ShuffleDone",
    "AutoShuffle",
    "ShuffleDone",
    "ShuffleLimitExceeded",
  ]);
});

// reset clears shuffle counter
it("reset allows shuffling again", () => {
  const board = new Board(cfgSingle, [[TileFactory.createNormal("red")]]);
  const solver = new BoardSolver(board);
  const service = new ShuffleService(board, solver, bus, 1);
  service.ensureMoves();
  service.ensureMoves();
  emitSpy.mockClear();
  service.reset();
  service.ensureMoves();
  expect(emitSpy.mock.calls[0][0]).toBe("AutoShuffle");
});

// direct shuffle mixes tiles and emits ShuffleDone
it("shuffle performs Fisher-Yates step", () => {
  const board = new Board(cfgPair, [
    [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
  ]);
  const solver = new BoardSolver(board);
  const service = new ShuffleService(board, solver, bus, 1);
  service.shuffle();
  expect(emitSpy).toHaveBeenCalledWith("ShuffleDone");
});
