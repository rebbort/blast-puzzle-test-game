const { ccclass, property } = cc._decorator;

import type { Tile, TileColor } from "../../core/board/Tile";
import { TileKind } from "../../core/board/Tile";
import { TileAppearanceConfig } from "../../core/board/TileAppearanceConfig";
import { VfxInstance } from "../../core/fx/VfxInstance";

/**
 * TileView represents a game tile. It contains a `visualRoot` container where
 * different visual prefabs are substituted depending on the model.
 */
@ccclass()
export default class TileView extends cc.Component {
  /** Node where visual variants of the tile are instantiated. */
  @property(cc.Node)
  visualRoot: cc.Node = null;

  /** Prefabs of normal tiles (by colors). The order corresponds to the enumeration of colors. */
  @property([cc.Prefab])
  normalVariants: cc.Prefab[] = [];

  /**
   * Prefabs of super‑tiles by index {@link TileKind}.
   * Index 1 → SuperRow, 2 → SuperCol, 3 → SuperBomb, 4 → SuperClear.
   * The array must contain placeholders for unused types to
   * correspond to the values of the enumeration.
   */
  @property([cc.Prefab])
  superVariants: cc.Prefab[] = new Array(TileKind.SuperClear + 1).fill(null!);

  /** Current visual node placed in visualRoot. */
  private currentVisual: cc.Node | null = null;

  /** Prefab of the activation effect taken from {@link TileAppearanceConfig}. */
  private activateFx: cc.Prefab | null = null;

  /** Cache of the tile model for possible updates. */
  public tile!: Tile;

  /** Position of the tile on the board for logging and events. */
  public boardPos: cc.Vec2 = cc.v2(0, 0);

  /** Tile in the falling state. */
  private isFalling = false;
  /** Tile plays the feedback animation. */
  private isFeedbackActive = false;

  /** Returns true if the tile is ready to respond to input. */
  isInteractive(): boolean {
    return !this.isFalling && !this.isFeedbackActive;
  }

  /** Called before the falling animation starts. */
  startFall(): void {
    this.isFalling = true;
  }

  /** Ends the falling state. */
  endFall(): void {
    this.isFalling = false;
  }

  /**
   * Substitutes the appropriate visual prefab for the tile data.
   * The old visual node is removed, then a new one is instantiated in visualRoot.
   * If {@link TileAppearanceConfig.spawnFx} is present, the VFX is played.
   */
  apply(tile: Tile): void {
    this.tile = tile;

    // 1. Select the appropriate prefab by color/kind
    let prefab: cc.Prefab | undefined;
    if (tile.kind === TileKind.Normal) {
      const idx = this.colorIndex(tile.color);
      prefab = this.normalVariants[idx];
    } else {
      prefab = this.superVariants[tile.kind];
    }
    if (!prefab) return;

    // 2. Remove the previous visualization
    if (this.currentVisual) {
      // In the test environment, destroy may be missing
      const maybe = this.currentVisual as unknown as { destroy?: () => void };
      if (typeof maybe.destroy === "function") {
        maybe.destroy();
      }
      this.currentVisual = null;
    }

    // 3. Instantiate a new one and place it in visualRoot
    const node = cc.instantiate(prefab);
    node.parent = this.visualRoot;
    this.currentVisual = node;

    // 4. Read the visual prefab config and play the effects
    const cfg = node.getComponent(TileAppearanceConfig);
    if (cfg) {
      this.activateFx = cfg.activateFx;
      if (cfg.spawnFx) {
        const fx = cc.instantiate(cfg.spawnFx);
        fx.parent = this.node;
      }
    } else {
      this.activateFx = null;
    }
  }

  /**
   * Activates a super‑tile, starting the effect from {@link TileAppearanceConfig}.
   */
  activateSuper(): void {
    if (this.activateFx) {
      const fx = cc.instantiate(this.activateFx);
      // Position effect relative to a persistent layer so it survives tile removal
      const parent =
        (this.node.parent as cc.Node | null) ||
        (cc.director.getScene?.() as cc.Node | null);
      fx.parent = parent || this.node;
      fx.setPosition(this.node.position);

      const instance = fx.getComponent(VfxInstance);
      instance?.play();
      // Prevent repeated activation from triggering the effect again
      this.activateFx = null;
    }
    // Additional indication can be added here
  }

  /** Feedback animation. */
  pressFeedback(): void {
    this.isFeedbackActive = true;
    const target = this.node;

    const defaultAnchor = cc.v2(0, 1);

    const maybe = target as unknown as {
      stopAllActions?: () => void;
      setScale?: (x: number, y?: number) => void;
    };
    if (typeof maybe.stopAllActions === "function") maybe.stopAllActions();
    if (typeof maybe.setScale === "function") maybe.setScale(1, 1);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target.runAction(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cc.sequence as any)(
        cc.scaleTo(0.08, 0.9),
        cc.scaleTo(0.1, 1.0),
        cc.callFunc(() => {
          target.setAnchorPoint(defaultAnchor);
          this.isFeedbackActive = false;
        }),
      ),
    );
  }

  /** Returns the index of the color in the array of normal variants. */
  private colorIndex(color: TileColor): number {
    const order: TileColor[] = ["red", "blue", "green", "yellow", "purple"];
    const idx = order.indexOf(color);
    return idx >= 0 ? idx : 0;
  }
}
