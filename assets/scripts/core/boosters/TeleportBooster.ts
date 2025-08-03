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
 * By default the swap is always applied and a charge is consumed regardless of
 * the board state after the swap. When constructed with `requireMove=true` the
 * swap is reverted if no moves remain, {@link EventNames.SwapCancelled} is
 * emitted and the charge is preserved.
 */
export class TeleportBooster implements Booster {
  id = "teleport";
  charges: number;
  constructor(
    private board: Board,
    private bus: InfrastructureEventBus,
    charges: number,
    /**
     * When true, a swap that doesn't produce any subsequent moves is reverted
     * and the charge isn't spent. Defaults to false meaning the swap always
     * applies and consumes a charge.
     */
    private requireMove = false,
  ) {
    this.charges = charges;
  }

  canActivate(): boolean {
    return this.charges > 0;
  }

  start(): void {
    if (this.charges <= 0) {
      // Activation guard in case service skips canActivate check
      this.bus.emit(EventNames.BoosterCancelled);
      return;
    }

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

      // Cache tiles in case we need to revert
      const tA = this.board.tileAt(first);
      const tB = this.board.tileAt(b);

      // Perform swap with scale animation handled by UI on SwapDone
      await new SwapCommand(this.board, first, b, this.bus).execute();

      if (this.requireMove) {
        const solver = new BoardSolver(this.board);
        if (!solver.hasMoves()) {
          // revert silently without emitting SwapDone again
          if (tA && tB) {
            this.board.setTile(first, tA);
            this.board.setTile(b, tB);
          }
          this.bus.emit(EventNames.SwapCancelled);
          return;
        }
      }

      this.charges--;
      this.bus.emit(EventNames.BoosterConsumed, this.id);
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
