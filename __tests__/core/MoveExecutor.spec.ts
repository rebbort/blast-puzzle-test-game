import { Vec2 } from "cc";
import { EventEmitter2 } from "eventemitter2";

const bus = new EventEmitter2();
const emitSpy = jest.spyOn(bus, "emit");

jest.mock("../../assets/scripts/core/EventBus", () => ({ EventBus: bus }));

import { Board } from "../../assets/scripts/core/board/Board";
import { TileFactory } from "../../assets/scripts/core/board/Tile";
import { MoveExecutor } from "../../assets/scripts/core/board/MoveExecutor";
import { BoardConfig } from "../../assets/scripts/config/BoardConfig";

const cfg: BoardConfig = {
  cols: 2,
  rows: 2,
  tileSize: 1,
  colors: ["red"],
  superThreshold: 3,
};

beforeEach(() => {
  emitSpy.mockClear();
  bus.removeAllListeners();
});

// normal case: commands executed and events emitted in order
it("executes remove, fall and fill then emits MoveCompleted", async () => {
  const board = new Board(cfg, [
    [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
    [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
  ]);
  const executor = new MoveExecutor(board, bus);
  const sequence: string[] = [];
  bus.on("removeDone", () => sequence.push("removeDone"));
  bus.on("fallDone", () => sequence.push("fallDone"));
  bus.on("fillDone", () => sequence.push("fillDone"));
  bus.on("MoveCompleted", () => sequence.push("MoveCompleted"));

  await executor.execute([new Vec2(0, 0), new Vec2(1, 0)]);

  expect(sequence).toEqual([
    "removeDone",
    "fallDone",
    "fillDone",
    "MoveCompleted",
  ]);
});

// boundary: coordinates outside board are ignored but flow still completes
it("ignores out of bounds tiles in group", async () => {
  const board = new Board(cfg, [
    [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
    [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
  ]);
  const executor = new MoveExecutor(board, bus);
  await executor.execute([new Vec2(0, 0), new Vec2(5, 5)]);
  expect(emitSpy).toHaveBeenLastCalledWith("MoveCompleted");
});

// error case: empty group should reject
it("throws when group is empty", async () => {
  const board = new Board(cfg);
  const executor = new MoveExecutor(board, bus);
  await expect(executor.execute([])).rejects.toThrow();
});
