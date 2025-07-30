import * as seedrandom from "seedrandom";
import { BoardConfig } from "../../config/ConfigLoader";
import { TileKind } from "../board/Tile";

/**
 * Возвращает тип супер‑тайла по генератору случайных чисел.
 * При одинаковом seed последовательность детерминирована.
 */
export class SuperTileFactory {
  /** Генератор случайных чисел для выбора вида тайла. */
  private rng: () => number;

  constructor(private cfg: BoardConfig) {
    // Если указан seed, используем его для детерминированного RNG
    this.rng = cfg.rngSeed ? seedrandom(cfg.rngSeed) : Math.random;
  }

  /**
   * Создаёт тип супер‑тайла. Более слабые SuperRow/SuperCol
   * появляются чаще остальных, поэтому им отведено 80% диапазона.
   * Bomb и Clear встречаются реже, так как их эффект мощнее.
   * Распределение следующее:
   * < 0.5 → {@link TileKind.SuperRow},
   * < 0.8 → {@link TileKind.SuperCol},
   * < 0.95 → {@link TileKind.SuperBomb},
   * иначе → {@link TileKind.SuperClear}.
   */
  make(kindSeed = this.rng()): TileKind {
    if (kindSeed < 0.5) return TileKind.SuperRow;
    if (kindSeed < 0.8) return TileKind.SuperCol;
    if (kindSeed < 0.95) return TileKind.SuperBomb;
    return TileKind.SuperClear;
  }
}
