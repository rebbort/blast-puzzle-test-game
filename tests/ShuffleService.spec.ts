import { EventBus } from "../assets/scripts/core/EventBus";
import { Board } from "../assets/scripts/core/board/Board";
import { BoardSolver } from "../assets/scripts/core/board/BoardSolver";
import { TileFactory } from "../assets/scripts/core/board/Tile";
import { ShuffleService } from "../assets/scripts/core/board/ShuffleService";
import { BoardConfig } from "../assets/scripts/config/ConfigLoader";

describe("ShuffleService", () => {
  const cfgNoMoves: BoardConfig = {
    cols: 1,
    rows: 1,
    tileSize: 1,
    colors: ["red"],
    superThreshold: 3,
  };

  const cfgMoves: BoardConfig = {
    cols: 2,
    rows: 1,
    tileSize: 1,
    colors: ["red"],
    superThreshold: 3,
  };

  beforeEach(() => {
    EventBus.clear();
  });

  test("auto shuffles until limit then emits ShuffleLimitExceeded", () => {
    const board = new Board(cfgNoMoves, [[TileFactory.createNormal("red")]]);
    const solver = new BoardSolver(board);
    const service = new ShuffleService(board, solver, EventBus, 3);

    const events: string[] = [];
    EventBus.on("AutoShuffle", () => events.push("AutoShuffle"));
    EventBus.on("ShuffleDone", () => events.push("ShuffleDone"));
    EventBus.on("ShuffleLimitExceeded", () => {
      events.push("ShuffleLimitExceeded");
    });

    service.ensureMoves();
    expect((service as unknown as { shuffleCount: number }).shuffleCount).toBe(
      1,
    );
    service.ensureMoves();
    service.ensureMoves();
    service.ensureMoves();

    expect(events).toEqual([
      "AutoShuffle",
      "ShuffleDone",
      "AutoShuffle",
      "ShuffleDone",
      "AutoShuffle",
      "ShuffleDone",
      "ShuffleLimitExceeded",
    ]);
  });

  test("does nothing when moves are available", () => {
    const board = new Board(cfgMoves, [
      [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
    ]);
    const solver = new BoardSolver(board);
    const service = new ShuffleService(board, solver, EventBus, 3);

    const events: string[] = [];
    EventBus.on("AutoShuffle", () => events.push("AutoShuffle"));
    EventBus.on("ShuffleDone", () => events.push("ShuffleDone"));
    EventBus.on("ShuffleLimitExceeded", () =>
      events.push("ShuffleLimitExceeded"),
    );

    service.ensureMoves();

    expect(events).toEqual([]);
  });
});
