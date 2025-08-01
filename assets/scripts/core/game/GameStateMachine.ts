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
import { MoveExecutor, fillBoard } from "../board/MoveExecutor";
import { ScoreStrategy } from "../rules/ScoreStrategy";
import { TurnManager } from "../rules/TurnManager";
import { BoardConfig } from "../../config/ConfigLoader";
import { EventNames } from "../events/EventNames";
import { FallCommand } from "../board/commands/FallCommand";

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
    this.bus.on(EventNames.MoveCompleted, () => void this.onMoveCompleted());
    console.debug(
      "Listeners for GroupSelected:",
      this.bus.getListenerCount(EventNames.GroupSelected),
    );
    // broadcast initial values so HUD can display them
    const turns = this.turnManager.getRemaining();
    this.bus.emit(EventNames.TurnsInit, {
      turns,
      score: this.score,
      targetScore: this.targetScore,
    });
    // legacy events expected by older HUD/tests
    this.bus.emit(EventNames.TurnUsed, turns);
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
  private async onMoveCompleted(): Promise<void> {
    if (this.state !== "ExecutingMove") return;

    // Falling is performed before filling so existing tiles settle
    // and new ones never move right after spawning. The FSM waits
    // for the FallDone and FillDone signals to keep the sequence
    // deterministic and to detect missing events via timeouts.

    // Determine columns that contain empty cells after the move
    const dirtyCols = this.collectDirtyColumns();

    if (dirtyCols.length > 0) {
      this.changeState("TilesFalling");
      const fallDone = this.wait(EventNames.FallDone, 500);
      new FallCommand(this.board, this.bus, dirtyCols).execute();
      const fallRes = await fallDone;
      if (fallRes) {
        console.debug("FSM: FallDone received, triggering fill");
      }
    } else {
      this.changeState("TilesFalling");
    }

    // After falling, fill the board if any slots remain empty
    const remainingCols = this.collectDirtyColumns();
    if (remainingCols.length > 0) {
      this.changeState("Filling");
      const fillDone = this.wait(EventNames.FillDone, 500);
      fillBoard(this.board, this.bus);
      const fillRes = await fillDone;
      if (fillRes) {
        console.debug("FSM: FillDone received, evaluating next move");
      } else {
        console.warn(
          "FSM: Fill step timed out — possible missing fillBoard call",
        );
      }
    } else {
      this.changeState("Filling");
    }

    // After the board is filled we may get new groups automatically.
    // The solver checks and if a group exists the executor runs
    // another remove → fall → fill cycle to mimic chain reactions.
    this.changeState("CheckEnd");
    this.evaluateEnd();
    const autoGroup = this.findRemovableGroup();
    // Prevent endless loops on mono-colored boards by requiring
    // the found group to occupy less than the whole board.
    const total = this.board.cols * this.board.rows;
    if (autoGroup.length >= 2 && autoGroup.length < total) {
      await this.executor.execute(autoGroup);
      return;
    }
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

  /**
   * Returns column indices that currently contain empty cells.
   */
  private collectDirtyColumns(): number[] {
    const cols = new Set<number>();
    for (let y = 0; y < this.board.rows; y++) {
      for (let x = 0; x < this.board.cols; x++) {
        if (!this.board.tileAt(new cc.Vec2(x, y))) cols.add(x);
      }
    }
    return Array.from(cols);
  }

  /** Waits for an event or resolves null after timeout. */
  private wait(event: string, ms: number): Promise<unknown[] | null> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), ms);
      this.bus.once(event, (...args: unknown[]) => {
        clearTimeout(timer);
        resolve(args);
      });
    });
  }

  /** Searches the board for any removable group. */
  private findRemovableGroup(): cc.Vec2[] {
    for (let y = 0; y < this.board.rows; y++) {
      for (let x = 0; x < this.board.cols; x++) {
        const pos = new cc.Vec2(x, y);
        const tile = this.board.tileAt(pos);
        if (!tile) continue;
        const group = this.solver.findGroup(pos);
        if (group.length >= 2) return group;
      }
    }
    return [];
  }
}
