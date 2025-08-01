import { Board } from "./Board";
import { InfrastructureEventBus } from "../../infrastructure/InfrastructureEventBus";
import { RemoveCommand } from "./commands/RemoveCommand";
import { FallCommand } from "./commands/FallCommand";
import { Tile, TileColor, TileFactory } from "./Tile";
import { BoardConfig } from "../../config/ConfigLoader";
import { SuperTileFactory } from "../boosters/SuperTileFactory";
import { EventNames } from "../events/EventNames";

/** Information about a tile created during filling. */
export interface NewTileInfo {
  pos: cc.Vec2;
  tile: Tile;
}

/** Result returned by {@link fillBoard}. */
export interface FillResult {
  /** Newly generated tiles with their board positions. */
  newTiles: NewTileInfo[];
  /** Columns that were affected by falling/filling. */
  dirtyCols: number[];
}

/**
 * Drops existing tiles down and fills empty spaces with new ones.
 *
 * Falling is performed before generating new tiles so freshly spawned
 * pieces never move during this step. This mirrors the in-game gravity
 * behaviour where tiles settle first and only then new ones appear.
 *
 * @param board Board to operate on.
 * @param bus   Event bus used to emit fill events.
 */
export function fillBoard(
  board: Board,
  bus: InfrastructureEventBus,
): FillResult {
  const cfg = (board as unknown as { cfg: BoardConfig }).cfg;
  const newTiles: NewTileInfo[] = [];
  const dirtyCols: number[] = [];
  const slots: cc.Vec2[] = [];

  for (let x = 0; x < cfg.cols; x++) {
    let write = cfg.rows - 1;
    // Shift existing tiles down in column x
    for (let y = cfg.rows - 1; y >= 0; y--) {
      const t = board.tileAt(new cc.Vec2(x, y));
      if (t) {
        if (y !== write) {
          board.setTile(new cc.Vec2(x, write), t);
          board.setTile(new cc.Vec2(x, y), null);
        }
        write--;
      }
    }

    if (write < cfg.rows - 1) dirtyCols.push(x);

    for (let y = write; y >= 0; y--) {
      slots.push(new cc.Vec2(x, y));
    }
  }

  // Notify listeners that filling is about to start
  bus.emit(EventNames.FillStarted, slots);

  for (const p of slots) {
    const color = randomColor(cfg.colors) as TileColor;
    const tile = TileFactory.createNormal(color);
    board.setTile(p, tile);
    newTiles.push({ pos: p, tile });
  }

  bus.emit(EventNames.FillDone, newTiles, dirtyCols);
  return { newTiles, dirtyCols };
}

function randomColor(colors: string[]): string {
  const idx = Math.floor(Math.random() * colors.length);
  return colors[idx] as string;
}

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

    const cfg = (this.board as unknown as { cfg: BoardConfig }).cfg;
    const start = group[0];
    const startTile = this.board.tileAt(start);

    // 1. Remove tiles and wait for completion
    const removeDone = this.wait(EventNames.TilesRemoved);
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
    const fallDone = this.wait(EventNames.FallDone);
    new FallCommand(this.board, this.bus, dirtyCols).execute();
    await fallDone;

    // 3. Fill empty spaces with new tiles
    fillBoard(this.board, this.bus);

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
