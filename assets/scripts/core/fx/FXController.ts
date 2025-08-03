import { TileKind } from "../board/Tile";

/**
 * Utility responsible for coordinating playback of visual effects for
 * super-tiles. In this test environment it simply waits for a configured
 * duration before resolving. In the real game it would instantiate the
 * appropriate prefab and resolve when its particle system finishes.
 */
export class FXController {
  /** Mapping of super-tile kind to duration in milliseconds. */
  private static readonly durations: Partial<Record<TileKind, number>> = {
    [TileKind.SuperBomb]: 400,
    [TileKind.SuperRow]: 450,
    [TileKind.SuperCol]: 450,
  };

  /**
   * Returns a promise resolving after the VFX for the provided kind finishes.
   * @param kind Type of super tile whose effect should play.
   */
  static waitForVfx(kind: TileKind): Promise<void> {
    const ms = FXController.durations[kind] ?? 0;
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
