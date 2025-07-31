import { InfrastructureEventBus } from "../../assets/scripts/infrastructure/InfrastructureEventBus";

import { Board } from "../../assets/scripts/core/board/Board";
import { TileFactory } from "../../assets/scripts/core/board/Tile";
import { SwapCommand } from "../../assets/scripts/core/board/commands/SwapCommand";
import { BoardConfig } from "../../assets/scripts/config/ConfigLoader";
import { EventNames } from "../../assets/scripts/core/events/EventNames";

describe("SwapCommand", () => {
  const bus = new InfrastructureEventBus();
  const emitSpy = jest.spyOn(bus, "emit");

  beforeEach(() => {
    emitSpy.mockClear();
    bus.clear();
  });

  const cfg: BoardConfig = {
    cols: 2,
    rows: 1,
    tileWidth: 1,
    tileHeight: 1,
    colors: ["red", "blue"],
    superThreshold: 3,
  };

  it("swaps tiles and emits SwapDone", async () => {
    const board = new Board(cfg, [
      [TileFactory.createNormal("red"), TileFactory.createNormal("blue")],
    ]);
    const cmd = new SwapCommand(
      board,
      new cc.Vec2(0, 0),
      new cc.Vec2(1, 0),
      bus,
    );
    const seq: string[] = [];
    bus.on(EventNames.SwapDone, () => seq.push(EventNames.SwapDone));

    await cmd.execute();

    expect(board.tileAt(new cc.Vec2(0, 0))?.color).toBe("blue");
    expect(board.tileAt(new cc.Vec2(1, 0))?.color).toBe("red");
    expect(seq).toEqual([EventNames.SwapDone]);
  });
});
