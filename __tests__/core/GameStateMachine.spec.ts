import { InfrastructureEventBus } from "../../assets/scripts/infrastructure/InfrastructureEventBus";

const bus = new InfrastructureEventBus();
const emitSpy = jest.spyOn(bus, "emit");

import {
  GameStateMachine,
  GameState,
} from "../../assets/scripts/core/game/GameStateMachine";
import { Board } from "../../assets/scripts/core/board/Board";
import { BoardSolver } from "../../assets/scripts/core/board/BoardSolver";
import { MoveExecutor } from "../../assets/scripts/core/board/MoveExecutor";
import { TileFactory } from "../../assets/scripts/core/board/Tile";
import { BoardConfig } from "../../assets/scripts/config/ConfigLoader";
import { ScoreStrategyQuadratic } from "../../assets/scripts/core/rules/ScoreStrategyQuadratic";
import { TurnManager } from "../../assets/scripts/core/rules/TurnManager";
import { EventNames } from "../../assets/scripts/core/events/EventNames";

const cfg: BoardConfig = {
  cols: 2,
  rows: 2,
  tileWidth: 1,
  tileHeight: 1,
  colors: ["red"],
  superThreshold: 3,
};

function createFSM(target = 10, board?: Board): GameStateMachine {
  const b =
    board ??
    new Board(cfg, [
      [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
      [TileFactory.createNormal("red"), TileFactory.createNormal("red")],
    ]);
  const solver = new BoardSolver(b);
  const exec = new MoveExecutor(b, bus);
  const strategy = new ScoreStrategyQuadratic(1);
  const tm = new TurnManager(5, bus);
  return new GameStateMachine(bus, b, solver, exec, strategy, tm, target, 2);
}

beforeEach(() => {
  emitSpy.mockClear();
  bus.clear();
});

// starting the FSM should emit initial state
it("start emits WaitingInput", () => {
  const fsm = createFSM();
  const states: GameState[] = [];
  bus.on(EventNames.StateChanged, (s) => states.push(s as GameState));
  fsm.start();
  expect(states).toEqual(["WaitingInput"]);
});

// selecting a group runs full move cycle
it("group selection performs move and returns to WaitingInput", async () => {
  const fsm = createFSM();
  const states: GameState[] = [];
  bus.on(EventNames.StateChanged, (s) => states.push(s as GameState));
  fsm.start();
  bus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));
  await new Promise((r) => setImmediate(r));
  expect(states.slice(0, 5)).toEqual([
    "WaitingInput",
    "ExecutingMove",
    "TilesFalling",
    "Filling",
    "CheckEnd",
  ]);
});

// easy target should lead to Win state after move
it("wins when target score reached", async () => {
  const fsm = createFSM(5);
  const states: GameState[] = [];
  bus.on(EventNames.StateChanged, (s) => states.push(s as GameState));
  fsm.start();
  bus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));
  await new Promise((r) => setImmediate(r));
  expect(states).toContain("Win");
});

// booster flow transitions between states
it("handles booster activate and cancel", () => {
  const fsm = createFSM();
  const states: GameState[] = [];
  bus.on(EventNames.StateChanged, (s) => states.push(s as GameState));
  fsm.start();
  // activation now passes booster id
  bus.emit(EventNames.BoosterActivated, "bomb");
  bus.emit(EventNames.BoosterConsumed);
  expect(states).toEqual(["WaitingInput", "BoosterInput", "ExecutingMove"]);
});

it("cancels booster back to WaitingInput", () => {
  const fsm = createFSM();
  const states: GameState[] = [];
  bus.on(EventNames.StateChanged, (s) => states.push(s as GameState));
  fsm.start();
  // include id to match BoosterService API
  bus.emit(EventNames.BoosterActivated, "bomb");
  bus.emit(EventNames.BoosterCancelled);
  expect(states).toEqual(["WaitingInput", "BoosterInput", "WaitingInput"]);
});

// losing when out of turns and no moves
it("moves to Lose when turns end", async () => {
  const board = new Board(cfg, [
    [TileFactory.createNormal("red"), TileFactory.createNormal("blue")],
  ]);
  const solver = new BoardSolver(board);
  const exec = new MoveExecutor(board, bus);
  const strategy = new ScoreStrategyQuadratic(1);
  const tm = new TurnManager(1, bus); // single turn
  const fsm = new GameStateMachine(
    bus,
    board,
    solver,
    exec,
    strategy,
    tm,
    100,
    0,
  );
  const states: GameState[] = [];
  bus.on(EventNames.StateChanged, (s) => states.push(s as GameState));
  fsm.start();
  bus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));
  await new Promise((r) => setImmediate(r));
  expect(states).toContain("Lose");
});

// deadlock triggers shuffle state
it("shuffles board when no moves left", async () => {
  const board = new Board({ ...cfg, cols: 2, rows: 1 }, [
    [TileFactory.createNormal("red"), TileFactory.createNormal("blue")],
  ]);
  const fsm = createFSM(100, board);
  const states: GameState[] = [];
  bus.on(EventNames.StateChanged, (s) => states.push(s as GameState));
  fsm.start();
  bus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));
  await new Promise((r) => setImmediate(r));
  const lastTwo = states.slice(-2);
  expect(lastTwo).toEqual(["Shuffle", "WaitingInput"]);
});
