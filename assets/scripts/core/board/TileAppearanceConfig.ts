const { ccclass, property } = cc._decorator;

import { TileKind } from "./Tile";
import { FXController } from "../fx/FXController";

/**
 * Metadata for the visual prefab of a tile.
 * Specifies which kind it belongs to and which visual effects to play.
 */

@ccclass()
export class TileAppearanceConfig extends cc.Component {
  /** Type of super tile (or Normal for normal). */
  private static readonly ccEnum = (
    cc as unknown as { Enum?: (e: object) => unknown }
  ).Enum;
  @property({
    type: TileAppearanceConfig.ccEnum
      ? TileAppearanceConfig.ccEnum(TileKind)
      : TileKind,
  })
  kind: TileKind = TileKind.Normal;

  /**
   * Prefab of the visual effect that plays when the tile appears.
   */
  @property(cc.Prefab)
  spawnFx: cc.Prefab | null = null;

  /**
   * Prefab of the visual effect that plays when the tile is activated
   * (e.g. when a super tile is triggered).
   */
  @property(cc.Prefab)
  activateFx: cc.Prefab | null = null;

  // Additional parameters can be added here (color flashes, multipliers, etc.)

  onLoad(): void {
    if (this.activateFx) {
      FXController.setPrefab(this.kind, this.activateFx);
    }
  }
}
