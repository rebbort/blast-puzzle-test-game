/**
 * Definitions of the game tile model.
 */

/**
 * Possible colors of tiles on the board.
 */
export type TileColor = "red" | "blue" | "green" | "yellow" | "purple";

/**
 * Enumeration of tile types.
 */
export enum TileKind {
  /** normal tile */
  Normal,
  /** super tile: burns a row */
  SuperRow,
  /** super tile: burns a column */
  SuperCol,
  /** radius R */
  SuperBomb,
  /** clears the entire field */
  SuperClear,
}

/**
 * Interface of the game tile.
 */
export interface Tile {
  /** unique identifier */
  id: number;
  /** color of the tile */
  color: TileColor;
  /** type of the tile */
  kind: TileKind;
}

/**
 * Factory for creating tiles.
 */
export class TileFactory {
  /** counter of identifiers */
  private static nextId = 0;

  /**
   * Creates a normal tile of the given color.
   * @param color Color of the tile
   * @returns New tile with type {@link TileKind.Normal}
   */
  public static createNormal(color: TileColor): Tile {
    return {
      id: ++this.nextId,
      color,
      kind: TileKind.Normal,
    };
  }
}
