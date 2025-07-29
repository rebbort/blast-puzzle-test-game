import { Vec2 } from "cc";
import { Board } from "../Board";
import { EventEmitter2 } from "eventemitter2";
import { ICommand } from "./ICommand";
import { TileFactory, TileColor } from "../Tile";
import { BoardConfig } from "../../../config/BoardConfig";

/**
 * Generates new tiles in provided empty slots.
 * Emits 'fillStart' and 'fillDone'. No payload is passed with 'fillDone'.
 */
export class FillCommand implements ICommand {
  constructor(
    private board: Board,
    private bus: EventEmitter2,
    private slots: Vec2[],
  ) {}

  private get cfg(): BoardConfig {
    // Retrieve board configuration through type casting to avoid exposing field
    return (this.board as unknown as { cfg: BoardConfig }).cfg;
  }

  async execute(): Promise<void> {
    if (this.slots.length === 0) {
      throw new Error("FillCommand: no slots provided");
    }

    this.bus.emit("fillStart", this.slots);

    for (const p of this.slots) {
      if (!this.board.inBounds(p)) continue;
      const color = this.randomColor();
      this.board.setTile(p, TileFactory.createNormal(color));
    }

    this.bus.emit("fillDone");
  }

  private randomColor(): TileColor {
    const colors = this.cfg.colors;
    const idx = Math.floor(Math.random() * colors.length);
    return colors[idx] as TileColor;
  }
}
