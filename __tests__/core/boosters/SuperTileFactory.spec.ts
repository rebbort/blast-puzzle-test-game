import { SuperTileFactory } from "../../../assets/scripts/core/boosters/SuperTileFactory";
import { BoardConfig } from "../../../assets/scripts/config/ConfigLoader";
import { TileKind } from "../../../assets/scripts/core/board/Tile";

const cfg: BoardConfig = {
  cols: 1,
  rows: 1,
  tileWidth: 1,
  tileHeight: 1,
  colors: ["red"],
  superThreshold: 3,
  rngSeed: "seed",
};

// При одинаковом seed последовательность типов детерминирована
it("produces deterministic sequence with same seed", () => {
  const a = new SuperTileFactory(cfg);
  const b = new SuperTileFactory(cfg);
  const seqA = [a.make(), a.make(), a.make()];
  const seqB = [b.make(), b.make(), b.make()];
  expect(seqA).toEqual(seqB);
  for (const k of seqA) {
    expect(k).not.toBe(TileKind.Normal);
  }
});
