const { ccclass, property } = cc._decorator;
import type { Tile } from "../../core/board/Tile";

@ccclass("TileView")
export default class TileView extends cc.Component {
  /** Sprite component displaying tile graphics. */
  @property(cc.Sprite)
  sprite!: cc.Sprite;

  /**
   * Applies tile data to this view.
   * Currently sets the node name to the tile color so tests can inspect it.
   */
  apply(tile: Tile): void {
    // In a real project we would map the tile color to a sprite frame.
    // For the simplified environment we store the color on the node name.
    // This helps verify correctness without engine specific assets.
    (this.node as unknown as { name: string }).name = tile.color;
  }
}
