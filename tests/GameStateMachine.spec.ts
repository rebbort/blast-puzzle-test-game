import { Vec2 } from "cc";
import { EventBus } from "../assets/scripts/core/EventBus";
import {
  GameStateMachine,
  GameState,
} from "../assets/scripts/core/game/GameStateMachine";
import { Board } from "../assets/scripts/core/board/Board";
import { BoardSolver } from "../assets/scripts/core/board/BoardSolver";
import { MoveExecutor } from "../assets/scripts/core/board/MoveExecutor";
import { TileFactory } from "../assets/scripts/core/board/Tile";
import { BoardConfig } from "../assets/scripts/config/BoardConfig";
import { ScoreStrategyQuadratic } from "../assets/scripts/core/rules/ScoreStrategyQuadratic";
import { TurnManager } from "../assets/scripts/core/rules/TurnManager";

describe("GameStateMachine", () => {
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
    EventBus.on("StateChanged", (s: GameState) => states.push(s));
    fsm.start();
    expect(states).toEqual(["WaitingInput"]);
  });

  test("group selection performs full move sequence", async () => {
    const fsm = createFSM();
    const states: GameState[] = [];
    EventBus.on("StateChanged", (s: GameState) => states.push(s));
    fsm.start();
    EventBus.emit("GroupSelected", new Vec2(0, 0));
    await new Promise((r) => setImmediate(r));
    expect(states.slice(0, 5)).toEqual([
      "WaitingInput",
      "ExecutingMove",
      "TilesFalling",
      "Filling",
      "CheckEnd",
    ]);
  });

  test("win when reaching target score", async () => {
    const fsm = createFSM(5); // easy target
    const states: GameState[] = [];
    EventBus.on("StateChanged", (s: GameState) => states.push(s));
    fsm.start();
    EventBus.emit("GroupSelected", new Vec2(0, 0));
    await new Promise((r) => setImmediate(r));
    expect(states).toContain("Win");
  });

  test("deadlock triggers shuffle", async () => {
    const singleCfg: BoardConfig = {
      cols: 1,
      rows: 1,
      tileSize: 1,
      colors: ["red"],
      superThreshold: 3,
    };
    const board = new Board(singleCfg, [[TileFactory.createNormal("red")]]);
    const fsm = createFSM(20, board);
    const states: GameState[] = [];
    EventBus.on("StateChanged", (s: GameState) => states.push(s));
    fsm.start();
    EventBus.emit("GroupSelected", new Vec2(0, 0));
    await new Promise((r) => setImmediate(r));
    const lastTwo = states.slice(-2);
    expect(lastTwo).toEqual(["Shuffle", "WaitingInput"]);
  });

  test("input ignored during execution", () => {
    const fsm = createFSM();
    const states: GameState[] = [];
    EventBus.on("StateChanged", (s: GameState) => states.push(s));
    fsm.start();
    EventBus.emit("GroupSelected", new Vec2(0, 0));
    EventBus.emit("GroupSelected", new Vec2(0, 1));
    expect(states.filter((s) => s === "ExecutingMove")).toHaveLength(1);
  });
});
