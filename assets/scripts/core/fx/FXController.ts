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

  /** Fallback durations (ms) for each super tile effect. */
  private static readonly durations: Partial<Record<TileKind, number>> = {
    [TileKind.SuperBomb]: 400,
    [TileKind.SuperRow]: 450,
    [TileKind.SuperCol]: 450,
  };

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
   * The instantiated node is destroyed by the instance when playback ends.
   */
  static async waitForVfx(kind: TileKind): Promise<void> {
    const prefab = FXController.prefabs[kind];
    const duration = FXController.durations[kind];
    if (!prefab) {
      if (duration) {
        await new Promise((r) => setTimeout(r, duration));
      }
      return;
    }
    const node = cc.instantiate(prefab);
    const scene = cc.director.getScene?.();
    scene?.addChild(node);
    let instance = node.getComponent(VfxInstance);
    if (!instance) {
      instance = node.addComponent(VfxInstance);
      instance.particleSystem = node.getComponent(cc.ParticleSystem);
      instance.animation = node.getComponent(cc.Animation);
    }
    let finished = false;
    const play = instance.play().then(() => {
      finished = true;
    });
    if (duration) {
      await Promise.race([
        play,
        new Promise<void>((r) => setTimeout(r, duration)),
      ]);
      if (!finished && cc.isValid?.(node)) {
        node.destroy();
      }
    } else {
      await play;
    }
  }
}
