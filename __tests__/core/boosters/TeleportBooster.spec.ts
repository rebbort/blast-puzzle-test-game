import { EventTarget } from "../../../tests/cc";
jest.mock("../../../assets/scripts/infrastructure/EventBus", () => {
  return {
    EventBus: class MockBus extends EventTarget {
      once(event: string, cb: (...args: unknown[]) => void): void {
        const wrapper = (...args: unknown[]) => {
          this.off(event, wrapper);
          cb(...args);
        };
        this.on(event, wrapper);
      }
    },
  };
});

import { InfrastructureEventBus } from "../../../assets/scripts/infrastructure/InfrastructureEventBus";
import { Board } from "../../../assets/scripts/core/board/Board";
import { TileFactory } from "../../../assets/scripts/core/board/Tile";
import { TeleportBooster } from "../../../assets/scripts/core/boosters/TeleportBooster";
import { BoardConfig } from "../../../assets/scripts/config/ConfigLoader";
import { EventNames } from "../../../assets/scripts/core/events/EventNames";

const cfg2x2: BoardConfig = {
  cols: 2,
  rows: 2,
  tileWidth: 1,
  tileHeight: 1,
  colors: ["red", "blue"],
  superThreshold: 3,
};

// Swap выполняется всегда и заряд тратится
it("swaps tiles and consumes charge", async () => {
  const bus = new InfrastructureEventBus();
  const emitSpy = jest.spyOn(bus, "emit");
  const board = new Board(cfg2x2, [
    [TileFactory.createNormal("red"), TileFactory.createNormal("blue")],
    [TileFactory.createNormal("blue"), TileFactory.createNormal("red")],
  ]);
  const booster = new TeleportBooster(board, bus, 1);
  const seq: string[] = [];
  bus.on(EventNames.BoosterTargetSelected, ({ stage }) =>
    seq.push(`select-${stage}`),
  );
  bus.on(EventNames.SwapDone, () => seq.push(EventNames.SwapDone));
  bus.on(EventNames.BoosterConsumed, () =>
    seq.push(EventNames.BoosterConsumed),
  );

  booster.start();
  bus.emit(EventNames.GroupSelected, new cc.Vec2(1, 0));
  bus.emit(EventNames.GroupSelected, new cc.Vec2(1, 1));
  await new Promise((r) => setImmediate(r));

  expect(booster.charges).toBe(0);
  expect(seq).toEqual([
    "select-first",
    "select-second",
    EventNames.SwapDone,
    EventNames.BoosterConsumed,
  ]);
  expect(emitSpy).toHaveBeenCalledWith(EventNames.BoosterConsumed, "teleport");
  expect(board.colorAt(new cc.Vec2(1, 0))).toBe("red");
  expect(board.colorAt(new cc.Vec2(1, 1))).toBe("blue");
});

// Даже если после обмена нет возможных ходов, swap применяется
it("still swaps when no further moves", async () => {
  const bus = new InfrastructureEventBus();
  const board = new Board(
    {
      cols: 2,
      rows: 1,
      tileWidth: 1,
      tileHeight: 1,
      colors: ["red", "blue"],
      superThreshold: 3,
    },
    [[TileFactory.createNormal("red"), TileFactory.createNormal("blue")]],
  );
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

// Второй тап по тому же тайлу отменяет выбор
it("cancels when tapping the same tile twice", () => {
  const bus = new InfrastructureEventBus();
  const emitSpy = jest.spyOn(bus, "emit");
  const board = new Board(cfg2x2, [
    [TileFactory.createNormal("red"), TileFactory.createNormal("blue")],
    [TileFactory.createNormal("blue"), TileFactory.createNormal("red")],
  ]);
  const booster = new TeleportBooster(board, bus, 1);

  const seq: string[] = [];
  bus.on(EventNames.BoosterTargetSelected, ({ stage }) =>
    seq.push(`select-${stage}`),
  );
  bus.on(EventNames.BoosterCancelled, () =>
    seq.push(EventNames.BoosterCancelled),
  );

  booster.start();
  bus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));
  bus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));

  expect(booster.charges).toBe(1);
  expect(seq).toEqual(["select-first", EventNames.BoosterCancelled]);
  expect(emitSpy).toHaveBeenCalledWith(EventNames.BoosterCancelled);
});

// Тап вне поля до выбора второго тайла отменяет режим
it("cancels when tapping outside after first selection", () => {
  const bus = new InfrastructureEventBus();
  const emitSpy = jest.spyOn(bus, "emit");
  const board = new Board(cfg2x2, [
    [TileFactory.createNormal("red"), TileFactory.createNormal("blue")],
    [TileFactory.createNormal("blue"), TileFactory.createNormal("red")],
  ]);
  const booster = new TeleportBooster(board, bus, 1);

  const seq: string[] = [];
  bus.on(EventNames.BoosterTargetSelected, ({ stage }) =>
    seq.push(`select-${stage}`),
  );
  bus.on(EventNames.BoosterCancelled, () =>
    seq.push(EventNames.BoosterCancelled),
  );

  booster.start();
  bus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));
  bus.emit(EventNames.InvalidTap, new cc.Vec2(-1, -1));

  expect(booster.charges).toBe(1);
  expect(seq).toEqual(["select-first", EventNames.BoosterCancelled]);
  expect(emitSpy).toHaveBeenCalledWith(EventNames.BoosterCancelled);
});

// Попытка активации без зарядов ничего не делает
it("ignores activation with zero charges", () => {
  const bus = new InfrastructureEventBus();
  const emitSpy = jest.spyOn(bus, "emit");
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

// Повторные тапы после выбора второго тайла игнорируются
it("ignores extra taps while swap is in progress", async () => {
  const bus = new InfrastructureEventBus();
  const board = new Board(cfg2x2, [
    [TileFactory.createNormal("red"), TileFactory.createNormal("blue")],
    [TileFactory.createNormal("blue"), TileFactory.createNormal("red")],
  ]);
  const booster = new TeleportBooster(board, bus, 2);
  const seq: string[] = [];
  bus.on(EventNames.SwapDone, () => seq.push(EventNames.SwapDone));
  bus.on(EventNames.BoosterConsumed, () =>
    seq.push(EventNames.BoosterConsumed),
  );

  booster.start();
  bus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));
  bus.emit(EventNames.GroupSelected, new cc.Vec2(1, 0));
  // extra taps should be ignored until reactivation
  bus.emit(EventNames.GroupSelected, new cc.Vec2(0, 1));
  await new Promise((r) => setImmediate(r));

  expect(seq).toEqual([EventNames.SwapDone, EventNames.BoosterConsumed]);
  expect(booster.charges).toBe(1);
});
