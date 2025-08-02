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
   * Создаёт тип супер‑тайла на основе настраиваемых шансов.
   * Если шансы не настроены, используются значения по умолчанию:
   * SuperRow: 50%, SuperCol: 30%, SuperBomb: 15%, SuperClear: 5%
   */
  make(kindSeed = this.rng()): TileKind {
    const chances = this.cfg.superChances;

    if (chances) {
      // Используем настраиваемые шансы
      let cumulative = 0;

      cumulative += chances.row;
      if (kindSeed < cumulative) return TileKind.SuperRow;

      cumulative += chances.col;
      if (kindSeed < cumulative) return TileKind.SuperCol;

      cumulative += chances.bomb;
      if (kindSeed < cumulative) return TileKind.SuperBomb;

      return TileKind.SuperClear;
    } else {
      // Используем значения по умолчанию
      if (kindSeed < 0.5) return TileKind.SuperRow;
      if (kindSeed < 0.8) return TileKind.SuperCol;
      if (kindSeed < 0.95) return TileKind.SuperBomb;
      return TileKind.SuperClear;
    }
  }
}
