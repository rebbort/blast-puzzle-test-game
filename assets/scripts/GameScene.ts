import { EventBus } from "./core/EventBus";
import { GameStateMachine } from "./core/game/GameStateMachine";
import { BoardSolver } from "./core/board/BoardSolver";
import { MoveExecutor } from "./core/board/MoveExecutor";
import { ScoreStrategyQuadratic } from "./core/rules/ScoreStrategyQuadratic";
import { TurnManager } from "./core/rules/TurnManager";
import GameBoardController from "./ui/controllers/GameBoardController";

const { ccclass } = cc._decorator;

@ccclass()
export default class GameScene extends cc.Component {
  private fsm: GameStateMachine | null = null;

  start(): void {
    const boardCtrl = this.getComponentInChildren(GameBoardController);
    if (!boardCtrl) {
      console.error("GameBoardController not found");
      return;
    }

    const board = boardCtrl.getBoard();
    const solver = new BoardSolver(board);
    const executor = new MoveExecutor(board, EventBus);
    const scoreStrategy = new ScoreStrategyQuadratic(1);
    const turns = new TurnManager(20, EventBus);

    this.fsm = new GameStateMachine(
      EventBus,
      board,
      solver,
      executor,
      scoreStrategy,
      turns,
      100,
      3,
    );
    this.fsm.start();
  }
}
