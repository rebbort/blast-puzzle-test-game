import { EventBus } from "../../assets/scripts/infrastructure/EventBus";

import { Board } from "../../assets/scripts/core/board/Board";
import { TileFactory } from "../../assets/scripts/core/board/Tile";
import { TeleportBooster } from "../../assets/scripts/core/boosters/TeleportBooster";
import { BoardConfig } from "../../assets/scripts/config/ConfigLoader";
import { EventNames } from "../../assets/scripts/core/events/EventNames";

describe("TeleportBooster", () => {
  const bus = new EventBus();
  const emitSpy = jest.spyOn(bus, "emit");

  beforeEach(() => {
    emitSpy.mockClear();
    bus.clear();
  });

  const cfg2x2: BoardConfig = {
    cols: 2,
    rows: 2,
    tileWidth: 1,
    tileHeight: 1,
    colors: ["red", "blue"],
    superThreshold: 3,
  };

  it("consumes charge when swap creates moves", async () => {
    const board = new Board(cfg2x2, [
      [TileFactory.createNormal("red"), TileFactory.createNormal("blue")],
      [TileFactory.createNormal("blue"), TileFactory.createNormal("red")],
    ]);
    const booster = new TeleportBooster(board, bus, 1);
    const seq: string[] = [];
    bus.on(EventNames.SwapDone, () => seq.push(EventNames.SwapDone));
    bus.on(EventNames.BoosterConsumed, () =>
      seq.push(EventNames.BoosterConsumed),
    );

    booster.start();
    bus.emit(EventNames.GroupSelected, new cc.Vec2(1, 0));
    bus.emit(EventNames.GroupSelected, new cc.Vec2(1, 1));
    await new Promise((r) => setImmediate(r));

    expect(booster.charges).toBe(0);
    expect(seq).toEqual([EventNames.SwapDone, EventNames.BoosterConsumed]);
    expect(board.colorAt(new cc.Vec2(1, 0))).toBe("red");
    expect(board.colorAt(new cc.Vec2(1, 1))).toBe("blue");
  });

  it("does not consume charge when no moves after swap", async () => {
    const cfg: BoardConfig = {
      cols: 2,
      rows: 1,
      tileWidth: 1,
      tileHeight: 1,
      colors: ["red", "blue"],
      superThreshold: 3,
    };
    const board = new Board(cfg, [
      [TileFactory.createNormal("red"), TileFactory.createNormal("blue")],
    ]);
    const booster = new TeleportBooster(board, bus, 1);
    const events: string[] = [];
    bus.on(EventNames.SwapCancelled, () =>
      events.push(EventNames.SwapCancelled),
    );

    booster.start();
    bus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));
    bus.emit(EventNames.GroupSelected, new cc.Vec2(1, 0));
    await new Promise((r) => setImmediate(r));

    expect(booster.charges).toBe(1);
    expect(events).toEqual([EventNames.SwapCancelled]);
    expect(board.colorAt(new cc.Vec2(0, 0))).toBe("red");
    expect(board.colorAt(new cc.Vec2(1, 0))).toBe("blue");
  });
});
