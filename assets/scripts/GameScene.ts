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
import { SoundController } from "./core/fx/SoundController";

const { ccclass } = cc._decorator;

@ccclass()
export default class GameScene extends cc.Component {
  private fsm: GameStateMachine | null = null;
  private boardCtrl!: GameBoardController;
  private solver!: BoardSolver;
  private executor!: MoveExecutor;
  private scoreStrategy!: ScoreStrategyQuadratic;
  private turns!: TurnManager;
  private currentState: GameState = "WaitingInput";
  private sounds!: SoundController;

  private onStateChange = (s: GameState): void => {
    this.currentState = s;
  };

  private onBoostersSelected = (charges: Record<string, number>): void => {
    const board = this.boardCtrl.getBoard();
    initBoosterService(
      board,
      () => this.boardCtrl.tileViews,
      () => this.currentState,
      charges,
    );
    if (!this.fsm) {
      this.fsm = new GameStateMachine(
        EventBus,
        board,
        this.solver,
        this.executor,
        this.scoreStrategy,
        this.turns,
        800,
        3,
      );
      this.fsm.start();
    } else {
      this.fsm.reset();
    }
  };

  private onGameRestart = (): void => {
    this.boardCtrl.resetBoard();
    this.fsm?.reset();
  };

  start(): void {
    this.boardCtrl = this.getComponentInChildren(GameBoardController);
    if (!this.boardCtrl) {
      console.error("GameBoardController not found");
      return;
    }

    const board = this.boardCtrl.getBoard();
    this.solver = new BoardSolver(board);
    this.executor = new MoveExecutor(board, EventBus);
    this.scoreStrategy = new ScoreStrategyQuadratic(1);
    this.turns = new TurnManager(20, EventBus);

    // Initialize sound effects controller
    this.sounds = new SoundController(EventBus);

    // Diagnostic helper that tracks event sequence for each move.
    new MoveSequenceLogger(EventBus, board);

    EventBus.on(EventNames.StateChanged, this.onStateChange);
    EventBus.on(EventNames.BoostersSelected, this.onBoostersSelected);
    EventBus.on(EventNames.GameRestart, this.onGameRestart);

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

  onDestroy(): void {
    EventBus.off(EventNames.StateChanged, this.onStateChange);
    EventBus.off(EventNames.BoostersSelected, this.onBoostersSelected);
    EventBus.off(EventNames.GameRestart, this.onGameRestart);
    this.sounds.destroy();
  }
}
