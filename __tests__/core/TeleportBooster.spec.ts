import { InfrastructureEventBus } from "../../assets/scripts/infrastructure/InfrastructureEventBus";

import { Board } from "../../assets/scripts/core/board/Board";
import { TileFactory } from "../../assets/scripts/core/board/Tile";
import { TeleportBooster } from "../../assets/scripts/core/boosters/TeleportBooster";
import { BoardConfig } from "../../assets/scripts/config/ConfigLoader";
import { EventNames } from "../../assets/scripts/core/events/EventNames";

describe("TeleportBooster", () => {
  const bus = new InfrastructureEventBus();
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

  it("swaps tiles and consumes charge", async () => {
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

  it("still swaps even when no moves remain", async () => {
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
    bus.on(EventNames.BoosterConsumed, () =>
      events.push(EventNames.BoosterConsumed),
    );

    booster.start();
    bus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));
    bus.emit(EventNames.GroupSelected, new cc.Vec2(1, 0));
    await new Promise((r) => setImmediate(r));

    expect(booster.charges).toBe(0);
    expect(events).toEqual([EventNames.BoosterConsumed]);
    expect(board.colorAt(new cc.Vec2(0, 0))).toBe("blue");
    expect(board.colorAt(new cc.Vec2(1, 0))).toBe("red");
  });

  it("cancels when same tile tapped twice", () => {
    const board = new Board(cfg2x2, [
      [TileFactory.createNormal("red"), TileFactory.createNormal("blue")],
      [TileFactory.createNormal("blue"), TileFactory.createNormal("red")],
    ]);
    const booster = new TeleportBooster(board, bus, 1);

    booster.start();
    bus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));
    bus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));

    expect(booster.charges).toBe(1);
    expect(emitSpy).toHaveBeenCalledWith(EventNames.BoosterCancelled);
  });

  it("cancels when tapping outside before second tile", () => {
    const board = new Board(cfg2x2, [
      [TileFactory.createNormal("red"), TileFactory.createNormal("blue")],
      [TileFactory.createNormal("blue"), TileFactory.createNormal("red")],
    ]);
    const booster = new TeleportBooster(board, bus, 1);

    booster.start();
    bus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));
    bus.emit(EventNames.InvalidTap, new cc.Vec2(-1, -1));

    expect(booster.charges).toBe(1);
    expect(emitSpy).toHaveBeenCalledWith(EventNames.BoosterCancelled);
  });

  it("does nothing after external cancellation", () => {
    const board = new Board(cfg2x2, [
      [TileFactory.createNormal("red"), TileFactory.createNormal("blue")],
      [TileFactory.createNormal("blue"), TileFactory.createNormal("red")],
    ]);
    const booster = new TeleportBooster(board, bus, 1);

    booster.start();
    bus.emit(EventNames.BoosterCancelled);
    bus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));

    expect(booster.charges).toBe(1);
    expect(bus.getListenerCount(EventNames.GroupSelected)).toBe(0);
  });

  it("ignores activation with zero charges", () => {
    const board = new Board(cfg2x2, [
      [TileFactory.createNormal("red"), TileFactory.createNormal("blue")],
      [TileFactory.createNormal("blue"), TileFactory.createNormal("red")],
    ]);
    const booster = new TeleportBooster(board, bus, 0);

    booster.start();
    bus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));

    expect(emitSpy).toHaveBeenCalledWith(EventNames.BoosterCancelled);
    expect(board.colorAt(new cc.Vec2(0, 0))).toBe("red");
    expect(booster.charges).toBe(0);
  });
});
