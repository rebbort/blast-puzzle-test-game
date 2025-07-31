import { ExtendedEventTarget } from "../../assets/scripts/infrastructure/ExtendedEventTarget";

const bus = new ExtendedEventTarget();
const emitSpy = jest.spyOn(bus, "emit");

import { Board } from "../../assets/scripts/core/board/Board";
import { TileFactory, TileKind } from "../../assets/scripts/core/board/Tile";
import { MoveExecutor } from "../../assets/scripts/core/board/MoveExecutor";
import { BoardConfig } from "../../assets/scripts/config/ConfigLoader";
import { EventNames } from "../../assets/scripts/core/events/EventNames";

const cfg: BoardConfig = {
  cols: 2,
  rows: 2,
  tileWidth: 1,
  tileHeight: 1,
  colors: ["red"],
  superThreshold: 3,
};

beforeEach(() => {
  emitSpy.mockClear();
  bus.clear();
});

// normal case: commands executed and events emitted in order
it("executes remove, fall and fill then emits MoveCompleted", async () => {
  const board = new Board(cfg, [
    [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
    [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
  ]);
  const executor = new MoveExecutor(board, bus);
  const sequence: string[] = [];
  bus.on(EventNames.TilesRemoved, () => sequence.push(EventNames.TilesRemoved));
  bus.on(EventNames.FallDone, () => sequence.push(EventNames.FallDone));
  bus.on(EventNames.FillDone, () => sequence.push(EventNames.FillDone));
  bus.on(EventNames.MoveCompleted, () =>
    sequence.push(EventNames.MoveCompleted),
  );

  await executor.execute([new cc.Vec2(0, 0), new cc.Vec2(1, 0)]);

  expect(sequence).toEqual([
    EventNames.TilesRemoved,
    EventNames.FallDone,
    EventNames.FillDone,
    EventNames.MoveCompleted,
  ]);
});

// boundary: coordinates outside board are ignored but flow still completes
it("ignores out of bounds tiles in group", async () => {
  const board = new Board(cfg, [
    [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
    [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
  ]);
  const executor = new MoveExecutor(board, bus);
  await executor.execute([new cc.Vec2(0, 0), new cc.Vec2(5, 5)]);
  expect(emitSpy).toHaveBeenLastCalledWith(EventNames.MoveCompleted);
});

// error case: empty group should reject
it("throws when group is empty", async () => {
  const board = new Board(cfg);
  const executor = new MoveExecutor(board, bus);
  await expect(executor.execute([])).rejects.toThrow();
});

// spawning a super tile when threshold reached
it("creates super tile in click cell when group large enough", async () => {
  const board = new Board(cfg, [
    [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
    [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
  ]);
  const executor = new MoveExecutor(board, bus);
  const group = [new cc.Vec2(0, 0), new cc.Vec2(1, 0), new cc.Vec2(0, 1)];
  await executor.execute(group);
  const tile = board.tileAt(new cc.Vec2(0, 1));
  expect(tile?.kind).not.toBe(TileKind.Normal);
});
