import { ExtendedEventTarget } from "../../assets/scripts/infrastructure/ExtendedEventTarget";

import { Board } from "../../assets/scripts/core/board/Board";
import { TileFactory } from "../../assets/scripts/core/board/Tile";
import { BombCommand } from "../../assets/scripts/core/board/commands/BombCommand";
import { BoardConfig } from "../../assets/scripts/config/ConfigLoader";

const cfg: BoardConfig = {
  cols: 3,
  rows: 3,
  tileWidth: 1,
  tileHeight: 1,
  colors: ["red"],
  superThreshold: 3,
};

describe("BombCommand", () => {
  const bus = new ExtendedEventTarget();
  const emitSpy = jest.spyOn(bus, "emit");

  beforeEach(() => {
    emitSpy.mockClear();
    bus.clear();
  });

  it("removes tiles in radius and emits events", async () => {
    const tiles = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => TileFactory.createNormal("red")),
    );
    const board = new Board(cfg, tiles);
    const cmd = new BombCommand(board, new cc.Vec2(1, 1), 1, bus);
    const seq: string[] = [];
    bus.on("removeDone", () => seq.push("removeDone"));
    bus.on("MoveCompleted", () => seq.push("MoveCompleted"));

    await cmd.execute();

    expect(seq).toEqual(["removeDone", "MoveCompleted"]);
    // center tile remains, остальные восемь должны быть пустыми
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
