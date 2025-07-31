import { EventBus } from "../assets/scripts/core/EventBus";
import { EventNames } from "../assets/scripts/core/events/EventNames";
import {
  GameStateMachine,
  GameState,
} from "../assets/scripts/core/game/GameStateMachine";
import { Board } from "../assets/scripts/core/board/Board";
import { BoardSolver } from "../assets/scripts/core/board/BoardSolver";
import { MoveExecutor } from "../assets/scripts/core/board/MoveExecutor";
import { TileFactory } from "../assets/scripts/core/board/Tile";
import { BoardConfig } from "../assets/scripts/config/ConfigLoader";
import { ScoreStrategyQuadratic } from "../assets/scripts/core/rules/ScoreStrategyQuadratic";
import { TurnManager } from "../assets/scripts/core/rules/TurnManager";

describe("GameStateMachine", () => {
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

  function createFSM(target = 10, board?: Board): GameStateMachine {
    const b =
      board ??
      new Board(cfg, [
        [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
        [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
      ]);
    const solver = new BoardSolver(b);
    const exec = new MoveExecutor(b, EventBus);
    const strategy = new ScoreStrategyQuadratic(1);
    const tm = new TurnManager(5, EventBus);
    return new GameStateMachine(
      EventBus,
      b,
      solver,
      exec,
      strategy,
      tm,
      target,
      3,
    );
  }

  test("start emits WaitingInput", () => {
    const fsm = createFSM();
    const states: GameState[] = [];
    EventBus.on(EventNames.StateChanged, (s: GameState) => states.push(s));
    fsm.start();
    expect(states).toEqual(["WaitingInput"]);
  });

  test("start announces initial turns and score", () => {
    const fsm = createFSM();
    let turns: number | undefined;
    let score: number | undefined;
    EventBus.on(EventNames.TurnUsed, (t) => (turns = t as number));
    EventBus.on(
      EventNames.TurnEnded,
      (s: { score: number }) => (score = s.score),
    );
    fsm.start();
    expect(turns).toBe(5);
    expect(score).toBe(0);
  });

  test("group selection performs full move sequence", async () => {
    const fsm = createFSM();
    const states: GameState[] = [];
    EventBus.on(EventNames.StateChanged, (s: GameState) => states.push(s));
    let ended: number | undefined;
    EventBus.on(
      EventNames.TurnEnded,
      (s: { score: number }) => (ended = s.score),
    );
    fsm.start();
    EventBus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));
    await new Promise((r) => setImmediate(r));
    expect(states.slice(0, 5)).toEqual([
      "WaitingInput",
      "ExecutingMove",
      "TilesFalling",
      "Filling",
      "CheckEnd",
    ]);
    expect(ended).toBeGreaterThan(0);
  });

  test("win when reaching target score", async () => {
    const fsm = createFSM(5); // easy target
    const states: GameState[] = [];
    EventBus.on(EventNames.StateChanged, (s: GameState) => states.push(s));
    fsm.start();
    EventBus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));
    await new Promise((r) => setImmediate(r));
    expect(states).toContain("Win");
  });

  test("deadlock triggers shuffle", async () => {
    const singleCfg: BoardConfig = {
      cols: 1,
      rows: 1,
      tileWidth: 1,
      tileHeight: 1,
      colors: ["red"],
      superThreshold: 3,
    };
    const board = new Board(singleCfg, [[TileFactory.createNormal("red")]]);
    const fsm = createFSM(20, board);
    const states: GameState[] = [];
    EventBus.on(EventNames.StateChanged, (s: GameState) => states.push(s));
    fsm.start();
    EventBus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));
    await new Promise((r) => setImmediate(r));
    const lastTwo = states.slice(-2);
    expect(lastTwo).toEqual(["Shuffle", "WaitingInput"]);
  });

  test("input ignored during execution", () => {
    const fsm = createFSM();
    const states: GameState[] = [];
    EventBus.on(EventNames.StateChanged, (s: GameState) => states.push(s));
    fsm.start();
    EventBus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));
    EventBus.emit(EventNames.GroupSelected, new cc.Vec2(0, 1));
    expect(states.filter((s) => s === "ExecutingMove")).toHaveLength(1);
  });
});
