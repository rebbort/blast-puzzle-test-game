import { InfrastructureEventBus } from "../../assets/scripts/infrastructure/InfrastructureEventBus";

const bus = new InfrastructureEventBus();
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

// event: SuperTileCreated emitted with position and tile
it("emits SuperTileCreated when a super tile is spawned", async () => {
  const board = new Board(cfg, [
    [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
    [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
  ]);
  const executor = new MoveExecutor(board, bus);
  const group = [new cc.Vec2(0, 0), new cc.Vec2(1, 0), new cc.Vec2(0, 1)];
  await executor.execute(group);
  expect(emitSpy).toHaveBeenCalledWith(
    EventNames.SuperTileCreated,
    new cc.Vec2(0, 0),
    expect.objectContaining({ kind: expect.any(Number) }),
  );
});

// super tiles in the group should not spawn another one
it("skips super tile creation when group contains a super tile", async () => {
  const board = new Board(cfg, [
    [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
    [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
  ]);
  const boosterTile = board.tileAt(new cc.Vec2(1, 0))!;
  boosterTile.kind = TileKind.SuperRow;
  const executor = new MoveExecutor(board, bus);
  const group = [new cc.Vec2(1, 0), new cc.Vec2(0, 0), new cc.Vec2(0, 1)];
  await executor.execute(group);
  const calls = emitSpy.mock.calls.filter(
    (c) => c[0] === EventNames.SuperTileCreated,
  );
  expect(calls.length).toBe(0);
});

// fill command should create only removedCount - 1 slots when super tile appears
it("fills group size minus one slots when super tile spawns", async () => {
  const board = new Board(
    {
      ...cfg,
      rows: 3,
    },
    [
      [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
      [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
      [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
    ],
  );
  const executor = new MoveExecutor(board, bus);
  const group = [
    new cc.Vec2(0, 0),
    new cc.Vec2(1, 0),
    new cc.Vec2(0, 1),
    new cc.Vec2(1, 1),
    new cc.Vec2(0, 2),
  ];
  let slots: cc.Vec2[] = [];
  bus.once(EventNames.FillStarted, (s: cc.Vec2[]) => {
    slots = s;
  });
  await executor.execute(group);
  expect(slots).toHaveLength(group.length - 1);
});
