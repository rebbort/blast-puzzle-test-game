import { EventBus } from "../../assets/scripts/infrastructure/EventBus";

import { Board } from "../../assets/scripts/core/board/Board";
import { TileFactory } from "../../assets/scripts/core/board/Tile";
import { BombBooster } from "../../assets/scripts/core/boosters/BombBooster";
import { BoardConfig } from "../../assets/scripts/config/ConfigLoader";

const cfg: BoardConfig = {
  cols: 3,
  rows: 3,
  tileSize: 1,
  colors: ["red"],
  superThreshold: 3,
};

describe("BombBooster", () => {
  const bus = new EventBus();
  const emitSpy = jest.spyOn(bus, "emit");

  beforeEach(() => {
    emitSpy.mockClear();
    bus.removeAllListeners();
  });

  it("consumes charge and runs BombCommand on click", async () => {
    const tiles = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => TileFactory.createNormal("red")),
    );
    const board = new Board(cfg, tiles);
    const booster = new BombBooster(board, bus, 1, 1);
    const events: string[] = [];
    bus.on("MoveCompleted", () => events.push("MoveCompleted"));
    booster.start();

    bus.emit("GroupSelected", new cc.Vec2(1, 1));
    await new Promise((r) => setImmediate(r));

    expect(booster.charges).toBe(0);
    expect(emitSpy).toHaveBeenCalledWith("BoosterConsumed", "bomb");
    expect(events).toEqual(["MoveCompleted"]);
    // neighbors cleared
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
});
