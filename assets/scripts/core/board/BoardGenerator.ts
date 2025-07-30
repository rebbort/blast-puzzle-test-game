// Utility for generating a random board with a "dead-start" guard.
// The generator ensures at least one pair of orthogonally adjacent tiles
// share the same color so the player always has an opening move.

import * as seedrandom from "seedrandom";
import { Board } from "./Board";
import { TileFactory, TileColor, Tile } from "./Tile";
import { BoardConfig } from "../../config/ConfigLoader";

/**
 * Creates fully populated boards filled with normal tiles.
 * Randomness can be seeded for deterministic results.
 */
export class BoardGenerator {
  /**
   * Generates a board according to provided configuration.
   *
   * - For each cell picks a random color from `cfg.colors`.
   * - Ensures there is at least one horizontal or vertical pair of
   *   adjacent tiles with the same color. This prevents a "dead start"
   *   when the player would have no available moves.
   * - If such a pair is not found the board is regenerated.
   *   Up to 10 attempts are made before the last board is returned.
   *
   * @param cfg Board configuration controlling size and available colors.
   */
  public generate(cfg: BoardConfig): Board {
    // Initialize deterministic or default RNG using seedrandom
    const rng = cfg.rngSeed ? seedrandom(cfg.rngSeed) : seedrandom();

    // Try up to 10 times to avoid dead-start boards
    let last: (Tile | null)[][] = [];
    for (let attempt = 0; attempt < 10; attempt++) {
      // Build a 2D matrix of tiles
      const tiles: (Tile | null)[][] = [];
      for (let y = 0; y < cfg.rows; y++) {
        const row: (Tile | null)[] = [];
        for (let x = 0; x < cfg.cols; x++) {
          // Pick a random color from the list
          const color = cfg.colors[
            Math.floor(rng() * cfg.colors.length)
          ] as TileColor;
          row.push(TileFactory.createNormal(color));
        }
        tiles.push(row);
      }

      // Check for at least one adjacent pair of the same color
      if (BoardGenerator.adjacentSameColor(tiles)) {
        return new Board(cfg, tiles);
      }
      // Save last attempt to return if all retries fail
      last = tiles;
      // Otherwise loop and generate a new board
    }

    // After 10 unsuccessful attempts return the last generated board
    // even if it does not contain a valid move.
    // This edge case should be extremely unlikely with reasonable board sizes.
    return new Board(cfg, last);
  }

  /**
   * Scans the grid for horizontally or vertically adjacent tiles
   * that share the same color.
   *
   * @param tiles Matrix of tiles to analyze.
   * @returns True if at least one matching pair is found.
   */
  private static adjacentSameColor(tiles: (Tile | null)[][]): boolean {
    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[y].length; x++) {
        const current = tiles[y][x];
        if (!current) continue;

        // Compare to right neighbour
        if (x + 1 < tiles[y].length) {
          const right = tiles[y][x + 1];
          if (right && right.color === current.color) {
            return true;
          }
        }
        // Compare to bottom neighbour
        if (y + 1 < tiles.length) {
          const bottom = tiles[y + 1][x];
          if (bottom && bottom.color === current.color) {
            return true;
          }
        }
      }
    }
    return false;
  }
}
