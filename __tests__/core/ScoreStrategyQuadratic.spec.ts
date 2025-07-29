import { ScoreStrategyQuadratic } from "../../assets/scripts/core/rules/ScoreStrategyQuadratic";

// typical case with multiplier
it("calculates quadratic score", () => {
  const s = new ScoreStrategyQuadratic(2);
  expect(s.calculate(4)).toBe(18);
});

// boundary: single tile gives zero
it("returns zero for size one", () => {
  const s = new ScoreStrategyQuadratic();
  expect(s.calculate(1)).toBe(0);
});

// large group to check growth
it("scales with square of size", () => {
  const s = new ScoreStrategyQuadratic(1);
  expect(s.calculate(6)).toBe(25);
});
