import { InfrastructureEventBus } from "../../../assets/scripts/infrastructure/InfrastructureEventBus";
import { Board } from "../../../assets/scripts/core/board/Board";
import { BoardSolver } from "../../../assets/scripts/core/board/BoardSolver";
import { MoveExecutor } from "../../../assets/scripts/core/board/MoveExecutor";
import { TileFactory, TileKind } from "../../../assets/scripts/core/board/Tile";
import { BoardConfig } from "../../../assets/scripts/config/ConfigLoader";
import { ScoreStrategyQuadratic } from "../../../assets/scripts/core/rules/ScoreStrategyQuadratic";
import { TurnManager } from "../../../assets/scripts/core/rules/TurnManager";
import { GameStateMachine } from "../../../assets/scripts/core/game/GameStateMachine";
import { EventNames } from "../../../assets/scripts/core/events/EventNames";

const cfg: BoardConfig = {
  cols: 3,
  rows: 3,
  tileWidth: 1,
  tileHeight: 1,
  colors: ["red"],
  superThreshold: 3,
};

async function activate(
  kind: TileKind,
): Promise<{ events: string[]; removed: cc.Vec2[]; score: number }> {
  const tiles = Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => TileFactory.createNormal("red")),
  );
  tiles[1][1].kind = kind;
  const board = new Board(cfg, tiles);
  const bus = new InfrastructureEventBus();
  const solver = new BoardSolver(board);
  const exec = new MoveExecutor(board, bus);
  const strategy = new ScoreStrategyQuadratic(1);
  const tm = new TurnManager(5, bus);
  const fsm = new GameStateMachine(
    bus,
    board,
    solver,
    exec,
    strategy,
    tm,
    0,
    0,
  );
  const events: string[] = [];
  let removed: cc.Vec2[] = [];
  let score = 0;
  bus.on(EventNames.BoosterConfirmed, () =>
    events.push(EventNames.BoosterConfirmed),
  );
  bus.on(EventNames.RemoveStarted, (g: cc.Vec2[]) => (removed = g));
  bus.on(EventNames.TilesRemoved, () => events.push(EventNames.TilesRemoved));
  bus.on(EventNames.MoveCompleted, () => events.push(EventNames.MoveCompleted));
  bus.on(EventNames.TurnEnded, ({ score: s }) => (score = s));
  fsm.start();
  bus.emit(EventNames.GroupSelected, new cc.Vec2(1, 1));
  // Wait until the move fully completes so callers receive all events in order.
  await new Promise((r) => bus.once(EventNames.MoveCompleted, r));
  return { events, removed, score };
}

describe("super tile activation", () => {
  it("activates SuperRow clearing row and awards score", async () => {
    const { events, removed, score } = await activate(TileKind.SuperRow);
    expect(events).toEqual([
      EventNames.BoosterConfirmed,
      EventNames.TilesRemoved,
      EventNames.MoveCompleted,
    ]);
    const coords = removed.map((p) => `${p.x},${p.y}`).sort();
    expect(coords).toEqual(["0,1", "1,1", "2,1"]);
    expect(score).toBe(4);
  });

  it("activates SuperCol clearing column", async () => {
    const { events, removed } = await activate(TileKind.SuperCol);
    expect(events).toEqual([
      EventNames.BoosterConfirmed,
      EventNames.TilesRemoved,
      EventNames.MoveCompleted,
    ]);
    const coords = removed.map((p) => `${p.x},${p.y}`).sort();
    expect(coords).toEqual(["1,0", "1,1", "1,2"]);
  });

  it("activates SuperBomb clearing area", async () => {
    const { events, removed } = await activate(TileKind.SuperBomb);
    expect(events).toEqual([
      EventNames.BoosterConfirmed,
      EventNames.TilesRemoved,
      EventNames.MoveCompleted,
    ]);
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

  it("SuperRow triggers SuperCol in same row", async () => {
    const tiles = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => TileFactory.createNormal("red")),
    );
    tiles[1][1].kind = TileKind.SuperRow;
    tiles[1][2].kind = TileKind.SuperCol;
    const board = new Board(cfg, tiles);
    const bus = new InfrastructureEventBus();
    const solver = new BoardSolver(board);
    const exec = new MoveExecutor(board, bus);
    const strategy = new ScoreStrategyQuadratic(1);
    const tm = new TurnManager(5, bus);
    const fsm = new GameStateMachine(
      bus,
      board,
      solver,
      exec,
      strategy,
      tm,
      0,
      0,
    );
    let removed: cc.Vec2[] = [];
    bus.on(EventNames.RemoveStarted, (g: cc.Vec2[]) => (removed = g));
    fsm.start();
    bus.emit(EventNames.GroupSelected, new cc.Vec2(1, 1));
    await new Promise((r) => bus.once(EventNames.MoveCompleted, r));
    const coords = removed.map((p) => `${p.x},${p.y}`).sort();
    expect(coords).toEqual(["0,1", "1,1", "2,0", "2,1", "2,2"]);
  });

  it("SuperBomb triggers touched super tiles", async () => {
    const bigCfg: BoardConfig = { ...cfg, cols: 5, rows: 5 };
    const tiles = Array.from({ length: 5 }, () =>
      Array.from({ length: 5 }, () => TileFactory.createNormal("red")),
    );
    tiles[2][2].kind = TileKind.SuperBomb;
    tiles[2][3].kind = TileKind.SuperCol;
    const board = new Board(bigCfg, tiles);
    const bus = new InfrastructureEventBus();
    const solver = new BoardSolver(board);
    const exec = new MoveExecutor(board, bus);
    const strategy = new ScoreStrategyQuadratic(1);
    const tm = new TurnManager(5, bus);
    const fsm = new GameStateMachine(
      bus,
      board,
      solver,
      exec,
      strategy,
      tm,
      0,
      0,
    );
    let removed: cc.Vec2[] = [];
    bus.on(EventNames.RemoveStarted, (g: cc.Vec2[]) => (removed = g));
    fsm.start();
    bus.emit(EventNames.GroupSelected, new cc.Vec2(2, 2));
    await new Promise((r) => setImmediate(r));
    const coords = removed.map((p) => `${p.x},${p.y}`).sort();
    // bomb radius covers square [1,3]x[1,3]; SuperCol at x=3 adds cells (3,0) and (3,4)
    expect(coords).toEqual([
      "1,1",
      "1,2",
      "1,3",
      "2,1",
      "2,2",
      "2,3",
      "3,0",
      "3,1",
      "3,2",
      "3,3",
      "3,4",
    ]);
  });

  it("SuperClear clears entire board and triggers supers", async () => {
    const tiles = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () => TileFactory.createNormal("red")),
    );
    tiles[1][1].kind = TileKind.SuperClear;
    tiles[0][0].kind = TileKind.SuperRow;
    const board = new Board(cfg, tiles);
    const bus = new InfrastructureEventBus();
    const solver = new BoardSolver(board);
    const exec = new MoveExecutor(board, bus);
    const strategy = new ScoreStrategyQuadratic(1);
    const tm = new TurnManager(5, bus);
    const fsm = new GameStateMachine(
      bus,
      board,
      solver,
      exec,
      strategy,
      tm,
      0,
      0,
    );
    const events: string[] = [];
    let removed: cc.Vec2[] = [];
    let finalScore = 0;
    bus.on(EventNames.BoosterConfirmed, () =>
      events.push(EventNames.BoosterConfirmed),
    );
    bus.on(EventNames.RemoveStarted, (g: cc.Vec2[]) => (removed = g));
    bus.on(EventNames.TilesRemoved, () => events.push(EventNames.TilesRemoved));
    bus.on(EventNames.MoveCompleted, () =>
      events.push(EventNames.MoveCompleted),
    );
    bus.on(EventNames.TurnEnded, ({ score }) => (finalScore = score));
    fsm.start();
    bus.emit(EventNames.GroupSelected, new cc.Vec2(1, 1));
    await new Promise((r) => bus.once(EventNames.MoveCompleted, r));
    const coords = removed.map((p) => `${p.x},${p.y}`).sort();
    expect(events).toEqual([
      EventNames.BoosterConfirmed,
      EventNames.TilesRemoved,
      EventNames.MoveCompleted,
    ]);
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
    expect(finalScore).toBe(64);
  });
});
