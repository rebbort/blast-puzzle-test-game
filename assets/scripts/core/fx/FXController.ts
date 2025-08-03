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

  /** Layer that instantiated effects will be parented to. */
  private static layer: cc.Node | null = null;

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

  /** Sets the parent node for instantiated VFX. */
  static setLayer(node: cc.Node): void {
    FXController.layer = node;
  }

  /**
   * Instantiates the VFX prefab for the provided kind, parents it to the
   * current scene and waits for its {@link VfxInstance} to finish playing.
   * The instantiated node is destroyed by the instance when playback ends.
   */
  static async waitForVfx(kind: TileKind, position?: cc.Vec2): Promise<void> {
    const prefab = FXController.prefabs[kind];
    const duration = FXController.durations[kind];
    if (!prefab) {
      if (duration) {
        await new Promise((r) => setTimeout(r, duration));
      }
      return;
    }
    const node = cc.instantiate(prefab);
    const parent = FXController.layer || cc.director.getScene?.();
    parent?.addChild(node);
    if (position) {
      node.setPosition(position);
    }
    node.zIndex = 9999;
    const instance =
      node.getComponent(VfxInstance) || node.addComponent(VfxInstance);
    if (instance.particleSystems.length === 0) {
      instance.particleSystems = node.getComponentsInChildren(
        cc.ParticleSystem,
      );
    }
    if (instance.animations.length === 0) {
      instance.animations = node.getComponentsInChildren(cc.Animation);
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
