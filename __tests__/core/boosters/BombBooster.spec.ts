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
import { BombBooster } from "../../../assets/scripts/core/boosters/BombBooster";
import { BoardConfig } from "../../../assets/scripts/config/ConfigLoader";

const cfg: BoardConfig = {
  cols: 3,
  rows: 3,
  tileWidth: 1,
  tileHeight: 1,
  colors: ["red"],
  superThreshold: 3,
};

// Проверяем расход заряда и радиус действия бомбы
it("consumes charge and clears R-zone", async () => {
  const bus = new ExtendedEventTarget();
  const emitSpy = jest.spyOn(bus, "emit");
  const tiles = Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => TileFactory.createNormal("red")),
  );
  const board = new Board(cfg, tiles);
  const booster = new BombBooster(board, bus, 1, 1);

  booster.start();
  bus.emit("GroupSelected", new cc.Vec2(1, 1));
  await new Promise((r) => setImmediate(r));

  expect(booster.charges).toBe(0);
  expect(emitSpy).toHaveBeenCalledWith("BoosterConsumed", "bomb");
  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
      const p = new cc.Vec2(x, y);
      if (x === 1 && y === 1) {
        expect(board.tileAt(p)).not.toBeNull();
      } else {
        expect(board.tileAt(p)).toBeNull();
      }
    }
  }
});
