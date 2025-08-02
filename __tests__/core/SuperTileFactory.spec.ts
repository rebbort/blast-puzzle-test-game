import { SuperTileFactory } from "../../assets/scripts/core/boosters/SuperTileFactory";
import { BoardConfig } from "../../assets/scripts/config/ConfigLoader";
import { TileKind } from "../../assets/scripts/core/board/Tile";

const cfg: BoardConfig = {
  cols: 1,
  rows: 1,
  tileWidth: 1,
  tileHeight: 1,
  colors: ["red"],
  superThreshold: 3,
  rngSeed: "test-seed",
};

test("deterministic kinds with same seed", () => {
  const a = new SuperTileFactory(cfg);
  const b = new SuperTileFactory(cfg);
  const seqA = [a.make(), a.make(), a.make()];
  const seqB = [b.make(), b.make(), b.make()];
  expect(seqA).toEqual(seqB);
  // sequence should contain valid super kinds
  for (const k of seqA) {
    expect(k).not.toBe(TileKind.Normal);
  }
});

test("respects super tile chances from config", () => {
  const custom: BoardConfig = {
    ...cfg,
    superChances: { row: 0, col: 0, bomb: 1, clear: 0 },
  };
  const factory = new SuperTileFactory(custom);
  expect(factory.make(0)).toBe(TileKind.SuperBomb);
  expect(factory.make(0.5)).toBe(TileKind.SuperBomb);
  expect(factory.make(0.99)).toBe(TileKind.SuperBomb);
});
