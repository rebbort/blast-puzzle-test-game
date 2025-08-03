import { EventBus } from "./core/EventBus";
import { GameStateMachine, GameState } from "./core/game/GameStateMachine";
import { BoardSolver } from "./core/board/BoardSolver";
import { MoveExecutor } from "./core/board/MoveExecutor";
import { ScoreStrategyQuadratic } from "./core/rules/ScoreStrategyQuadratic";
import { TurnManager } from "./core/rules/TurnManager";
import GameBoardController from "./ui/controllers/GameBoardController";
import { MoveSequenceLogger } from "./core/diagnostics/MoveSequenceLogger";
import { initBoosterService } from "./core/boosters/BoosterSetup";
import { EventNames } from "./core/events/EventNames";
import BoosterSelectPopup from "./ui/controllers/BoosterSelectPopup";
import { boosterSelectionService } from "./ui/services/BoosterSelectionService";

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

    // Diagnostic helper that tracks event sequence for each move.
    new MoveSequenceLogger(EventBus, board);

    // Track current FSM state for booster service
    let currentState: GameState = "WaitingInput";
    EventBus.on(EventNames.StateChanged, (s) => {
      currentState = s as GameState;
    });

    // Wait for player to choose boosters before starting the game
    EventBus.once(
      EventNames.BoostersSelected,
      (charges: Record<string, number>) => {
        initBoosterService(
          board,
          () => boardCtrl.tileViews,
          () => currentState,
          charges,
        );
        this.fsm = new GameStateMachine(
          EventBus,
          board,
          solver,
          executor,
          scoreStrategy,
          turns,
          800,
          3,
        );
        this.fsm.start();
      },
    );

    // Ensure booster selection popup is visible
    const selector = this.getComponentInChildren(BoosterSelectPopup);
    if (selector) {
      (selector.node as unknown as { active: boolean }).active = true;
    } else {
      // If no selector exists, auto-select zero boosters to proceed
      boosterSelectionService.reset();
      boosterSelectionService.confirm();
    }
  }
}
