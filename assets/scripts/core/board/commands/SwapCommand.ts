import { Board } from "../Board";
import { InfrastructureEventBus } from "../../../infrastructure/InfrastructureEventBus";
import { ICommand } from "./ICommand";
import { EventNames } from "../../events/EventNames";

/**
 * Swaps tiles at two positions on the board and notifies listeners.
 */
export class SwapCommand implements ICommand {
  constructor(
    private board: Board,
    private a: cc.Vec2,
    private b: cc.Vec2,
    private bus: InfrastructureEventBus,
  ) {}

  async execute(): Promise<void> {
    if (!this.board.inBounds(this.a) || !this.board.inBounds(this.b)) {
      throw new Error("SwapCommand: coordinates out of bounds");
    }
    const tA = this.board.tileAt(this.a);
    const tB = this.board.tileAt(this.b);
    this.board.setTile(this.a, tB);
    this.board.setTile(this.b, tA);
    // Notify listeners with coordinates so UI can animate the swap
    this.bus.emit(EventNames.SwapDone, this.a, this.b);
  }
}
