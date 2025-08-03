import { Board } from "./Board";
import { InfrastructureEventBus } from "../../infrastructure/InfrastructureEventBus";
import { RemoveCommand } from "./commands/RemoveCommand";
import { FallCommand } from "./commands/FallCommand";
import { FillCommand } from "./commands/FillCommand";
import { TileFactory, TileKind } from "./Tile";
import { SuperTileFactory } from "../boosters/SuperTileFactory";
import { EventNames } from "../events/EventNames";
import { FXController } from "../fx/FXController";

/**
 * Executes a full player move by removing a group, letting tiles fall
 * and filling empty spaces. Commands are executed sequentially and the
 * method resolves once all operations are complete.
 */
export class MoveExecutor {
  constructor(
    private board: Board,
    private bus: InfrastructureEventBus,
  ) {}

  async execute(group: cc.Vec2[]): Promise<void> {
    if (group.length === 0) {
      throw new Error("MoveExecutor: group is empty");
    }

    const cfg = this.board.config;
    const start = group[0];
    const startTile = this.board.tileAt(start);
    const hasSuper = group.some((p) => {
      const t = this.board.tileAt(p);
      return t !== null && t.kind !== TileKind.Normal;
    });

    // Collect promises for super-tile VFX that may be triggered during removal.
    // Listener stays active only for this execution and is detached afterwards
    // to avoid capturing unrelated events when multiple moves chain.
    const vfxPromises: Promise<void>[] = [];
    const onSuperActivated = (kind: TileKind, pos: cc.Vec2) => {
      const cfg = this.board.config;
      const x =
        (pos.x - this.board.cols / 2) * cfg.tileWidth + cfg.tileWidth / 2;
      const y =
        (this.board.rows / 2 - pos.y) * cfg.tileHeight - cfg.tileHeight / 2;
      vfxPromises.push(FXController.waitForVfx(kind, cc.v2(x, y)));
    };
    this.bus.on(EventNames.SuperTileActivated, onSuperActivated);

    // 1. Remove tiles and wait for completion. RemoveStarted is emitted inside
    // RemoveCommand immediately, allowing UI to hide tiles before we await any
    // visual effects.
    const removeDone = this.wait(EventNames.TilesRemoved);
    new RemoveCommand(this.board, this.bus, group).execute();
    const [dirtyCols] = (await removeDone) as [number[]];

    // Detach listener and wait for all super-tile effects to finish before
    // starting gravity. This delays FallStarted while keeping RemoveStarted
    // synchronous so explosions aren't covered by new tiles.
    this.bus.off(EventNames.SuperTileActivated, onSuperActivated);
    await Promise.all(vfxPromises);

    // Если размер группы превышает порог, в исходной клетке
    // появляется супер-тайл выбранного вида.
    if (startTile && group.length >= cfg.superThreshold && !hasSuper) {
      const kind = new SuperTileFactory(cfg).make();
      const tile = TileFactory.createNormal(startTile.color);
      tile.kind = kind;
      this.board.setTile(start, tile);
      this.bus.emit(EventNames.SuperTileCreated, start, tile);
    }

    // 2. Let tiles fall in affected columns
    const fallDone = this.wait(EventNames.FallDone);
    new FallCommand(this.board, this.bus, dirtyCols).execute();
    const [emptySlots] = (await fallDone) as [cc.Vec2[]];

    // 3. Fill empty spaces with new tiles
    const fillDone = this.wait(EventNames.FillDone);
    new FillCommand(this.board, this.bus, emptySlots).execute();
    await fillDone;

    // Signal completion of the whole move
    this.bus.emit(EventNames.MoveCompleted);
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
