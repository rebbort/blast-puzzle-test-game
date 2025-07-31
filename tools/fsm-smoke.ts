import { Board } from "../assets/scripts/core/board/Board";
import { BoardGenerator } from "../assets/scripts/core/board/BoardGenerator";
import { BoardSolver } from "../assets/scripts/core/board/BoardSolver";
import { MoveExecutor } from "../assets/scripts/core/board/MoveExecutor";
import { ScoreStrategyQuadratic } from "../assets/scripts/core/rules/ScoreStrategyQuadratic";
import { TurnManager } from "../assets/scripts/core/rules/TurnManager";
import { GameStateMachine } from "../assets/scripts/core/game/GameStateMachine";
import { EventBus } from "../assets/scripts/core/EventBus";
import { EventNames } from "../assets/scripts/core/events/EventNames";
import { DefaultBoard } from "../assets/scripts/config/ConfigLoader";

const board: Board = new BoardGenerator().generate(DefaultBoard);
const solver = new BoardSolver(board);
const executor = new MoveExecutor(board, EventBus);
const score = new ScoreStrategyQuadratic(1);
const turns = new TurnManager(5, EventBus);
const fsm = new GameStateMachine(
  EventBus,
  board,
  solver,
  executor,
  score,
  turns,
  50,
  2,
);

EventBus.on(EventNames.StateChanged, (s: string) => console.log("State:", s));
EventBus.on(EventNames.GroupSelected, (p: cc.Vec2) =>
  console.log("Emitted group", p),
);

fsm.start();
EventBus.emit(EventNames.GroupSelected, new cc.Vec2(0, 0));
