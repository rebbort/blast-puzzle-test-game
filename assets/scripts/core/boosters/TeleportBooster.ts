import { Booster } from "./Booster";
import { Board } from "../board/Board";
import { ExtendedEventTarget } from "../../infrastructure/ExtendedEventTarget";
import { SwapCommand } from "../board/commands/SwapCommand";
import { BoardSolver } from "../board/BoardSolver";
import { EventNames } from "../events/EventNames";

/**
 * Teleport booster allows swapping any two tiles.
 * The first click selects tile A, the second selects tile B.
 * After the swap we check if the board has any available moves.
 * If none are found the swap is reverted and charges stay intact.
 */
export class TeleportBooster implements Booster {
  id = "teleport";
  charges: number;
  constructor(
    private board: Board,
    private bus: ExtendedEventTarget,
    charges: number,
  ) {
    this.charges = charges;
  }

  canActivate(): boolean {
    return this.charges > 0;
  }

  start(): void {
    let first: cc.Vec2 | null = null;

    const onSecond = async (posB: unknown) => {
      if (this.charges <= 0 || !first) return;
      const b = posB as cc.Vec2;
      // Perform swap
      await new SwapCommand(this.board, first, b, this.bus).execute();
      const solver = new BoardSolver(this.board);
      if (solver.hasMoves()) {
        this.charges--;
        this.bus.emit(EventNames.BoosterConsumed, this.id);
      } else {
        // Revert the swap when it doesn't yield any moves
        await new SwapCommand(this.board, first, b, this.bus).execute();
        this.bus.emit(EventNames.SwapCancelled);
      }
    };

    const onFirst = (posA: unknown) => {
      first = posA as cc.Vec2;
      this.bus.once(EventNames.GroupSelected, onSecond);
    };

    // Wait for the first cell selection
    this.bus.once(EventNames.GroupSelected, onFirst);
  }
}
