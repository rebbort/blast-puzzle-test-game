import {
  loadBoosterLimits,
  DefaultBoosterLimits,
} from "../../assets/scripts/config/ConfigLoader";

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
    expect(loadBoosterLimits()).toEqual({
      maxTypes: 3,
      maxPerType: {
        teleport: 10,
        superRow: 10,
        superCol: 10,
        bomb: 5,
      },
    });
  });
});
