import { Board } from "../assets/scripts/core/board/Board";
import { BoardConfig } from "../assets/scripts/config/BoardConfig";
import { TileFactory } from "../assets/scripts/core/board/Tile";
import { EventBus } from "../assets/scripts/core/EventBus";
import { MoveExecutor } from "../assets/scripts/core/board/MoveExecutor";

describe("MoveExecutor", () => {
  const cfg: BoardConfig = {
    cols: 2,
    rows: 2,
    tileSize: 1,
    colors: ["red"],
    superThreshold: 3,
  };

  beforeEach(() => {
    EventBus.removeAllListeners();
  });

  test("executes commands in sequence and emits events", async () => {
    const tiles = [
      [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
      [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
    ];
    const board = new Board(cfg, tiles);
    const executor = new MoveExecutor(board, EventBus);

    const events: string[] = [];
    EventBus.on("removeDone", () => events.push("removeDone"));
    EventBus.on("fallDone", () => events.push("fallDone"));
    EventBus.on("fillDone", () => events.push("fillDone"));
    EventBus.on("MoveCompleted", () => events.push("MoveCompleted"));

    await executor.execute([new cc.Vec2(0, 1), new cc.Vec2(1, 1)]);

    expect(events).toEqual([
      "removeDone",
      "fallDone",
      "fillDone",
      "MoveCompleted",
    ]);
  });

  test("throws when group is empty", async () => {
    const board = new Board(cfg);
    const executor = new MoveExecutor(board, EventBus);
    await expect(executor.execute([])).rejects.toThrow();
  });
});
