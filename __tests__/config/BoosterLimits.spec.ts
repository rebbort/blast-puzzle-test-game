import {
  loadBoosterLimits,
  DefaultBoosterLimits,
} from "../../assets/scripts/config/ConfigLoader";
import { BoosterRegistry } from "../../assets/scripts/core/boosters/BoosterRegistry";

describe("loadBoosterLimits", () => {
  beforeEach(() => {
    (
      globalThis as unknown as {
        localStorage: { getItem: () => string | null };
      }
    ).localStorage = {
      getItem: () => null,
    };
  });

  it("returns defaults when storage empty", () => {
    expect(loadBoosterLimits()).toEqual(DefaultBoosterLimits);
  });

  it("merges overrides", () => {
    (
      globalThis as unknown as {
        localStorage: { getItem: () => string | null };
      }
    ).localStorage = {
      getItem: () => JSON.stringify({ maxTypes: 3, maxPerType: { bomb: 5 } }),
    };
    const expected = Object.fromEntries(
      BoosterRegistry.map((b) => [b.id, b.id === "bomb" ? 5 : 10]),
    );
    expect(loadBoosterLimits()).toEqual({
      maxTypes: 3,
      maxPerType: expected,
    });
  });

  it("ignores unknown booster ids", () => {
    (
      globalThis as unknown as {
        localStorage: { getItem: () => string | null };
      }
    ).localStorage = {
      getItem: () =>
        JSON.stringify({ maxPerType: { ghost: 7, bomb: 4 }, maxTypes: 5 }),
    };
    const expected = Object.fromEntries(
      BoosterRegistry.map((b) => [b.id, b.id === "bomb" ? 4 : 10]),
    );
    expect(loadBoosterLimits()).toEqual({
      maxTypes: 5,
      maxPerType: expected,
    });
  });
});
