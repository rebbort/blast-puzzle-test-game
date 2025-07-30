import { Board } from "../Board";
import { EventBus } from "../../../infrastructure/EventBus";
import { ICommand } from "./ICommand";

/**
 * Swaps tiles at two positions on the board and notifies listeners.
 */
export class SwapCommand implements ICommand {
  constructor(
    private board: Board,
    private a: cc.Vec2,
    private b: cc.Vec2,
    private bus: EventBus,
  ) {}

  async execute(): Promise<void> {
    if (!this.board.inBounds(this.a) || !this.board.inBounds(this.b)) {
      throw new Error("SwapCommand: coordinates out of bounds");
    }
    const tA = this.board.tileAt(this.a);
    const tB = this.board.tileAt(this.b);
    this.board.setTile(this.a, tB);
    this.board.setTile(this.b, tA);
    this.bus.emit("SwapDone");
  }
}
