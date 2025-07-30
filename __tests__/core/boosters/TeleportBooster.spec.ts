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

import { ExtendedEventTarget } from "../../../assets/scripts/infrastructure/ExtendedEventTarget";
import { Board } from "../../../assets/scripts/core/board/Board";
import { TileFactory } from "../../../assets/scripts/core/board/Tile";
import { TeleportBooster } from "../../../assets/scripts/core/boosters/TeleportBooster";
import { BoardConfig } from "../../../assets/scripts/config/ConfigLoader";

const cfg2x2: BoardConfig = {
  cols: 2,
  rows: 2,
  tileSize: 1,
  colors: ["red", "blue"],
  superThreshold: 3,
};

// Swap происходит и заряд тратится, если после обмена есть ходы
it("consumes charge on successful swap", async () => {
  const bus = new ExtendedEventTarget();
  const emitSpy = jest.spyOn(bus, "emit");
  const board = new Board(cfg2x2, [
    [TileFactory.createNormal("red"), TileFactory.createNormal("blue")],
    [TileFactory.createNormal("blue"), TileFactory.createNormal("red")],
  ]);
  const booster = new TeleportBooster(board, bus, 1);
  const seq: string[] = [];
  bus.on("SwapDone", () => seq.push("SwapDone"));
  bus.on("BoosterConsumed", () => seq.push("BoosterConsumed"));

  booster.start();
  bus.emit("GroupSelected", new cc.Vec2(1, 0));
  bus.emit("GroupSelected", new cc.Vec2(1, 1));
  await new Promise((r) => setImmediate(r));

  expect(booster.charges).toBe(0);
  expect(seq).toEqual(["SwapDone", "BoosterConsumed"]);
  expect(emitSpy).toHaveBeenCalledWith("BoosterConsumed", "teleport");
  expect(board.colorAt(new cc.Vec2(1, 0))).toBe("red");
  expect(board.colorAt(new cc.Vec2(1, 1))).toBe("blue");
});

// Когда после обмена нет ходов, заряд не тратится, а событие SwapCancelled
// уведомляет о возврате
it("cancels swap when no moves available", async () => {
  const bus = new ExtendedEventTarget();
  const board = new Board(
    {
      cols: 2,
      rows: 1,
      tileSize: 1,
      colors: ["red", "blue"],
      superThreshold: 3,
    },
    [[TileFactory.createNormal("red"), TileFactory.createNormal("blue")]],
  );
  const booster = new TeleportBooster(board, bus, 1);
  const events: string[] = [];
  bus.on("SwapCancelled", () => events.push("SwapCancelled"));

  booster.start();
  bus.emit("GroupSelected", new cc.Vec2(0, 0));
  bus.emit("GroupSelected", new cc.Vec2(1, 0));
  await new Promise((r) => setImmediate(r));

  expect(booster.charges).toBe(1);
  expect(events).toEqual(["SwapCancelled"]);
  expect(board.colorAt(new cc.Vec2(0, 0))).toBe("red");
  expect(board.colorAt(new cc.Vec2(1, 0))).toBe("blue");
});
