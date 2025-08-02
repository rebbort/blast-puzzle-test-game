import { InfrastructureEventBus } from "../../assets/scripts/infrastructure/InfrastructureEventBus";

import { Board } from "../../assets/scripts/core/board/Board";
import { TileFactory } from "../../assets/scripts/core/board/Tile";
import { BombCommand } from "../../assets/scripts/core/board/commands/BombCommand";
import { BoardConfig } from "../../assets/scripts/config/ConfigLoader";
import { EventNames } from "../../assets/scripts/core/events/EventNames";

const cfg: BoardConfig = {
  cols: 3,
  rows: 3,
  tileWidth: 1,
  tileHeight: 1,
  colors: ["red"],
  superThreshold: 3,
};

describe("BombCommand", () => {
  const bus = new InfrastructureEventBus();
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
    let removed: cc.Vec2[] = [];
    bus.on(EventNames.RemoveStarted, (g: cc.Vec2[]) => (removed = g));
    bus.on(EventNames.TilesRemoved, () => seq.push(EventNames.TilesRemoved));
    bus.on(EventNames.MoveCompleted, () => seq.push(EventNames.MoveCompleted));

    await cmd.execute();

    expect(seq).toEqual([EventNames.TilesRemoved, EventNames.MoveCompleted]);
    const coords = removed.map((p) => `${p.x},${p.y}`).sort();
    expect(coords).toEqual([
      "0,0",
      "0,1",
      "0,2",
      "1,0",
      "1,1",
      "1,2",
      "2,0",
      "2,1",
      "2,2",
    ]);
  });
});
