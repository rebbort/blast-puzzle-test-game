import { ScoreStrategy } from "./ScoreStrategy";

/**
 * Quadratic scoring strategy rewarding large groups.
 *
 * Points are calculated as `(size - 1)^2 * multiplier`. Subtracting one
 * makes single-tile groups worth zero points, encouraging players to clear
 * at least two tiles. Squaring the size rapidly increases reward for large
 * groups so players aim for big combos. The multiplier adjusts overall pace
 * of scoring.
 */
export class ScoreStrategyQuadratic implements ScoreStrategy {
  /**
   * @param multiplier Coefficient applied to the quadratic result. Defaults to 10.
   */
  constructor(private multiplier = 10) {}

  /**
   * Calculates score for the given group size.
   * @param size Number of tiles in the removed group
   * @returns Amount of points awarded
   */
  calculate(size: number): number {
    return Math.pow(size - 1, 2) * this.multiplier;
  }
}
