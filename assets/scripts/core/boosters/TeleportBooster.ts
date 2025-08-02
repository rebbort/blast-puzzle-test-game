import { Booster } from "./Booster";
import { Board } from "../board/Board";
import { InfrastructureEventBus } from "../../infrastructure/InfrastructureEventBus";
import { SwapCommand } from "../board/commands/SwapCommand";
import { BoardSolver } from "../board/BoardSolver";
import { EventNames } from "../events/EventNames";

/**
 * Teleport booster allows swapping any two tiles in two taps without
 * extra confirmation.
 *
 * First tap selects tile A and emits {@link EventNames.BoosterTargetSelected}
 * with stage="first" so the UI can highlight it. A second tap on the same
 * tile or outside the board cancels the selection and leaves charges intact.
 * Tapping a different tile B emits stage="second" and triggers an immediate
 * swap. UI listens for {@link EventNames.SwapDone} to play a scale
 * out/in animation that keeps the swap atomic.
 *
 * After swapping we verify the board still has moves. If none are found the
 * swap is reverted, {@link EventNames.SwapCancelled} is emitted and the charge
 * is not spent. The player must reactivate the booster to try again.
 */
export class TeleportBooster implements Booster {
  id = "teleport";
  charges: number;
  constructor(
    private board: Board,
    private bus: InfrastructureEventBus,
    charges: number,
  ) {
    this.charges = charges;
  }

  canActivate(): boolean {
    return this.charges > 0;
  }

  start(): void {
    let first: cc.Vec2 | null = null;

    const cancel = (): void => {
      this.bus.off(EventNames.GroupSelected, onSecond);
      this.bus.off(EventNames.InvalidTap, cancel);
      first = null;
      this.bus.emit(EventNames.BoosterCancelled);
      // Wait again for the first selection
      this.bus.once(EventNames.GroupSelected, onFirst);
    };

    const onSecond = async (posB: unknown) => {
      if (this.charges <= 0 || !first) return;
      const b = posB as cc.Vec2;
      // second tap on the same tile acts as cancellation
      if (b.x === first.x && b.y === first.y) {
        cancel();
        return;
      }
      this.bus.off(EventNames.GroupSelected, onSecond);
      this.bus.off(EventNames.InvalidTap, cancel);
      this.bus.emit(EventNames.BoosterTargetSelected, {
        id: this.id,
        stage: "second",
        pos: b,
      });
      // Perform swap with scale animation handled by UI on SwapDone
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
      this.bus.emit(EventNames.BoosterTargetSelected, {
        id: this.id,
        stage: "first",
        pos: first,
      });
      this.bus.on(EventNames.GroupSelected, onSecond);
      // Taps outside the board publish InvalidTap which cancels the booster
      this.bus.on(EventNames.InvalidTap, cancel);
    };

    // Wait for the first cell selection
    this.bus.once(EventNames.GroupSelected, onFirst);
  }
}
