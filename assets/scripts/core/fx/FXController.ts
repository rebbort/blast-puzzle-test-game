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

  /**
   * Stores the prefab used for a particular super-tile. Typically invoked
   * automatically from a component on the super-tile prefab.
   */
  static setPrefab(kind: TileKind, prefab: cc.Prefab): void {
    FXController.prefabs[kind] = prefab;
  }

  /**
   * Instantiates the VFX prefab for the provided kind, parents it to the
   * current scene and waits for its {@link VfxInstance} to finish playing.
   * The instantiated node is destroyed afterwards.
   */
  static async waitForVfx(kind: TileKind): Promise<void> {
    const prefab = FXController.prefabs[kind];
    if (!prefab) {
      return;
    }
    const node = cc.instantiate(prefab);
    const scene = cc.director.getScene?.();
    scene?.addChild(node);
    const instance = node.getComponent(VfxInstance);
    if (!instance) {
      node.destroy();
      return;
    }
    try {
      await instance.play();
    } finally {
      node.destroy();
    }
  }
}
