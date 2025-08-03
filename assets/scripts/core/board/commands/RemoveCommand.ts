import { Board } from "../Board";
import { InfrastructureEventBus } from "../../../infrastructure/InfrastructureEventBus";
import { ICommand } from "./ICommand";
import { EventNames } from "../../events/EventNames";
import { TileKind } from "../Tile";

/**
 * Removes tiles belonging to the provided group from the board.
 * Emits 'RemoveStarted' at the beginning and 'TilesRemoved' with affected
 * column indices when finished.
 */
export class RemoveCommand implements ICommand {
  constructor(
    private board: Board,
    private bus: InfrastructureEventBus,
    private group: cc.Vec2[],
  ) {}

  async execute(): Promise<void> {
    if (this.group.length === 0) {
      throw new Error("RemoveCommand: group is empty");
    }

    // Notify listeners that removal has started
    this.bus.emit(EventNames.RemoveStarted, this.group);

    const cols = new Set<number>();
    for (const p of this.group) {
      // Ignore coordinates outside the board
      if (!this.board.inBounds(p)) continue;
      const tile = this.board.tileAt(p);
      if (tile) {
        // Emit activation event for any super tile so FX can play before gravity.
        if (tile.kind !== TileKind.Normal) {
          this.bus.emit(EventNames.SuperTileActivated, tile.kind);
        }
        this.board.setTile(p, null);
        cols.add(p.x);
      }
    }

    // Emit completion event with affected column numbers
    this.bus.emit(EventNames.TilesRemoved, Array.from(cols));
  }
}
