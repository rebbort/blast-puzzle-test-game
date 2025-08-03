import * as seedrandom from "seedrandom";
import { BoardConfig } from "../../config/ConfigLoader";
import { TileKind } from "../board/Tile";

/**
 * Returns the type of super tile based on the random number generator.
 * With the same seed, the sequence is deterministic.
 */
export class SuperTileFactory {
  /** Random number generator for choosing the tile type. */
  private rng: () => number;

  constructor(private cfg: BoardConfig) {
    // If a seed is specified, use it for deterministic RNG
    this.rng = cfg.rngSeed ? seedrandom(cfg.rngSeed) : Math.random;
  }

  /**
   * Creates the type of super tile based on customizable chances.
   * If chances are not configured, the default values are used:
   * SuperRow: 50%, SuperCol: 30%, SuperBomb: 15%, SuperClear: 5%
   */
  make(kindSeed = this.rng()): TileKind {
    const chances = this.cfg.superChances;

    if (chances) {
      // Use customizable chances
      let cumulative = 0;

      cumulative += chances.row;
      if (kindSeed < cumulative) return TileKind.SuperRow;

      cumulative += chances.col;
      if (kindSeed < cumulative) return TileKind.SuperCol;

      cumulative += chances.bomb;
      if (kindSeed < cumulative) return TileKind.SuperBomb;

      return TileKind.SuperClear;
    } else {
      // Use default values
      if (kindSeed < 0.5) return TileKind.SuperRow;
      if (kindSeed < 0.8) return TileKind.SuperCol;
      if (kindSeed < 0.95) return TileKind.SuperBomb;
      return TileKind.SuperClear;
    }
  }
}
