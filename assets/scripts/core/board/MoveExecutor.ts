import { Board } from "./Board";
import { EventBus } from "../../infrastructure/EventBus";
import { RemoveCommand } from "./commands/RemoveCommand";
import { FallCommand } from "./commands/FallCommand";
import { FillCommand } from "./commands/FillCommand";
import { TileFactory } from "./Tile";
import { BoardConfig } from "../../config/ConfigLoader";
import { SuperTileFactory } from "../boosters/SuperTileFactory";

/**
 * Executes a full player move by removing a group, letting tiles fall
 * and filling empty spaces. Commands are executed sequentially and the
 * method resolves once all operations are complete.
 */
export class MoveExecutor {
  constructor(
    private board: Board,
    private bus: EventBus,
  ) {}

  async execute(group: cc.Vec2[]): Promise<void> {
    if (group.length === 0) {
      throw new Error("MoveExecutor: group is empty");
    }

    const cfg = (this.board as unknown as { cfg: BoardConfig }).cfg;
    const start = group[0];
    const startTile = this.board.tileAt(start);

    // 1. Remove tiles and wait for completion
    const removeDone = this.wait("removeDone");
    new RemoveCommand(this.board, this.bus, group).execute();
    const [dirtyCols] = (await removeDone) as [number[]];

    // Если размер группы превышает порог, в исходной клетке
    // появляется супер-тайл выбранного вида.
    if (startTile && group.length >= cfg.superThreshold) {
      const kind = new SuperTileFactory(cfg).make();
      const tile = TileFactory.createNormal(startTile.color);
      tile.kind = kind;
      this.board.setTile(start, tile);
    }

    // 2. Let tiles fall in affected columns
    const fallDone = this.wait("fallDone");
    new FallCommand(this.board, this.bus, dirtyCols).execute();
    const [emptySlots] = (await fallDone) as [cc.Vec2[]];

    // 3. Fill empty spaces with new tiles
    const fillDone = this.wait("fillDone");
    new FillCommand(this.board, this.bus, emptySlots).execute();
    await fillDone;

    // Signal completion of the whole move
    this.bus.emit("MoveCompleted");
  }

  /**
   * Helper that returns a promise resolved when the given event fires.
   */
  private wait(event: string): Promise<unknown[]> {
    return new Promise((resolve) => {
      this.bus.once(event, (...args: unknown[]) => resolve(args));
    });
  }
}
