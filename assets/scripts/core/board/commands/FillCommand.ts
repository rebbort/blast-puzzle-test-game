import { Board } from "../Board";
import { ExtendedEventTarget } from "../../../infrastructure/ExtendedEventTarget";
import { ICommand } from "./ICommand";
import { TileFactory, TileColor } from "../Tile";
import { BoardConfig } from "../../../config/ConfigLoader";
import { EventNames } from "../../events/EventNames";

/**
 * Generates new tiles in provided empty slots.
 * Emits 'FillStarted' and 'FillDone'. No payload is passed with 'FillDone'.
 */
export class FillCommand implements ICommand {
  constructor(
    private board: Board,
    private bus: ExtendedEventTarget,
    private slots: cc.Vec2[],
  ) {}

  private get cfg(): BoardConfig {
    // Retrieve board configuration through type casting to avoid exposing field
    return (this.board as unknown as { cfg: BoardConfig }).cfg;
  }

  async execute(): Promise<void> {
    if (this.slots.length === 0) {
      throw new Error("FillCommand: no slots provided");
    }

    this.bus.emit(EventNames.FillStarted, this.slots);

    for (const p of this.slots) {
      if (!this.board.inBounds(p)) continue;
      const color = this.randomColor();
      this.board.setTile(p, TileFactory.createNormal(color));
    }

    this.bus.emit(EventNames.FillDone);
  }

  private randomColor(): TileColor {
    const colors = this.cfg.colors;
    const idx = Math.floor(Math.random() * colors.length);
    return colors[idx] as TileColor;
  }
}
