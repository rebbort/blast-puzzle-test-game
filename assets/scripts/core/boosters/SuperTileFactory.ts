import * as seedrandom from "seedrandom";
import { BoardConfig, DefaultBoard } from "../../config/ConfigLoader";
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
   * Создаёт тип супер‑тайла на основе распределения из конфигурации.
   * Значения интерпретируются как веса и суммируются слева направо.
   */
  make(kindSeed = this.rng()): TileKind {
    const chances = this.cfg.superChances ?? DefaultBoard.superChances!;
    const row = chances.row;
    const col = row + chances.col;
    const bomb = col + chances.bomb;
    if (kindSeed < row) return TileKind.SuperRow;
    if (kindSeed < col) return TileKind.SuperCol;
    if (kindSeed < bomb) return TileKind.SuperBomb;
    return TileKind.SuperClear;
  }
}
