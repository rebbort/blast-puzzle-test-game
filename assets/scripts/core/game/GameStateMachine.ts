export type GameState =
  | "WaitingInput"
  | "ExecutingMove"
  | "TilesFalling"
  | "Filling"
  | "CheckEnd"
  | "Shuffle"
  | "BoosterInput"
  | "Win"
  | "Lose";

import { InfrastructureEventBus } from "../../infrastructure/InfrastructureEventBus";
import { Board } from "../board/Board";
import { BoardSolver } from "../board/BoardSolver";
import { MoveExecutor } from "../board/MoveExecutor";
import { ScoreStrategy } from "../rules/ScoreStrategy";
import { TurnManager } from "../rules/TurnManager";
import { BoardConfig } from "../../config/ConfigLoader";
import { EventNames } from "../events/EventNames";

/**
 * Finite state machine orchestrating a single game session.
 * All state changes are propagated through the provided event bus.
 */
export class GameStateMachine {
  /** Current FSM state. */
  private state: GameState = "WaitingInput";
  /** Accumulated player score. */
  private score = 0;
  /** How many times the board was shuffled. */
  private shuffles = 0;

  constructor(
    private bus: InfrastructureEventBus,
    private board: Board,
    private solver: BoardSolver,
    private executor: MoveExecutor,
    private scoreStrategy: ScoreStrategy,
    private turnManager: TurnManager,
    private targetScore: number,
    private maxShuffles: number = 3,
  ) {}

  /**
   * Subscribe to relevant events and enter the initial WaitingInput state.
   */
  start(): void {
    this.bus.on(EventNames.GroupSelected, (p: cc.Vec2) =>
      this.onGroupSelected(p),
    );
    this.bus.on(EventNames.BoosterActivated, () => this.onBoosterActivated());
    this.bus.on(EventNames.BoosterConsumed, () => this.onBoosterConsumed());
    this.bus.on(EventNames.BoosterCancelled, () => this.onBoosterCancelled());
    this.bus.on(EventNames.MoveCompleted, () => this.onMoveCompleted());
    console.debug(
      "Listeners for GroupSelected:",
      this.bus.getListenerCount(EventNames.GroupSelected),
    );
    // broadcast initial values so HUD can display them
    this.bus.emit(EventNames.TurnUsed, this.turnManager.getRemaining());
    this.bus.emit(EventNames.TurnEnded, { score: this.score });
    this.changeState("WaitingInput");
    console.info("FSM started, current state: WaitingInput");
  }

  /**
   * Handles selection of a group by the player.
   * Ignored unless the machine awaits input.
   */
  private onGroupSelected(start: cc.Vec2): void {
    console.info("FSM received GroupSelected at", start);
    if (this.state !== "WaitingInput") {
      console.info(
        `Ignored GroupSelected because current state is ${this.state}`,
      );
      // Ignore input while another action is executing
      return;
    }

    // Determine group of connected tiles and calculate score
    const group = this.solver.findGroup(start);
    if (group.length === 0) return;

    this.turnManager.useTurn();
    this.score += this.scoreStrategy.calculate(group.length);
    this.changeState("ExecutingMove");

    // Execute the move asynchronously; further states advance on MoveCompleted
    void this.executor.execute(group);
  }

  /** Enters booster targeting mode when allowed. */
  private onBoosterActivated(): void {
    if (this.state === "WaitingInput") {
      this.changeState("BoosterInput");
    }
  }

  /** Consumes a booster and proceeds to executing it. */
  private onBoosterConsumed(): void {
    if (this.state === "BoosterInput") {
      this.changeState("ExecutingMove");
    }
  }

  /** Cancels booster usage returning to normal input. */
  private onBoosterCancelled(): void {
    if (this.state === "BoosterInput") {
      this.changeState("WaitingInput");
    }
  }

  /**
   * Triggered when MoveExecutor signals completion of tile removal/fall/fill.
   * Advances through remaining states and evaluates win/lose conditions.
   */
  private onMoveCompleted(): void {
    if (this.state !== "ExecutingMove") return;
    // Transition through remaining post-move phases
    this.changeState("TilesFalling");
    this.changeState("Filling");
    this.changeState("CheckEnd");
    this.evaluateEnd();
    // notify HUD about updated score
    this.bus.emit(EventNames.TurnEnded, { score: this.score });
  }

  /**
   * Checks end conditions and moves to the next appropriate state.
   */
  private evaluateEnd(): void {
    const hasMoves = this.hasAvailableMoves();
    const turns = this.turnManager.getRemaining();

    if (this.score >= this.targetScore) {
      this.changeState("Win");
      return;
    }

    if (!hasMoves && this.shuffles < this.maxShuffles) {
      this.changeState("Shuffle");
      this.shuffleBoard();
      this.shuffles++;
      this.changeState("WaitingInput");
      return;
    }

    if (turns === 0 || (!hasMoves && this.shuffles >= this.maxShuffles)) {
      this.changeState("Lose");
      return;
    }

    this.changeState("WaitingInput");
  }

  /**
   * Emits a new state via the event bus and stores it internally.
   */
  private changeState(newState: GameState): void {
    this.state = newState;
    this.bus.emit(EventNames.StateChanged, newState);
    console.info("State changed to", newState);
    if (newState === "Win") {
      this.bus.emit(EventNames.GameWon, this.score);
    }
    if (newState === "Lose") {
      this.bus.emit(EventNames.GameLost, this.score);
    }
  }

  /**
   * Determines whether any moves remain on the board by searching for
   * adjacent tiles sharing the same color.
   */
  private hasAvailableMoves(): boolean {
    let found = false;
    this.board.forEach((p, tile) => {
      if (found) return;
      for (const n of this.board.neighbors4(p)) {
        const other = this.board.tileAt(n);
        if (other && other.color === tile.color) {
          found = true;
          break;
        }
      }
    });
    return found;
  }

  /** Randomly shuffles all tiles on the board in place. */
  private shuffleBoard(): void {
    const cfg = (this.board as unknown as { cfg: BoardConfig }).cfg;
    const tiles: ReturnType<typeof this.board.tileAt>[] = [];
    for (let y = 0; y < cfg.rows; y++) {
      for (let x = 0; x < cfg.cols; x++) {
        tiles.push(this.board.tileAt(new cc.Vec2(x, y)));
      }
    }
    // Fisher–Yates shuffle
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    let idx = 0;
    for (let y = 0; y < cfg.rows; y++) {
      for (let x = 0; x < cfg.cols; x++) {
        this.board.setTile(new cc.Vec2(x, y), tiles[idx++] ?? null);
      }
    }
  }
}
