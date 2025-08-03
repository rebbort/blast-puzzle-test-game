const { ccclass, property } = cc._decorator;
import { TileKind } from "../board/Tile";
import { FXController } from "./FXController";

/**
 * Component placed on a super-tile prefab to register its VFX prefab
 * with the {@link FXController} when instantiated.
 */
@ccclass("VfxPrefab")
export class VfxPrefab extends cc.Component {
  @property({ type: cc.Enum(TileKind) })
  kind: TileKind = TileKind.Normal;

  @property(cc.Prefab)
  vfx: cc.Prefab | null = null;

  onLoad(): void {
    if (this.vfx) {
      FXController.setPrefab(this.kind, this.vfx);
    }
  }
}

export default VfxPrefab;
