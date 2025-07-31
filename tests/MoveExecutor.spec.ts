import { Board } from "../assets/scripts/core/board/Board";
import { BoardConfig } from "../assets/scripts/config/ConfigLoader";
import { TileFactory } from "../assets/scripts/core/board/Tile";
import { EventBus } from "../assets/scripts/core/EventBus";
import { EventNames } from "../assets/scripts/core/events/EventNames";
import { MoveExecutor } from "../assets/scripts/core/board/MoveExecutor";

describe("MoveExecutor", () => {
  const cfg: BoardConfig = {
    cols: 2,
    rows: 2,
    tileWidth: 1,
    tileHeight: 1,
    colors: ["red"],
    superThreshold: 3,
  };

  beforeEach(() => {
    EventBus.clear();
  });

  test("executes commands in sequence and emits events", async () => {
    const tiles = [
      [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
      [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
    ];
    const board = new Board(cfg, tiles);
    const executor = new MoveExecutor(board, EventBus);

    const events: string[] = [];
    EventBus.on(EventNames.TilesRemoved, () =>
      events.push(EventNames.TilesRemoved),
    );
    EventBus.on(EventNames.FallDone, () => events.push(EventNames.FallDone));
    EventBus.on(EventNames.FillDone, () => events.push(EventNames.FillDone));
    EventBus.on(EventNames.MoveCompleted, () =>
      events.push(EventNames.MoveCompleted),
    );

    await executor.execute([new cc.Vec2(0, 1), new cc.Vec2(1, 1)]);

    expect(events).toEqual([
      EventNames.TilesRemoved,
      EventNames.FallDone,
      EventNames.FillDone,
      EventNames.MoveCompleted,
    ]);
  });

  test("throws when group is empty", async () => {
    const board = new Board(cfg);
    const executor = new MoveExecutor(board, EventBus);
    await expect(executor.execute([])).rejects.toThrow();
  });
});
