import { Board } from "../Board";
import { EventEmitter2 } from "eventemitter2";
import { ICommand } from "./ICommand";

/**
 * Removes tiles belonging to the provided group from the board.
 * Emits 'removeStart' at the beginning and 'removeDone' with affected
 * column indices when finished.
 */
export class RemoveCommand implements ICommand {
  constructor(
    private board: Board,
    private bus: EventEmitter2,
    private group: cc.Vec2[],
  ) {}

  async execute(): Promise<void> {
    if (this.group.length === 0) {
      throw new Error("RemoveCommand: group is empty");
    }

    // Notify listeners that removal has started
    this.bus.emit("removeStart", this.group);

    const cols = new Set<number>();
    for (const p of this.group) {
      // Ignore coordinates outside the board
      if (!this.board.inBounds(p)) continue;
      if (this.board.tileAt(p)) {
        this.board.setTile(p, null);
        cols.add(p.x);
      }
    }

    // Emit completion event with affected column numbers
    this.bus.emit("removeDone", Array.from(cols));
  }
}
