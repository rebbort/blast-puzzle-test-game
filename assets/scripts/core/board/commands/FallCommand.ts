import { Board } from "../Board";
import { InfrastructureEventBus } from "../../../infrastructure/InfrastructureEventBus";
import { ICommand } from "./ICommand";
import { Tile } from "../Tile";
import { BoardConfig } from "../../../config/ConfigLoader";
import { EventNames } from "../../events/EventNames";

/**
 * Shifts tiles down in specified columns to remove gaps.
 * Emits 'FallStarted' and 'FallDone'. The 'FallDone' event carries
 * the list of coordinates that became empty at the top of columns
 * after falling which should be filled by the next command.
 */
export class FallCommand implements ICommand {
  constructor(
    private board: Board,
    private bus: InfrastructureEventBus,
    private columns: number[],
  ) {}

  private get cfg(): BoardConfig {
    // Access board configuration for dimensions without exposing private field
    return (this.board as unknown as { cfg: BoardConfig }).cfg;
  }

  async execute(): Promise<void> {
    if (this.columns.length === 0) {
      throw new Error("FallCommand: no columns specified");
    }

    this.bus.emit(EventNames.FallStarted, this.columns);

    const emptySlots: cc.Vec2[] = [];
    const rows = this.cfg.rows;

    for (const x of this.columns) {
      const kept: Tile[] = [];
      // Collect existing tiles from bottom to top
      for (let y = rows - 1; y >= 0; y--) {
        const t = this.board.tileAt(new cc.Vec2(x, y));
        if (t) {
          kept.push(t);
        }
      }
      // Place tiles starting from bottom
      let y = rows - 1;
      for (const t of kept) {
        this.board.setTile(new cc.Vec2(x, y), t);
        y--;
      }
      // Clear remaining cells and record them as empty
      for (; y >= 0; y--) {
        const p = new cc.Vec2(x, y);
        this.board.setTile(p, null);
        emptySlots.push(p);
      }
    }

    this.bus.emit(EventNames.FallDone, emptySlots);
  }
}
