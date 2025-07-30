const { ccclass, property } = cc._decorator;
import type { Tile } from "../../core/board/Tile";

@ccclass("TileView")
export default class TileView extends cc.Component {
  /** Sprite component displaying tile graphics. */
  @property(cc.Sprite)
  sprite!: cc.Sprite;

  /** Cached tile data represented by this view. */
  private tile!: Tile;

  /** Stores reference to tile for future updates. */
  apply(tile: Tile): void {
    this.tile = tile;
  }
}
