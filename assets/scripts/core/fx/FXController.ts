import { TileKind } from "../board/Tile";
import { VfxInstance } from "./VfxInstance";

/**
 * Utility responsible for coordinating playback of visual effects for
 * super-tiles. It instantiates the appropriate prefab and resolves when the
 * effect finishes playing.
 */
export class FXController {
  /** Registered prefabs for super-tile visual effects. */
  private static readonly prefabs: Partial<Record<TileKind, cc.Prefab>> = {};

  /** Allows the game to provide prefabs for each super-tile kind. */
  static registerPrefab(kind: TileKind, prefab: cc.Prefab): void {
    FXController.prefabs[kind] = prefab;
  }

  /**
   * Instantiates the VFX prefab for the provided kind and waits for its
   * VfxInstance to finish playing.
   */
  static waitForVfx(kind: TileKind): Promise<void> {
    const prefab = FXController.prefabs[kind];
    if (!prefab) {
      return Promise.resolve();
    }
    const node = cc.instantiate(prefab);
    const instance = node.getComponent(VfxInstance);
    if (!instance) {
      node.destroy();
      return Promise.resolve();
    }
    return instance.play();
  }
}
