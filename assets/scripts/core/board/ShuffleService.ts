import { InfrastructureEventBus } from "../../infrastructure/InfrastructureEventBus";
import { Board } from "./Board";
import { BoardSolver } from "./BoardSolver";
import { Tile } from "./Tile";
import { BoardConfig } from "../../config/ConfigLoader";
import { EventNames } from "../events/EventNames";

export class ShuffleService {
  private shuffleCount = 0;
  constructor(
    private board: Board,
    private solver: BoardSolver,
    private bus: InfrastructureEventBus,
    private maxShuffles: number = 3,
  ) {}

  /**
   * Checks if there are moves and if not:
   * - if shuffleCount < maxShuffles:
   *     emit 'AutoShuffle', call shuffle() and increment the counter;
   * - otherwise emit 'ShuffleLimitExceeded'.
   */
  ensureMoves(): void {
    if (this.solver.hasMoves()) {
      // If there are moves, do nothing.
      return;
    }

    if (this.shuffleCount < this.maxShuffles) {
      // Notify that an automatic shuffle will happen.
      this.bus.emit(EventNames.AutoShuffle);
      // Increment the counter before the operation.
      this.shuffleCount++;
      // Shuffle the tiles on the board.
      this.shuffle();
    } else {
      // Reached the limit, no more shuffling allowed.
      this.bus.emit(EventNames.ShuffleLimitExceeded);
    }
  }

  /**
   * Shuffles all tiles on the board in random order.
   * Emits 'ShuffleDone' after completion.
   */
  shuffle(): void {
    const cfg = (this.board as unknown as { cfg: BoardConfig }).cfg;
    const tiles: (Tile | null)[] = [];

    // Read the current state of the board into a flat array.
    for (let y = 0; y < cfg.rows; y++) {
      for (let x = 0; x < cfg.cols; x++) {
        tiles.push(this.board.tileAt(new cc.Vec2(x, y)));
      }
    }

    // Fisher-Yates algorithm for uniform shuffling.
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }

    // Write tiles back to the board, iterating over columns.
    let idx = 0;
    for (let x = 0; x < cfg.cols; x++) {
      for (let y = 0; y < cfg.rows; y++) {
        this.board.setTile(new cc.Vec2(x, y), tiles[idx++] ?? null);
      }
    }

    // Notify listeners that the shuffling is done.
    this.bus.emit(EventNames.ShuffleDone);
  }

  /**
   * Resets the counter of used shuffles.
   */
  reset(): void {
    this.shuffleCount = 0;
  }
}
