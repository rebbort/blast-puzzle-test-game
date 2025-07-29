import { ScoreStrategyQuadratic } from "../assets/scripts/core/rules/ScoreStrategyQuadratic";

describe("ScoreStrategyQuadratic", () => {
  test("calculates score with multiplier", () => {
    const strategy = new ScoreStrategyQuadratic(5);
    expect(strategy.calculate(4)).toBe(45);
  });
});
