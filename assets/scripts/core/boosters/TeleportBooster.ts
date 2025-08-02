import { Booster } from "./Booster";
import { Board } from "../board/Board";
import { InfrastructureEventBus } from "../../infrastructure/InfrastructureEventBus";
import { SwapCommand } from "../board/commands/SwapCommand";
import { BoardSolver } from "../board/BoardSolver";
import { EventNames } from "../events/EventNames";

/**
 * Teleport booster allows swapping any two tiles.
 * The first click selects tile A, the second selects tile B.
 * A second tap on the same tile or a tap outside the board cancels the
 * selection and emits BoosterCancelled without spending a charge. Only
 * teleports support cancellation; super‑tile boosters consume their charge
 * immediately to prevent free retries.
 * After the swap we check if the board has any available moves.
 * If none are found the swap is reverted and charges stay intact.
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
      this.bus.on(EventNames.GroupSelected, onSecond);
      // Taps outside the board publish InvalidTap which cancels the booster
      this.bus.on(EventNames.InvalidTap, cancel);
    };

    // Wait for the first cell selection
    this.bus.once(EventNames.GroupSelected, onFirst);
  }
}
