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

// Swap происходит и заряд тратится, если после обмена есть ходы
it("consumes charge on successful swap", async () => {
  const bus = new InfrastructureEventBus();
  const emitSpy = jest.spyOn(bus, "emit");
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
  expect(emitSpy).toHaveBeenCalledWith(EventNames.BoosterConsumed, "teleport");
  expect(board.colorAt(new cc.Vec2(1, 0))).toBe("red");
  expect(board.colorAt(new cc.Vec2(1, 1))).toBe("blue");
});

// Когда после обмена нет ходов, заряд не тратится, а событие SwapCancelled
// уведомляет о возврате
it("cancels swap when no moves available", async () => {
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
  bus.on(EventNames.SwapCancelled, () => events.push(EventNames.SwapCancelled));

  booster.start();
  bus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));
  bus.emit(EventNames.GroupSelected, new cc.Vec2(1, 0));
  await new Promise((r) => setImmediate(r));

  expect(booster.charges).toBe(1);
  expect(events).toEqual([EventNames.SwapCancelled]);
  expect(board.colorAt(new cc.Vec2(0, 0))).toBe("red");
  expect(board.colorAt(new cc.Vec2(1, 0))).toBe("blue");
});
