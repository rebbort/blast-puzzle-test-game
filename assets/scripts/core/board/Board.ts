import { Vec2 } from "cc";
import { BoardConfig } from "../../config/BoardConfig";
import { Tile, TileColor } from "./Tile";

/**
 * Two-dimensional game board storing tiles with utility methods.
 */
export class Board {
  /** Configuration describing board dimensions. */
  private readonly cfg: BoardConfig;
  /** Matrix of tiles stored by [row][col]. */
  private readonly grid: (Tile | null)[][];

  /**
   * Creates a board. If an initial matrix of tiles is not provided, the board
   * is filled with null values according to the configuration size.
   * @param cfg Board configuration with rows and columns
   * @param tiles Optional existing matrix of tiles
   */
  constructor(cfg: BoardConfig, tiles?: (Tile | null)[][]) {
    this.cfg = cfg;
    this.grid = [];
    for (let y = 0; y < cfg.rows; y++) {
      if (tiles && tiles[y]) {
        // copy provided row and normalize its length
        const row: (Tile | null)[] = [];
        for (let x = 0; x < cfg.cols; x++) {
          row[x] = tiles[y][x] ?? null;
        }
        this.grid[y] = row;
      } else {
        // create an empty row
        this.grid[y] = Array(cfg.cols).fill(null);
      }
    }
  }

  /**
   * Checks whether a point lies within board boundaries.
   * Coordinates are zero-based and inclusive on the lower bound but exclusive
   * on the upper bound.
   * @param p Point to test
   * @returns True if the point is inside the board
   */
  public inBounds(p: Vec2): boolean {
    return p.x >= 0 && p.y >= 0 && p.x < this.cfg.cols && p.y < this.cfg.rows;
  }

  /**
   * Returns the tile located at the given point.
   * @param p Board coordinates
   * @returns Tile object or null if the position is empty or out of bounds
   */
  public tileAt(p: Vec2): Tile | null {
    return this.inBounds(p) ? this.grid[p.y][p.x] : null;
  }

  /**
   * Returns the color of the tile at the specified point.
   * @param p Board coordinates
   * @returns Color of tile or null when no tile is present or point is invalid
   */
  public colorAt(p: Vec2): TileColor | null {
    const tile = this.tileAt(p);
    return tile ? tile.color : null;
  }

  /**
   * Places a tile at the specified position.
   * Throws an error when coordinates lie outside of the board.
   * @param p Board coordinates
   * @param t Tile to place or null to clear the cell
   */
  public setTile(p: Vec2, t: Tile | null): void {
    if (!this.inBounds(p)) {
      throw new Error(`setTile out of bounds: (${p.x}, ${p.y})`);
    }
    this.grid[p.y][p.x] = t;
  }

  /**
   * Returns coordinates of orthogonal neighbours of the given point.
   * Order: up, right, down, left. Points outside the board are omitted.
   * @param p Central point
   * @returns Array of neighbouring coordinates
   */
  public neighbors4(p: Vec2): Vec2[] {
    const result: Vec2[] = [];
    const candidates = [
      new Vec2(p.x, p.y - 1),
      new Vec2(p.x + 1, p.y),
      new Vec2(p.x, p.y + 1),
      new Vec2(p.x - 1, p.y),
    ];
    for (const c of candidates) {
      if (this.inBounds(c)) {
        result.push(c);
      }
    }
    return result;
  }

  /**
   * Iterates over all cells of the board invoking callback for non-null tiles.
   * @param callback Function called with coordinates and tile
   */
  public forEach(callback: (p: Vec2, t: Tile) => void): void {
    for (let y = 0; y < this.cfg.rows; y++) {
      for (let x = 0; x < this.cfg.cols; x++) {
        const tile = this.grid[y][x];
        if (tile) {
          callback(new Vec2(x, y), tile);
        }
      }
    }
  }
}
