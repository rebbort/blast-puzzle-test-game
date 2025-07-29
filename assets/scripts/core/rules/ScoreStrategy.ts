export interface ScoreStrategy {
  /**
   * Returns score for a group of size n.
   */
  calculate(groupSize: number): number;
}
